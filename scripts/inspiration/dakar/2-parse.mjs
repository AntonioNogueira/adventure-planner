import { readFileSync, writeFileSync } from 'node:fs';
const dir = process.argv[2];
const out = {};
const clean = c => c.replace(/<ref[^>]*\/>|<ref[^>]*>[\s\S]*?<\/ref>/g, '').replace(/^\s*(?:(?:style|align|rowspan|colspan|class|bgcolor)\s*=\s*"?[^|"]*"?\s*)+\|(?!\|)/i, '').trim();
const MONTH = /january|february|march|april|may|june|july|august|september|october|november|december|monday|tuesday|wednesday|thursday|friday|saturday|sunday|janvier|^\d|km|rest day|^prologue$|^stage/i;
function placeOf(cell) {
  cell = clean(cell);
  const flag = cell.match(/\{\{flag(?:icon|country)?\|([A-Z]{3})/)?.[1] || '';
  const m = cell.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
  let article = m ? m[1].trim() : '', name = m ? (m[2] || m[1]) : cell.replace(/\{\{[^}]*\}\}/g, '').replace(/'''?/g, '');
  name = name.replace(/\s*\(.*?\)\s*/g, ' ').replace(/,.*$/, '').replace(/<[^>]+>/g, '').trim();
  if (!name || MONTH.test(name) || name.length > 40 || /^[-–—]+$/.test(name)) return null;
  return { name, article, country: flag };
}
function cellsOf(row) {
  const lines = row.split('\n').filter(l => /^[|!]/.test(l) && !/^\|[-}]/.test(l));
  return lines.flatMap(l => l.replace(/^[|!]/, '').split(/\|\||!!/));
}
for (let y = 1979; y <= 2026; y++) {
  if (y === 2008) continue;
  let t; try { t = readFileSync(`${dir}/en-${y}.txt`, 'utf8'); } catch { continue; }
  let stages = [];
  for (const tb of t.split('{|').slice(1).map(x => x.split('\n|}')[0])) {
    const rows = tb.split(/\n\|-[^\n]*/);
    const head = rows.find(r => /\n?!/.test(r) && /start|depart|from/i.test(r) && /finish|arriv|bivouac|\bto\b/i.test(r));
    if (!head) continue;
    const hcells = cellsOf(head.startsWith('\n') ? head : '\n' + head).map(c => clean(c).toLowerCase());
    const si = hcells.findIndex(c => /start|depart|from/.test(c)), fi = hcells.findIndex(c => /finish|arriv|bivouac|^to$/.test(c));
    const got = [];
    for (const row of rows.slice(rows.indexOf(head) + 1)) {
      const cells = cellsOf('\n' + row.trim());
      if (cells.length < 2) continue;
      const label = clean(cells[0]).replace(/'''|<[^>]+>|\{\{[^}]*\}\}/g, '').trim().slice(0, 24);
      let from, to;
      if (cells.length >= hcells.length && si >= 0 && fi >= 0) { from = placeOf(cells[si]); to = placeOf(cells[fi]); }
      if (!from) { const ps = cells.slice(1).map(placeOf).filter(Boolean); from = ps[0]; to = ps[1]; }
      if (from) got.push({ label, from, to: to || null });
    }
    if (got.length >= 4) { stages = got; break; }
  }
  out[y] = { title: (t.match(/^TITLE: (.*)/) || [, `${y} Dakar Rally`])[1], stages };
  console.log(y, stages.length, stages.map(s => `${s.from.name}${s.to && s.to.name !== s.from.name ? '→' + s.to.name : ''}`).join(' | ').slice(0, 300));
}
writeFileSync(`${dir}/stages.json`, JSON.stringify(out, null, 1));
