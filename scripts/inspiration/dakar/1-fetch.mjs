import { writeFileSync, existsSync, readFileSync } from 'node:fs';
const dir = process.argv[2];
const UA = 'Munditrails/1.0 (journey map builder)';
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function raw(host, title) {
  for (let hop = 0; hop < 3; hop++) {
    const res = await fetch(`https://${host}/w/index.php?title=${encodeURIComponent(title)}&action=raw`, { headers: { 'User-Agent': UA } });
    await sleep(2000);
    if (!res.ok) return null;
    const t = await res.text();
    const m = t.match(/^#(?:REDIRECT|REDIRECTION)\s*\[\[([^\]#]+)/i);
    if (!m) return { title, text: t };
    title = m[1];
  }
  return null;
}
for (let y = 1979; y <= 2026; y++) {
  if (y === 2008) continue;
  const f = `${dir}/en-${y}.txt`;
  if (!existsSync(f)) {
    const r = await raw('en.wikipedia.org', `${y} Dakar Rally`);
    writeFileSync(f, r ? `TITLE: ${r.title}\n${r.text}` : 'MISSING');
  }
  const en = readFileSync(f, 'utf8');
  const hasTable = /\{\{flagicon\|[A-Z]{3}\}\}[^\n|]*\[\[[^\]]+\]\][^\n]*\|\|[^\n]*\{\{flagicon/.test(en);
  if (false) {
    let r = await raw('fr.wikipedia.org', `Rallye Dakar ${y}`);
    if (!r) r = await raw('fr.wikipedia.org', `Paris-Dakar ${y}`);
    writeFileSync(`${dir}/fr-${y}.txt`, r ? `TITLE: ${r.title}\n${r.text}` : 'MISSING');
  }
  console.log(y, en.split('\n')[0].slice(0, 60), hasTable ? 'table' : 'no table');
}
