// "Planned in 60 seconds": a screen recording of the real app turning one sentence into a trip (route, stops,
// places, budget), with captions, the wait cut short, and a short outro clip. Vertical 1080×1920 for Reels/Shorts.
// Needs the dev server (npx vite --port 5179) with an AI key, and ffmpeg.
//   node scripts/media/make-demo.mjs moto            (demos are listed below)
//   node scripts/media/make-demo.mjs bike --outro path/to/clip.mp4
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { mkdirSync, readdirSync, renameSync, rmSync, existsSync } from 'fs';
import path from 'path';
const { chromium } = createRequire(import.meta.url)('playwright');

const DEMOS = {
  moto: {
    hook: 'EN2 on a motorbike.\nPlanned in 60 seconds.',
    prompt: 'Estrada Nacional 2 by motorcycle from Chaves to Faro in 4 days via Vila Real, Viseu, Abrantes and Castro Verde, staying in guesthouses',
    reply: 'Just me',
    outroText: 'Your next ride starts\nwith one sentence.',
  },
  bike: {
    hook: 'Porto to Lisbon by bike.\nPlanned in 60 seconds.',
    prompt: 'Porto to Lisbon along the Atlantic coast by gravel bike in 5 days, camping, via Aveiro, Figueira da Foz and Nazaré',
    reply: 'A couple',
    outroText: 'Your next adventure starts\nwith one sentence.',
  },
  hike: {
    hook: 'The Fishermen’s Trail.\nPlanned in 60 seconds.',
    prompt: 'Hike the Fishermen’s Trail on the Rota Vicentina from Porto Covo to Odeceixe in 4 days, staying in guesthouses',
    reply: 'A group',
    outroText: 'Your next trail starts\nwith one sentence.',
  },
};

const name = process.argv[2] || 'moto';
const demo = DEMOS[name];
if (!demo) throw new Error(`Unknown demo ${name}: ${Object.keys(DEMOS).join(', ')}`);
const opt = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const outro = opt('outro', '');
const out = path.resolve('marketing/out');
const work = path.join(out, `.demo-${name}-${process.pid}`);
mkdirSync(work, { recursive: true });
const FONT = '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf';

const W = 720, H = 1280;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const context = await browser.newContext({ viewport: { width: W, height: H }, locale: 'en-IE', timezoneId: 'Europe/Lisbon', recordVideo: { dir: work, size: { width: W, height: H } } });
const page = await context.newPage();
const t0 = Date.now();
const marks = {};
const mark = k => { marks[k] = (Date.now() - t0) / 1000; };
const caption = (text, big = false) => page.evaluate(({ text, big }) => {
  let el = document.getElementById('demo-caption');
  if (!el) {
    el = document.createElement('div');
    el.id = 'demo-caption';
    document.body.appendChild(el);
  }
  el.style.cssText = big
    ? 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;text-align:center;white-space:pre-line;background:rgba(11,22,34,.88);color:#fff;font:800 46px/1.15 "Liberation Sans",Arial,sans-serif;padding:40px'
    : 'position:fixed;left:50%;top:150px;transform:translateX(-50%);z-index:2147483647;max-width:86%;text-align:center;white-space:pre-line;background:#047857;color:#fff;font:800 28px/1.2 "Liberation Sans",Arial,sans-serif;padding:12px 20px;border-radius:14px;box-shadow:0 6px 20px rgba(0,0,0,.35)';
  el.textContent = text;
  el.style.display = text ? (big ? 'flex' : 'block') : 'none';
}, { text, big });

await page.goto('http://localhost:5179/', { waitUntil: 'networkidle' }).catch(() => undefined);
await page.getByRole('button', { name: 'Accept' }).click({ timeout: 5000 }).catch(() => undefined);
await caption(demo.hook, true);
mark('hook');
await page.waitForTimeout(2600);
await caption('');
const box = page.locator('textarea:visible').last();
await box.click();
await caption('1. Say where you want to go');
await box.pressSequentially(demo.prompt, { delay: 28 });
await page.waitForTimeout(500);
await page.getByRole('button', { name: /Plan my adventure/i }).click();
mark('submit');
await caption('2. The AI plans the route…');
// The route and the places near each stop: wait for the planner to finish (cut short in the edit).
const busy = /Planning your route|Finding places near your stops|finding stops|Building/i;
await page.waitForFunction(() => !!document.querySelector('.maplibregl-canvas'), null, { timeout: 60000 }).catch(() => undefined);
for (let i = 0; i < 90; i++) {
  await page.waitForTimeout(1000);
  const txt = await page.locator('body').innerText();
  if (i > 3 && !busy.test(txt) && /Day 1/.test(txt)) break;
}
mark('ready');
await caption('3. Route, nights and stops');
await page.waitForTimeout(3200);
// Answer the AI's follow-up question, as a traveller would.
const reply = page.getByRole('button', { name: demo.reply, exact: true });
if (await reply.count()) {
  await caption('4. It asks, you tap');
  await reply.first().click().catch(() => undefined);
  mark('reply');
  for (let i = 0; i < 40; i++) { await page.waitForTimeout(1000); if (!busy.test(await page.locator('body').innerText())) break; }
  mark('replied');
  await page.waitForTimeout(1500);
}
// The day-by-day plan.
await caption('5. Day by day, with the weather');
const panel = page.locator('aside').first();
await panel.evaluate(el => el.scrollTo({ top: el.scrollHeight * 0.45, behavior: 'smooth' })).catch(() => undefined);
await page.waitForTimeout(3000);
// Places to sleep, eat, fix the bike…
await caption('6. Where to sleep, eat and refuel');
await page.getByRole('button', { name: /Stay/ }).first().click().catch(() => undefined);
await page.waitForTimeout(3000);
// The budget.
await caption('7. And what it will cost');
await page.getByRole('button', { name: 'Budget', exact: true }).first().click().catch(() => undefined);
await page.waitForTimeout(4000);
await caption('Planned in 60 seconds.\nLink in bio.', true);
await page.waitForTimeout(2200);
mark('end');
const video = page.video();
await context.close();
await browser.close();
const raw = path.join(work, 'raw.webm');
renameSync(await video.path(), raw);
console.log('marks', marks);

// Edit: keep the planning wait to 2.5 s (sped up), and the reply wait to 1.5 s.
const parts = [];
const cut = (a, b, speed = 1) => parts.push({ a, b, speed });
const s = marks.submit, r = marks.ready;
cut(marks.hook, s + 1.2);
if (r - s > 4) cut(s + 1.2, r, (r - s - 1.2) / 2.5); else cut(s + 1.2, r);
if (marks.reply) {
  cut(r, marks.reply + 0.8);
  const w = marks.replied - marks.reply - 0.8;
  if (w > 2) cut(marks.reply + 0.8, marks.replied, w / 1.5); else cut(marks.reply + 0.8, marks.replied);
  cut(marks.replied, marks.end);
} else cut(r, marks.end);
const segs = parts.map((p, i) => {
  const f = path.join(work, `seg${i}.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', p.a.toFixed(2), '-to', p.b.toFixed(2), '-i', raw,
    '-vf', `setpts=PTS/${p.speed.toFixed(3)},scale=1080:1920:flags=lanczos,fps=30`, '-an', '-c:v', 'libx264', '-crf', '19', '-pix_fmt', 'yuv420p', f]);
  return f;
});
// Outro: the clip cropped to 9:16, 5 s, with the line and the name.
if (outro && existsSync(outro)) {
  const f = path.join(work, 'outro.mp4');
  const text = demo.outroText.replace(/:/g, '\\:').replace(/'/g, '’');
  const lines = text.split('\n');
  const draw = lines.map((l, i) => `drawtext=fontfile=${FONT}:text='${l}':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=h*0.36+${i * 80}:shadowcolor=black@0.6:shadowx=3:shadowy=3`).join(',');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '1', '-t', '5', '-i', outro,
    '-vf', `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,${draw},drawtext=fontfile=${FONT}:text='ADVENTURE PLANNER · LINK IN BIO':fontcolor=white:fontsize=34:x=(w-text_w)/2:y=h*0.82:shadowcolor=black@0.6:shadowx=2:shadowy=2,fade=t=in:st=0:d=0.4`,
    '-an', '-c:v', 'libx264', '-crf', '19', '-pix_fmt', 'yuv420p', f]);
  segs.push(f);
}
const list = path.join(work, 'list.txt');
execFileSync('bash', ['-c', `printf "file '%s'\\n" ${segs.map(f => `'${f}'`).join(' ')} > '${list}'`]);
const file = path.join(out, `demo-${name}.mp4`);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', file]);
rmSync(work, { recursive: true, force: true });
console.log(`done: ${file}`);
