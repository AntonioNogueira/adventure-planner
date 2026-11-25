import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const [dir, outFile] = process.argv.slice(2);
const data = JSON.parse(readFileSync(`${dir}/stages.json`, 'utf8'));
const CACHE = `${dir}/geo.json`;
const geo = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const UA = 'Munditrails/1.0 (journey map builder)';
const FLAG = { FRA:'fr', ESP:'es', POR:'pt', ITA:'it', MAR:'ma', ALG:'dz', TUN:'tn', LBY:'ly', LBA:'ly', EGY:'eg', NIG:'ne', NER:'ne', MLI:'ml', MTN:'mr', MRT:'mr', SEN:'sn', BUR:'bf', BFA:'bf', CIV:'ci', GUI:'gn', CHA:'td', TCD:'td', CMR:'cm', CAF:'cf', GAB:'ga', CGO:'cg', ANG:'ao', NAM:'na', RSA:'za', ESH:'eh', ARG:'ar', CHI:'cl', CHL:'cl', PER:'pe', BOL:'bo', PAR:'py', KSA:'sa', SAU:'sa', GHA:'gh', GAM:'gm', NGR:'ng', ZAI:'cd', MAW:'mw' };
const ERA = y => y <= 2007 ? 'fr,es,pt,it,ma,eh,dz,tn,ly,eg,ne,ml,mr,sn,bf,ci,gn,td,cm,cf,ga,cg,ao,na,za,gm,gh,ng' : y <= 2019 ? 'ar,cl,pe,bo,py' : 'sa';
const JUNK = /^(cars|trucks|bikes|mi|winner|liaison|total|fia|fim|transportation|non-timed|finish in|bivouac refuge|empty quarter|marathon|rest day|\/)/i;
const FIX = { 'Sea Camp': 'Yanbu' };
// Places the search gets wrong (towns sharing a name) or can't find, checked by hand.
const PIN = {
  'Gao': [16.2788, -0.0412, 'Gao', 'Mali'], 'Dara': [15.3469, -15.4783, 'Dahra', 'Senegal'], 'Timeaouine': [20.4497, 1.8125, 'Timiaouine', 'Algeria'],
  'Tumu': [22.75, 14.15, 'Tumu', 'Libya'], 'Waw El-Kebir': [25.3222, 16.7153, 'Waw al-Kabir', 'Libya'], 'Waw al-Kabir': [25.3222, 16.7153, 'Waw al-Kabir', 'Libya'],
  'Khofra': [24.1836, 23.2869, 'Kufra', 'Libya'], 'Zilla': [28.5486, 17.5831, 'Zillah', 'Libya'], 'Sarir': [27.6539, 22.4917, 'Sarir', 'Libya'],
  'Siwa': [29.2032, 25.5195, 'Siwa', 'Egypt'], 'Abu Rish': null,
};
const PIN_YEAR = { 2003: { 'Dakhla': [25.5121, 29.2582, 'Dakhla', 'Egypt'], 'Luxor': [25.6872, 32.6396, 'Luxor', 'Egypt'], 'Sharm El Sheikh': [27.9158, 34.33, 'Sharm El Sheikh', 'Egypt'] } };
async function locate(p, year) {
  const pin = PIN_YEAR[year]?.[p.name] || (p.name in PIN ? PIN[p.name] : undefined);
  if (pin === null) return null;
  if (pin) return { at: [pin[0], pin[1]], country: pin[3] || '', name: pin[2] || p.name };
  const name = FIX[p.name] || p.name;
  const cc = FLAG[p.country] || ERA(year);
  const key = `${name}|${cc}`;
  if (!(key in geo)) {
    const q = p.article && !FIX[p.name] && !/\b(Rally|Dakar)\b/.test(p.article) ? p.article : name;
    let r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=${cc}&format=jsonv2&limit=1&addressdetails=1&accept-language=en`, { headers: { 'User-Agent': UA } }).then(r => r.json()).catch(() => []);
    await sleep(1100);
    if (!r[0] && q !== name) { r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&countrycodes=${cc}&format=jsonv2&limit=1&addressdetails=1&accept-language=en`, { headers: { 'User-Agent': UA } }).then(r => r.json()).catch(() => []); await sleep(1100); }
    geo[key] = r[0] ? { at: [Math.round(+r[0].lat * 1e4) / 1e4, Math.round(+r[0].lon * 1e4) / 1e4], country: r[0].address?.country || '', type: r[0].addresstype } : null;
    writeFileSync(CACHE, JSON.stringify(geo));
  }
  return geo[key] ? { ...geo[key], name } : null;
}
const toRad = d => d * Math.PI / 180;
const km = (a, b) => 2 * 6371 * Math.asin(Math.sqrt(Math.sin(toRad(b[0] - a[0]) / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(toRad(b[1] - a[1]) / 2) ** 2));
const EUROPE = new Set(['France', 'Spain', 'Portugal', 'Italy']);
const out = [], report = [];
for (const [ys, ed] of Object.entries(data)) {
  const y = +ys;
  if (ed.stages.length < 4) { report.push(`${y}: no stage table, skipped`); continue; }
  const seq = [];
  const add = async (p, label, role) => {
    if (!p || JUNK.test(p.name.trim())) return;
    const g = await locate(p, y);
    if (!g) { report.push(`${y}: not found ${p.name}`); return; }
    const last = seq[seq.length - 1];
    if (last && (last.name === g.name || km(last.at, g.at) < 3)) { if (role === 'to') last.stages.push(label); return; }
    if (last && km(last.at, g.at) > 2500) { report.push(`${y}: dropped ${g.name} (${Math.round(km(last.at, g.at))} km jump)`); return; }
    seq.push({ ...g, stages: role === 'to' ? [label] : [] });
  };
  for (const s of ed.stages) { await add(s.from, s.label, 'from'); await add(s.to, s.label, 'to'); }
  if (seq.length < 3) { report.push(`${y}: too few places`); continue; }
  const raw = readFileSync(`${dir}/en-${y}.txt`, 'utf8');
  const field = f => (raw.match(new RegExp(`\\|[ \\t]*${f}[ \\t]*=[ \\t]*([^\\n]*)`)) || [, ''])[1].replace(/\{\{flagicon\|[^}]*\}\}|\{\{ill\|([^|}]*)[^}]*\}\}/g, '$1').replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1').replace(/<br\s*\/?>/gi, ' / ').replace(/<[^>]+>|\{\{[^}]*\}\}/g, '').trim();
  const winners = [1, 2, 3, 4, 5].map(i => [field(`category${i}`), field(`driver${i}`), field(`team${i}`)]).filter(([c, d]) => c && d).map(([c, d, t]) => `${c}: ${d}${t ? ` (${t})` : ''}`);
  // Editions whose infobox leaves the winners out (well-known results, added by hand).
  const KNOWN = { 1980: ['Cars: Freddy Kottulinsky (Volkswagen Iltis)', 'Bikes: Cyril Neveu (Yamaha)'], 1981: ['Cars: René Metge (Range Rover)', 'Bikes: Hubert Auriol (BMW)'], 1982: ['Cars: Claude and Bernard Marreau (Renault 20)', 'Bikes: Cyril Neveu (Honda)'], 1990: ['Cars: Ari Vatanen (Peugeot)', 'Bikes: Edi Orioli (Cagiva)'], 1992: ['Cars: Hubert Auriol (Mitsubishi)', 'Bikes: Stéphane Peterhansel (Yamaha)'], 2015: ['Cars: Nasser Al-Attiyah (Mini)', 'Bikes: Marc Coma (KTM)'] };
  if (!winners.length && KNOWN[y]) winners.push(...KNOWN[y]);
  const countries = [...new Set(seq.map(s => s.country).filter(Boolean))];
  const title = ed.title.replace(/^TITLE: /, '');
  const era = y <= 2007 ? 'Africa' : y <= 2019 ? 'South America' : 'Saudi Arabia';
  const stops = seq.map((s, i) => {
    const prev = seq[i - 1];
    const by = prev && ((EUROPE.has(prev.country) && !EUROPE.has(s.country)) || (!EUROPE.has(prev.country) && EUROPE.has(s.country))) ? 'ferry' : prev && km(prev.at, s.at) > 1200 ? 'flight' : undefined;
    const st = s.stages.filter(l => l && !/^(prologue)?$/i.test(l) || /prologue/i.test(l));
    const text = i === 0 ? `Start of the ${title}.` : i === seq.length - 1 ? `Finish of the ${title}${st.length ? ` (after stage ${st[st.length - 1]})` : ''}.` : st.length ? `Bivouac at the end of stage ${st.join(', ')}.` : 'On the route.';
    return { q: s.name, name: s.name, at: s.at, route: 'line', ...(by ? { by } : {}), text };
  });
  out.push({
    id: `dakar-${y}`,
    title,
    who: winners.length ? `Won by ${winners.slice(0, 2).map(w => w.split(': ')[1]).join(' and ')}` : 'Dakar Rally',
    when: String(y),
    vehicle: 'Rally raid: motorcycles, cars, trucks',
    kind: 'rally',
    color: era === 'Africa' ? (y % 2 ? '#c2410c' : '#ea580c') : era === 'South America' ? (y % 2 ? '#1d4ed8' : '#2563eb') : (y % 2 ? '#7e22ce' : '#9333ea'),
    summary: `The ${y} edition of the Dakar Rally, ${era === 'Africa' ? 'in its African era' : `in its ${era} era`}: ${seq.length} stage towns and bivouacs through ${countries.join(', ')}.${winners.length ? ` Winners — ${winners.join('; ')}.` : ''}`,
    sources: [{ label: `Wikipedia: ${title}`, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}` }],
    approximate: 'Stage towns and bivouacs from Wikipedia\'s stage table. The rally ran off-road between them, so the lines are straight from bivouac to bivouac.',
    stops,
  });
  console.log(y, seq.length, 'stops', countries.join('/'));
}
writeFileSync(outFile, `// The Dakar Rally, edition by edition: stage towns and bivouacs from each edition's Wikipedia stage table
// (generated, then checked; editions without a stage table on English Wikipedia are not included yet).
// Lines are straight from bivouac to bivouac: the rally ran off-road between them.
export const DAKAR = ${JSON.stringify(out, null, 1)};\n`);
console.log(report.join('\n'));
