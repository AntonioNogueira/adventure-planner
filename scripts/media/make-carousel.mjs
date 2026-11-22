// Renders an Instagram carousel (1080×1350 PNG slides) from scripts/media/carousel.ts. Needs the dev server.
//   node scripts/media/make-carousel.mjs africa
import { createRequire } from 'module';
import { mkdirSync } from 'fs';
import path from 'path';
const { chromium } = createRequire(import.meta.url)('playwright');

const deck = process.argv[2] || 'africa';
const base = 'http://localhost:5179';
const out = path.resolve('marketing/out', `carousel-${deck}`);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 540, height: 675 }, deviceScaleFactor: 2 });
page.on('pageerror', e => console.error('page error:', e.message));
let count = 1;
for (let i = 0; i < count; i++) {
  await page.goto(`${base}/scripts/media/carousel.html?deck=${deck}&slide=${i}`);
  await page.waitForFunction(() => window.slideReady || window.slideError, null, { timeout: 60000 });
  const err = await page.evaluate(() => window.slideError);
  if (err) throw new Error(err);
  count = await page.evaluate(() => window.slideCount);
  await page.locator('.slide').screenshot({ path: path.join(out, `${String(i + 1).padStart(2, '0')}.png`) });
}
await browser.close();
console.log(`${count} slides in ${out}`);
