// Renders a journey as an MP4 for Reels / Shorts (vertical, 1080×1920) or YouTube (horizontal, 1920×1080).
// Needs the dev server running (npx vite --port 5179) and ffmpeg.
//   node scripts/media/make-video.mjs long-way-round vertical
//   node scripts/media/make-video.mjs dakar-1979 horizontal --fps 25 --cta "Plan your own: link in bio"
import { createRequire } from 'module';
// Playwright: the project's copy, else the one installed on the machine.
const { chromium } = createRequire(import.meta.url)('playwright');
import { execFileSync } from 'child_process';
import { mkdirSync, rmSync } from 'fs';
import path from 'path';

const [id = 'long-way-round', format = 'vertical'] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const opt = (name, def) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : def; };
const fps = Number(opt('fps', 25));
const base = opt('url', 'http://localhost:5179');
const cta = opt('cta', '');
const out = path.resolve(opt('out', 'marketing/out'));
const frames = path.join(out, `.frames-${id}-${format}`);
rmSync(frames, { recursive: true, force: true });
mkdirSync(frames, { recursive: true });

const size = format === 'horizontal' ? { width: 960, height: 540 } : { width: 540, height: 960 };
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: size, deviceScaleFactor: 2 });
page.on('pageerror', e => console.error('page error:', e.message));
const url = `${base}/scripts/media/route-video.html?id=${encodeURIComponent(id)}&format=${format}${cta ? `&cta=${encodeURIComponent(cta)}` : ''}`;
const open = async () => {
  await page.goto(url);
  await page.waitForFunction(() => window.videoReady || window.videoError, null, { timeout: 120000 });
  const err = await page.evaluate(() => window.videoError);
  if (err) throw new Error(err);
  return page.evaluate(() => window.videoDuration);
};
const duration = await open();
const count = Math.ceil(duration * fps);
console.log(`${id} ${format}: ${duration.toFixed(1)} s, ${count} frames`);
const started = Date.now();
for (let i = 0; i < count; i++) {
  // If the page reloads (the dev server reloads pages when files change) or a frame times out, reopen and redo it.
  for (let attempt = 0; ; attempt++) {
    try {
      await page.evaluate(t => window.renderAt(t), i / fps);
      await page.screenshot({ path: path.join(frames, `${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 88, timeout: 60000 });
      break;
    } catch (err) {
      if (attempt >= 3) throw err;
      console.warn(`  frame ${i}: ${String(err).split('\n')[0]}; reopening`);
      await open().catch(() => undefined);
    }
  }
  if (i % 100 === 0) console.log(`  frame ${i}/${count} (${Math.round((Date.now() - started) / 1000)} s)`);
}
await browser.close();
const file = path.join(out, `${id}-${format}.mp4`);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(frames, '%05d.jpg'),
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', file]);
rmSync(frames, { recursive: true, force: true });
console.log(`done: ${file} (${Math.round((Date.now() - started) / 1000)} s)`);
