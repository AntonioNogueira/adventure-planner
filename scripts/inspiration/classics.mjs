// Classic routes for the Inspiration map, from the welcome box's examples (src/lib/examples.ts). Not one person's
// trip but the way most people do it: the usual stages, the line on the trails or roads most trip reports take.
// Each stop's note is written for this app; `source` links a recent trip report or guide that passes there.
// Same format as journeys.mjs (built by build.mjs).

const REPORT = (label, url) => ({ label, url });

export const CLASSICS = [
  {
    id: 'camino-portugues-coastal',
    title: 'Camino Portugués, coastal way',
    who: 'Classic route · about half of all Portuguese Camino pilgrims in 2025',
    when: 'Best April–June and September–October',
    vehicle: 'On foot, 12–15 days',
    kind: 'walk',
    color: '#1d4ed8',
    summary: 'Porto to Santiago de Compostela along the Atlantic: boardwalks, beaches and fishing towns through northern Portugal, a ferry over the Minho into Galicia, then the bays of Vigo and Pontevedra before joining the central route to the cathedral. Flat, social and easy to plan, with albergues every few kilometres.',
    sources: [
      REPORT('Julie Dawn Fox: the Litoral Way (2025 walk)', 'https://juliedawnfox.com/litoral-way-coastal-camino-portugal/'),
      REPORT('Stingy Nomads: Coastal Route stages (2026 guide)', 'https://stingynomads.com/portuguese-coastal-camino-stages/'),
    ],
    approximate: 'Usual stages from recent guides and reports; the path follows the marked way only approximately.',
    stops: [
      { q: 'Sé do Porto, Porto', name: 'Porto', wiki: 'Porto Cathedral', text: 'Credential stamped at the cathedral, then down to the Douro and out along the river to the sea at Foz.' },
      { q: 'Vila do Conde, Portugal', name: 'Vila do Conde', wiki: 'Vila do Conde', text: 'Boardwalks over the dunes past Matosinhos and Labruge to a town of shipyards and a long aqueduct.', source: REPORT('Julie Dawn Fox (2025)', 'https://juliedawnfox.com/litoral-way-coastal-camino-portugal/') },
      { q: 'Esposende, Portugal', name: 'Esposende', wiki: 'Esposende', text: 'Past the windmills of Apúlia on the beach and into the Cávado estuary.', source: REPORT('Julie Dawn Fox (2025)', 'https://juliedawnfox.com/litoral-way-coastal-camino-portugal/') },
      { q: 'Viana do Castelo, Portugal', name: 'Viana do Castelo', wiki: 'Viana do Castelo', text: 'Over the Eiffel-era bridge into Viana, watched by the basilica of Santa Luzia on its hill.' },
      { q: 'Caminha, Portugal', name: 'Caminha', wiki: 'Caminha', text: 'The last Portuguese town. Pilgrims cross the Minho estuary by small ferry or taxi-boat to A Guarda.' },
      { q: 'A Guarda, Spain', name: 'A Guarda', by: 'ferry', wiki: 'A Guarda', text: 'Galicia: the hillfort of Santa Trega above the river mouth and a wilder, rockier coast ahead.' },
      { q: 'Baiona, Spain', name: 'Baiona', wiki: 'Baiona, Pontevedra', text: 'Where the caravel Pinta brought the first news of the Americas in 1493. A walled fortress on the bay.', source: REPORT('Stingy Nomads: coastal stages', 'https://stingynomads.com/portuguese-coastal-camino-stages/') },
      { q: 'Vigo, Spain', name: 'Vigo', wiki: 'Vigo', text: 'Spain\'s busiest fishing port, with the Cíes Islands across the ría.' },
      { q: 'Redondela, Spain', name: 'Redondela', wiki: 'Redondela', text: 'Under the railway viaducts the coastal way joins the central Portuguese route: suddenly many more pilgrims.' },
      { q: 'Pontevedra, Spain', name: 'Pontevedra', wiki: 'Pontevedra', text: 'A car-free old town and the scallop-shaped church of the Virgen Peregrina.' },
      { q: 'Caldas de Reis, Spain', name: 'Caldas de Reis', wiki: 'Caldas de Reis', text: 'A spa town since Roman times: hot springs for tired feet.' },
      { q: 'Padrón, Spain', name: 'Padrón', wiki: 'Padrón', text: 'Where, by legend, the boat carrying Saint James\'s body landed. Famous for its little green peppers.' },
      { q: 'Praza do Obradoiro, Santiago de Compostela', name: 'Santiago de Compostela', wiki: 'Santiago de Compostela Cathedral', text: 'The Obradoiro square and the cathedral: about 280 km from Porto.' },
    ],
  },
  {
    id: 'west-highland-way',
    title: 'West Highland Way',
    who: 'Classic route · Scotland\'s best-known long walk',
    when: 'Best May–September (midges from June)',
    vehicle: 'On foot, 5–8 days',
    kind: 'walk',
    color: '#4338ca',
    summary: 'About 154 km from the edge of Glasgow to Fort William at the foot of Ben Nevis: the bonnie banks of Loch Lomond, old drove and military roads, the empty moor of Rannoch and the Devil\'s Staircase into Glen Coe country. Inns, bunkhouses and wild camping all the way.',
    sources: [
      REPORT('Jodi Bez: West Highland Way, July 2025 (Substack)', 'https://jodibez.substack.com/p/day-5-i-did-it-my-way'),
      REPORT('Grant\'s Tracks: day by day', 'https://grantstracks.com/posts/whw-day1/'),
    ],
    approximate: 'The usual overnight stops; the line follows paths near the waymarked route.',
    stops: [
      { q: 'Milngavie, Scotland', name: 'Milngavie', wiki: 'Milngavie', text: 'The granite obelisk in the shopping street marks the start.', source: REPORT('Grant\'s Tracks: Milngavie to Drymen', 'https://grantstracks.com/posts/whw-day1/') },
      { q: 'Drymen, Scotland', name: 'Drymen', wiki: 'Drymen', text: 'Farmland and the old railway line to a village with one of Scotland\'s oldest pubs.' },
      { q: 'Rowardennan, Scotland', name: 'Rowardennan', wiki: 'Loch Lomond', text: 'Over Conic Hill, the first real climb, with Loch Lomond and its islands below, then along the shore.', source: REPORT('Jodi Bez: Drymen to Rowardennan (2025)', 'https://jodibez.substack.com/p/a-generally-but-not-all-bad-day-on') },
      { q: 'Inverarnan, Scotland', name: 'Inverarnan', wiki: 'Drovers Inn', text: 'The rough, rooty northern shore of the loch, then the Drovers Inn, little changed since the cattle drovers.' },
      { q: 'Tyndrum, Scotland', name: 'Tyndrum', wiki: 'Tyndrum', text: 'Up Glen Falloch and past Crianlarich to the Highlands proper.' },
      { q: 'Inveroran, Scotland', name: 'Inveroran', wiki: 'Bridge of Orchy', text: 'Under the cone of Beinn Dorain, then over the shoulder to a lonely old inn.' },
      { q: 'Kingshouse, Glencoe', name: 'Kingshouse', wiki: 'Rannoch Moor', text: 'Across Rannoch Moor on the old military road: wide, wet, wild. Buachaille Etive Mòr stands guard at the end.' },
      { q: 'Kinlochleven, Scotland', name: 'Kinlochleven', wiki: 'Kinlochleven', text: 'The Devil\'s Staircase, the highest point of the walk, then a long descent to an old aluminium-smelting village.', source: REPORT('Jodi Bez: day 5 (2025)', 'https://jodibez.substack.com/p/day-5-i-did-it-my-way') },
      { q: 'Gordon Square, Fort William', name: 'Fort William', wiki: 'Ben Nevis', text: 'Through the Lairigmor and Glen Nevis to the finish in Gordon Square, with Ben Nevis above.' },
    ],
  },
  {
    id: 'tour-du-mont-blanc',
    title: 'Tour du Mont Blanc',
    who: 'Classic route · France, Italy and Switzerland on foot',
    when: 'Late June to early September, when the huts are open',
    vehicle: 'On foot, 7–11 days, refuges',
    kind: 'walk',
    color: '#0f766e',
    summary: 'A loop of about 170 km and 10,000 m of climbing round the Mont Blanc massif, through three countries: high cols, glaciers in view almost every day, and nights in mountain refuges where dinner is shared. Book the huts months ahead.',
    sources: [
      REPORT('Patrick Lam: TMB trip report, July–August 2025', 'https://patricklam.ca/post/20250824-tmb'),
      REPORT('Kenji Saito: TMB day by day (September 2025)', 'https://kenjisaito.com/tour-du-mont-blanc-tmb-day-2'),
    ],
    approximate: 'The classic anticlockwise stages; the line follows mountain paths near the official route.',
    stops: [
      { q: 'Les Houches, France', name: 'Les Houches', wiki: 'Les Houches', text: 'The traditional start, at the bottom of the Chamonix valley. Anticlockwise, like most walkers.', source: REPORT('Patrick Lam (2025)', 'https://patricklam.ca/post/20250824-tmb') },
      { q: 'Les Contamines-Montjoie, France', name: 'Les Contamines', wiki: 'Les Contamines-Montjoie', text: 'Over the Col de Voza and past the Bionnassay glacier.' },
      { q: 'Refuge de la Croix du Bonhomme', name: 'Croix du Bonhomme', wiki: 'Col du Bonhomme', text: 'Up the old Roman road to the Col du Bonhomme and a hut at almost 2,500 m.' },
      { q: 'Refuge des Mottets', name: 'Les Mottets', wiki: 'Vallée des Glaciers', text: 'Down to the Vallée des Glaciers and a refuge in old farm buildings.' },
      { q: 'Courmayeur, Italy', name: 'Courmayeur', wiki: 'Courmayeur', text: 'Col de la Seigne into Italy, the south face of Mont Blanc opening up, and a rest day in Courmayeur.' },
      { q: 'Rifugio Bonatti', name: 'Rifugio Bonatti', wiki: 'Val Ferret (Italy)', text: 'A balcony path above Val Ferret facing the Grandes Jorasses, one of the finest days of the tour.' },
      { q: 'La Fouly, Switzerland', name: 'La Fouly', wiki: 'La Fouly', text: 'Over the Grand Col Ferret, the highest point at 2,537 m, into Switzerland.' },
      { q: 'Champex-Lac, Switzerland', name: 'Champex', wiki: 'Champex', text: 'Gentle walking through Swiss villages to a lake resort.' },
      { q: 'Trient, Switzerland', name: 'Trient', wiki: 'Trient', text: 'Over the Bovine alp or the Fenêtre d\'Arpette, the wild alternative under the Trient glacier.' },
      { q: 'Tré-le-Champ, Argentière', name: 'Tré-le-Champ', wiki: 'Argentière', text: 'Col de Balme back into France, with the whole Chamonix valley ahead.', source: REPORT('Kenji Saito: final day (2025)', 'https://kenjisaito.com/tour-du-mont-blanc-tmb-final-day') },
      { q: 'Lac Blanc, Chamonix', name: 'Lac Blanc', wiki: 'Lac Blanc (Haute-Savoie)', text: 'Ladders up the Aiguilles Rouges to the lake where Mont Blanc is reflected.' },
      { q: 'Les Houches, France', name: 'Back in Les Houches', wiki: 'Mont Blanc', text: 'Along the Grand Balcon Sud and down by the Brévent: the loop closed.' },
    ],
  },
  {
    id: 'pacific-crest-trail',
    title: 'Pacific Crest Trail',
    who: 'Classic route · Mexico to Canada on foot',
    when: 'Northbound, late April to September',
    vehicle: 'On foot, 4–6 months',
    kind: 'walk',
    color: '#a16207',
    summary: 'About 4,265 km from the Mexican border to Canada through California, Oregon and Washington: desert, the High Sierra, volcanoes and old forest. A few thousand people start each year; most hike northbound, timing the desert before summer and the Sierra after the snow.',
    sources: [
      REPORT('Halfway Anywhere: PCT best moments, class of 2025', 'https://www.halfwayanywhere.com/trails/pacific-crest-trail/pct-best-moments-2025/'),
      REPORT('Halfway Anywhere: PCT tips from the class of 2025', 'https://www.halfwayanywhere.com/trails/pacific-crest-trail/pacific-crest-trail-tips-2025-2026/'),
    ],
    approximate: 'The usual resupply towns and landmarks; the line follows trails near the PCT where they were found.',
    stops: [
      { q: 'Campo, California', at: [32.5898, -116.4669], name: 'Southern Terminus', wiki: 'Campo, California', text: 'A wooden monument at the Mexican border. Northbound hikers start here in spring.', source: REPORT('Halfway Anywhere: class of 2025', 'https://www.halfwayanywhere.com/trails/pacific-crest-trail/pct-best-moments-2025/') },
      { q: 'Julian, California', name: 'Julian', wiki: 'Julian, California', text: 'Through the Laguna Mountains to an old gold-rush town famous for its apple pie.' },
      { q: 'Idyllwild, California', name: 'Idyllwild', wiki: 'San Jacinto Mountains', text: 'A mountain village in the San Jacinto range.' },
      { q: 'Big Bear Lake, California', name: 'Big Bear Lake', wiki: 'Big Bear Lake, California', text: 'Down to the desert floor at the I-10 and up again into the San Bernardinos.' },
      { q: 'Wrightwood, California', name: 'Wrightwood', wiki: 'Wrightwood, California', text: 'Near Mount Baden-Powell in the San Gabriels.' },
      { q: 'Tehachapi, California', name: 'Tehachapi', wiki: 'Tehachapi, California', text: 'Across the Mojave edge along the aqueduct, among the wind turbines.' },
      { q: 'Kennedy Meadows, California', name: 'Kennedy Meadows', wiki: 'Kennedy Meadows, California', text: 'The end of the desert, mile 702. Hikers pick up bear canisters and ice axes for the Sierra.' },
      { q: 'Mount Whitney', name: 'Mount Whitney side trip', wiki: 'Mount Whitney', text: 'A detour up the highest summit in the lower 48 states, 4,421 m.' },
      { q: 'Muir Trail Ranch, California', name: 'High Sierra', wiki: 'John Muir Trail', text: 'Shared with the John Muir Trail: high passes, cold fords, granite and lakes, days from any road.' },
      { q: 'Tuolumne Meadows, California', name: 'Tuolumne Meadows', wiki: 'Tuolumne Meadows', text: 'Yosemite\'s high country.' },
      { q: 'South Lake Tahoe, California', name: 'South Lake Tahoe', wiki: 'Lake Tahoe', text: 'Through Desolation Wilderness and along the lake.' },
      { q: 'Sierra City, California', name: 'Sierra City', wiki: 'Sierra City, California', text: 'An old mining village under the Sierra Buttes.' },
      { q: 'Chester, California', name: 'Chester', wiki: 'Chester, California', text: 'Near the trail\'s halfway point, about 2,130 km from Mexico.' },
      { q: 'Burney Falls, California', name: 'Burney Falls', wiki: 'McArthur–Burney Falls Memorial State Park', text: 'Past Lassen\'s volcanic country to a waterfall pouring out of the rock.' },
      { q: 'Mount Shasta, California', name: 'Mount Shasta', wiki: 'Mount Shasta', text: 'Castle Crags and the white cone of Shasta in view for days.' },
      { q: 'Ashland, Oregon', name: 'Ashland', wiki: 'Ashland, Oregon', text: 'Into Oregon, a theatre town where hikers celebrate leaving California.' },
      { q: 'Crater Lake, Oregon', name: 'Crater Lake', wiki: 'Crater Lake', text: 'The deepest lake in the US, inside a collapsed volcano.' },
      { q: 'Sisters, Oregon', name: 'Sisters', wiki: 'Three Sisters (Oregon)', text: 'Lava fields and the Three Sisters volcanoes.' },
      { q: 'Timberline Lodge, Oregon', name: 'Timberline Lodge', wiki: 'Timberline Lodge', text: 'On the slopes of Mount Hood, famous for its breakfast buffet.' },
      { q: 'Cascade Locks, Oregon', name: 'Cascade Locks', wiki: 'Bridge of the Gods (modern structure)', text: 'Down the Eagle Creek area to the Columbia River, and the Bridge of the Gods into Washington.', source: REPORT('Fastest known time through Oregon, July 2025', 'https://fastestknowntime.com/fkt/kaylee-levine-pacific-crest-trail-through-or-or-2025-07-16') },
      { q: 'Packwood, Washington', name: 'Goat Rocks', wiki: 'Goat Rocks', text: 'The Knife\'s Edge in the Goat Rocks, with Mount Rainier close.' },
      { q: 'Snoqualmie Pass, Washington', name: 'Snoqualmie Pass', wiki: 'Snoqualmie Pass', text: 'Into the steep, wet North Cascades.' },
      { q: 'Stehekin, Washington', name: 'Stehekin', wiki: 'Stehekin, Washington', text: 'A village reached only by boat, plane or trail, with a famous bakery.' },
      { q: 'Manning Park, British Columbia', name: 'Northern Terminus', wiki: 'E. C. Manning Provincial Park', text: 'The monument at the Canadian border, and on to Manning Park: about 4,265 km from Mexico.' },
    ],
  },
  {
    id: 'north-coast-500',
    title: 'North Coast 500',
    who: 'Classic route · Scotland\'s Highland loop by motorcycle',
    when: 'Best May or September–October',
    vehicle: 'Motorcycle (or car, camper, bike), 5–7 days',
    kind: 'moto',
    color: '#be185d',
    summary: 'A loop of about 830 km from Inverness round the far north of Scotland: the Bealach na Bà pass, empty single-track roads along sea lochs, white beaches, mountains like Suilven and Stac Pollaidh, and the cliffs of the north coast. Use the passing places and expect four seasons a day.',
    sources: [
      REPORT('Horizons Unlimited: a beginner\'s take on the NC500', 'https://www.horizonsunlimited.com/hubb/ride-tales/beginners-take-on-the-nc500-93251'),
      REPORT('Wheelworld: five on tour, mostly on two wheels', 'https://www.wheelworldreviews.co.uk/?p=18615'),
    ],
    approximate: 'The usual anticlockwise loop and overnight towns.',
    stops: [
      { q: 'Inverness, Scotland', name: 'Inverness', wiki: 'Inverness', text: 'The start and finish, at the head of the Moray Firth.' },
      { q: 'Applecross, Scotland', name: 'Applecross', wiki: 'Bealach na Bà', text: 'West over the Bealach na Bà, one of the UK\'s steepest road climbs, hairpins and 20% gradients to 626 m.', source: REPORT('Horizons Unlimited: NC500 ride tale', 'https://www.horizonsunlimited.com/hubb/ride-tales/beginners-take-on-the-nc500-93251') },
      { q: 'Torridon, Scotland', name: 'Torridon', wiki: 'Torridon Hills', text: 'Along the coast road under the huge sandstone hills of Torridon.' },
      { q: 'Gairloch, Scotland', name: 'Gairloch', wiki: 'Loch Maree', text: 'Past Loch Maree to sandy bays on the Atlantic.' },
      { q: 'Ullapool, Scotland', name: 'Ullapool', wiki: 'Ullapool', text: 'A white-painted fishing town on Loch Broom, ferries out to the Hebrides.' },
      { q: 'Lochinver, Scotland', name: 'Lochinver', wiki: 'Suilven', text: 'The narrow coast road through Assynt: Stac Pollaidh, Suilven and bays at every bend.' },
      { q: 'Durness, Scotland', name: 'Durness', wiki: 'Smoo Cave', text: 'The north-west corner: Smoo Cave and white beaches like Balnakeil.' },
      { q: 'Tongue, Scotland', name: 'Tongue', wiki: 'Kyle of Tongue', text: 'Across the causeway on the Kyle of Tongue, Ben Hope and Ben Loyal behind.' },
      { q: 'John o\' Groats', name: 'John o\' Groats', wiki: 'Duncansby Head', text: 'Past Dunnet Head, the true northern tip of Britain, to the sea stacks of Duncansby.' },
      { q: 'Wick, Scotland', name: 'Wick', wiki: 'Wick, Caithness', text: 'South down the east coast on faster roads.' },
      { q: 'Dornoch, Scotland', name: 'Dornoch', wiki: 'Dunrobin Castle', text: 'Past fairy-tale Dunrobin Castle to a cathedral town by the sea.' },
      { q: 'Inverness, Scotland', name: 'Back in Inverness', wiki: 'Inverness Castle', text: 'Back over the Black Isle: about 830 km round.' },
    ],
  },
  {
    id: 'ha-giang-loop',
    title: 'Ha Giang Loop',
    who: 'Classic route · northern Vietnam by motorbike',
    when: 'Best October–November (buckwheat flowers) and March–May',
    vehicle: 'Motorbike or with an easy rider, 3–4 days',
    kind: 'moto',
    color: '#c2410c',
    summary: 'A loop of 350–450 km through the karst mountains on the Chinese border: the Ma Pi Leng pass above the Nho Que river, Hmong villages and markets, terraced valleys and homestays. Most go anticlockwise from Ha Giang; many ride pillion with a local driver.',
    sources: [
      REPORT('Kreier: the Ha Giang Loop a second time (2025)', 'https://kreier.github.io/quartz/Travel/2025/Ha-Giang-loop-a-second-time-in-2025'),
      REPORT('Team-BHP travelogue: Ha Giang Loop (May 2025)', 'https://www.team-bhp.com/forum/travelogues/294466-ha-giang-loop-vietnam.html'),
    ],
    approximate: 'The usual anticlockwise loop and overnight villages.',
    stops: [
      { q: 'Ha Giang, Vietnam', name: 'Ha Giang', at: [22.8168, 104.9505], wiki: 'Hà Giang', text: 'Bikes rented, permits checked, and north into the mountains.', source: REPORT('Kreier (2025)', 'https://kreier.github.io/quartz/Travel/2025/Ha-Giang-loop-a-second-time-in-2025') },
      { q: 'Quan Ba, Ha Giang', at: [23.07, 104.99], name: 'Heaven\'s Gate', wiki: 'Quản Bạ District', text: 'The first pass, looking over the twin "fairy" hills of Quan Ba.' },
      { q: 'Yen Minh, Ha Giang', at: [23.1172, 105.1491], name: 'Yen Minh', wiki: 'Yên Minh District', text: 'Pine forests and switchbacks to a small market town.' },
      { q: 'Sa Phin, Dong Van', at: [23.2562, 105.2621], name: 'Hmong King\'s Palace', wiki: 'Vương Family Palace', text: 'The palace of the Vuong family, the old Hmong rulers of the opium trade.' },
      { q: 'Lung Cu, Ha Giang', at: [23.3635, 105.3163], name: 'Lung Cu', wiki: 'Lũng Cú Flag Tower', text: 'A flag tower at Vietnam\'s northern tip, a detour from Dong Van.' },
      { q: 'Dong Van, Ha Giang', at: [23.2783, 105.3622], name: 'Dong Van', wiki: 'Đồng Văn Karst Plateau Geopark', text: 'An old town on a UNESCO geopark of karst; its Sunday market fills with people from the hill villages.' },
      { q: 'Ma Pi Leng Pass', at: [23.2333, 105.4117], name: 'Ma Pi Leng Pass', wiki: 'Mã Pí Lèng Pass', text: 'The road cut into the cliffs above the Nho Que river canyon: the reason most people come.', source: REPORT('Team-BHP travelogue (2025)', 'https://www.team-bhp.com/forum/travelogues/294466-ha-giang-loop-vietnam.html') },
      { q: 'Meo Vac, Ha Giang', at: [23.1633, 105.4104], name: 'Meo Vac', wiki: 'Mèo Vạc District', text: 'Down from the pass to a valley town. Boats run on the river below.' },
      { q: 'Du Gia, Ha Giang', at: [22.9312, 105.2229], name: 'Du Gia', wiki: 'Hà Giang province', text: 'Rough back roads to a quiet valley of rice terraces, a waterfall and family homestays.' },
      { q: 'Ha Giang, Vietnam', name: 'Back in Ha Giang', at: [22.8168, 104.9505], wiki: 'Lô River', text: 'Along the Lo river back to town.' },
    ],
  },
  {
    id: 'annapurna-circuit',
    title: 'Annapurna Circuit',
    who: 'Classic route · round the Annapurna massif',
    when: 'Best October–November and March–May',
    vehicle: 'On foot, 10–16 days, teahouses',
    kind: 'walk',
    color: '#9333ea',
    summary: 'From the green Marsyangdi valley up through Buddhist villages to Manang, over the Thorong La pass at 5,416 m and down to the pilgrimage temples of Muktinath and the deep Kali Gandaki gorge. Teahouses all the way; the acclimatisation days in Manang matter.',
    sources: [
      REPORT('Dave\'s Travel Corner: Annapurna Circuit journal (July 2025)', 'https://www.davestravelcorner.com/?p=139934'),
      REPORT('Explore-Share: 11-day itinerary, lodges and food', 'https://www.explore-share.com/blog/annapurna-circuit-eleven-day-itinerary-route-lodges-food/'),
    ],
    approximate: 'The usual stages anticlockwise; the line follows trails and jeep tracks near the route.',
    stops: [
      { q: 'Besisahar, Nepal', name: 'Besisahar', wiki: 'Besisahar', text: 'The start, after a long bus ride from Kathmandu. Many now jeep further up to skip the road.' },
      { q: 'Chame, Nepal', name: 'Chame', wiki: 'Chame', text: 'Up the Marsyangdi gorge past waterfalls into pine forest, Annapurna II above.' },
      { q: 'Upper Pisang, Nepal', at: [28.6164, 84.153], name: 'Pisang', wiki: 'Pisang', text: 'Into the dry rain shadow: stone villages, prayer flags and the curved rock face of Paungda Danda.' },
      { q: 'Manang, Nepal', at: [28.6667, 84.0167], name: 'Manang', wiki: 'Manang, Nepal', text: 'Two nights at 3,540 m to acclimatise, with side hikes to the Gangapurna glacier lake or Ice Lake.' },
      { q: 'Yak Kharka, Nepal', at: [28.7227, 83.9738], name: 'Yak Kharka', wiki: 'Manang District', text: 'Short days now, climbing slowly above the tree line.', source: REPORT('Dave\'s Travel Corner (2025)', 'https://www.davestravelcorner.com/?p=139934') },
      { q: 'Thorong Phedi, Nepal', at: [28.7768, 83.9726], name: 'Thorong Phedi', wiki: 'Thorong La', text: 'The last lodges below the pass, about 4,500 m. An early night and a very early start.' },
      { q: 'Thorong La', at: [28.7936, 83.9381], name: 'Thorong La', wiki: 'Thorong La', text: 'The pass at 5,416 m, usually crossed before sunrise winds.' },
      { q: 'Muktinath, Nepal', at: [28.8167, 83.8711], name: 'Muktinath', wiki: 'Muktinath', text: 'A long descent to a temple sacred to both Hindus and Buddhists.', source: REPORT('Explore-Share itinerary', 'https://www.explore-share.com/blog/annapurna-circuit-eleven-day-itinerary-route-lodges-food/') },
      { q: 'Marpha, Nepal', name: 'Marpha', wiki: 'Marpha', text: 'Down the windy Kali Gandaki to a whitewashed village famous for apple brandy.' },
      { q: 'Tatopani, Myagdi', at: [28.4875, 83.6531], name: 'Tatopani', wiki: 'Tatopani, Myagdi', text: 'Hot springs at the bottom of one of the world\'s deepest gorges.' },
      { q: 'Ghorepani, Nepal', at: [28.4025, 83.6999], name: 'Poon Hill', wiki: 'Poon Hill', text: 'A sunrise over Dhaulagiri and Annapurna, a favourite finale.' },
      { q: 'Nayapul, Nepal', at: [28.2981, 83.7679], name: 'Nayapul', wiki: 'Pokhara', text: 'Down to the road and on to Pokhara and its lake.' },
    ],
  },
  {
    id: 'gibb-river-road',
    title: 'Gibb River Road',
    who: 'Classic route · the Kimberley by 4x4',
    when: 'Dry season only, about May–October',
    vehicle: '4x4, 7–14 days, bush camping',
    kind: '4x4',
    color: '#b45309',
    summary: 'About 660 km of mostly dirt road across the Kimberley in Western Australia, an old cattle route between Derby and Kununurra: red gorges with swimming holes, river crossings like the Pentecost, cattle stations with campgrounds, and very few people. Carry fuel, water and two spare tyres.',
    sources: [
      REPORT('Andy & Ness: the Gibb River Road, part III (September 2025)', 'https://andyandnessas-allaussieadventures.blogspot.com/2025/09/the-gibb-river-road-part-iii.html'),
      REPORT('Australia.com: Gibb River Road itinerary', 'https://australia.com/en/trips-and-itineraries/broome-and-surrounds/the-gibb-river-road-itinerary.html'),
    ],
    approximate: 'The usual west-to-east stops; the line follows the road where the router found it.',
    stops: [
      { q: 'Broome, Western Australia', name: 'Broome', wiki: 'Broome, Western Australia', text: 'Camels on Cable Beach and a last big shop before the Kimberley.' },
      { q: 'Derby, Western Australia', name: 'Derby', wiki: 'Derby, Western Australia', text: 'The western start of the Gibb, with its giant boab trees.' },
      { q: 'Windjana Gorge', name: 'Windjana Gorge', wiki: 'Windjana Gorge National Park', text: 'Freshwater crocodiles sunning under limestone walls of an ancient reef. Nearby, wade through Tunnel Creek.' },
      { q: 'Bell Gorge', name: 'Bell Gorge', wiki: 'King Leopold Ranges', text: 'Into the King Leopold Ranges: a waterfall into a deep swimming hole.' },
      { q: 'Mount Barnett Roadhouse', name: 'Manning Gorge', wiki: 'Mount Barnett Station', text: 'Swim across the river to walk to Manning Gorge\'s falls.' },
      { q: 'Ellenbrae Station', name: 'Ellenbrae Station', wiki: 'Ellenbrae Station', text: 'A remote station famous for its fresh scones.', source: REPORT('Andy & Ness (2025)', 'https://andyandnessas-allaussieadventures.blogspot.com/2025/09/the-gibb-river-road-part-iii.html') },
      { q: 'Home Valley Station', name: 'Pentecost River', wiki: 'Pentecost River', text: 'The famous crossing of the Pentecost under the Cockburn Range. Saltwater crocodiles here: drive, don\'t wade.' },
      { q: 'El Questro', name: 'El Questro', wiki: 'El Questro Wilderness Park', text: 'Gorges, Zebedee hot springs and Emma Gorge, worth days, not hours.', source: REPORT('Andy & Ness: El Questro (2025)', 'https://andyandnessas-allaussieadventures.blogspot.com/2025/09/the-gibb-river-road-part-iii.html') },
      { q: 'Kununurra, Western Australia', name: 'Kununurra', wiki: 'Kununurra, Western Australia', text: 'Tarmac again, and Lake Argyle nearby.' },
    ],
  },
  {
    id: 'lagunas-route',
    title: 'Lagunas Route: Uyuni to San Pedro de Atacama',
    who: 'Classic route · the Bolivian Altiplano by bike',
    when: 'Best April–November (dry, very cold nights)',
    vehicle: 'Bikepacking (also motorcycle or 4x4), 7–12 days',
    kind: 'bike',
    color: '#0891b2',
    summary: 'Sandy, corrugated tracks over 4,000–5,000 m through south-west Bolivia: coloured lagoons full of flamingos, geysers, hot springs and volcanoes, then a fast drop of 2,000 m into Chile\'s Atacama desert. Remote and hard: carry food, water and warm clothes.',
    sources: [
      REPORT('Bikepacking.com: Lagunas y Salares route', 'https://bikepacking.com/routes/lagunas-y-salares/'),
      REPORT('Itchy Boots: 10 tips for the Ruta de las Lagunas', 'https://www.itchyboots.com/bikers-guide/10-tips-for-riding-the-ruta-de-las-lagunas-in-bolivia'),
    ],
    approximate: 'The usual villages, lagoons and refuges; the tracks shift every season, so the line is a guide only.',
    stops: [
      { q: 'Uyuni, Bolivia', name: 'Uyuni', wiki: 'Uyuni', text: 'A windy rail town at the edge of the world\'s biggest salt flat, and the train cemetery.' },
      { q: 'San Cristóbal, Potosí, Bolivia', name: 'San Cristóbal', wiki: 'San Cristóbal, Potosí', text: 'The last reliable fuel and shops.', source: REPORT('Itchy Boots: tips', 'https://www.itchyboots.com/bikers-guide/10-tips-for-riding-the-ruta-de-las-lagunas-in-bolivia') },
      { q: 'Villa Alota, Bolivia', name: 'Villa Alota', wiki: 'Potosí Department', text: 'A small Altiplano village with basic lodgings.' },
      { q: 'Villa Mar, Bolivia', name: 'Villa Mar', wiki: 'Sur Lípez Province', text: 'Rock formations of the Valle de las Rocas, and llamas.' },
      { q: 'Laguna Colorada', name: 'Laguna Colorada', wiki: 'Laguna Colorada', text: 'A red lake with thousands of flamingos, in the Eduardo Avaroa reserve.', source: REPORT('Bikepacking.com: Lagunas y Salares', 'https://bikepacking.com/routes/lagunas-y-salares/') },
      { q: 'Sol de Mañana', name: 'Sol de Mañana', at: [-22.4333, -67.75], wiki: 'Sol de Mañana', text: 'Bubbling mud and steaming vents at almost 5,000 m, the high point.' },
      { q: 'Polques hot springs', name: 'Termas de Polques', at: [-22.5333, -67.65], wiki: 'Salar de Chalviri', text: 'A hot pool by the salt lake, worth the cold morning.' },
      { q: 'Laguna Verde', name: 'Laguna Verde', at: [-22.7889, -67.8264], wiki: 'Laguna Verde (Bolivia)', text: 'A green lake under the cone of Licancabur.' },
      { q: 'Hito Cajón', name: 'Hito Cajón', at: [-22.9025, -67.7861], wiki: 'Licancabur', text: 'Bolivian exit, then smooth tarmac into Chile.' },
      { q: 'San Pedro de Atacama, Chile', name: 'San Pedro de Atacama', wiki: 'San Pedro de Atacama', text: 'A 2,000 m descent into the desert oasis.' },
    ],
  },
  {
    id: 'morocco-atlas-sahara',
    title: 'Morocco: Atlas to Sahara',
    who: 'Classic route · southern Morocco by motorcycle',
    when: 'Best March–May and October–November',
    vehicle: 'Adventure motorcycle, 7–10 days',
    kind: 'moto',
    color: '#dc2626',
    summary: 'From Marrakech over the High Atlas by the Tizi n\'Tichka, past kasbahs and film-set Ouarzazate, through the Dades and Todra gorges to the dunes of Merzouga, and back by the Draa valley palm groves. Tarmac for most, with endless dirt tracks for those who want them.',
    sources: [
      REPORT('Mosko Moto: lightweight dual-sport route across Morocco (November 2025)', 'https://moskomoto.com/blogs/mosko-moto-blog/trip-report-lightweight-dual-sport-route-across-morocco'),
      REPORT('Rider Magazine: Morocco adventure tour review (March 2025)', 'https://ridermagazine.com/2025/03/07/imtbike-morocco-adventure-motorcycle-tour-review/'),
    ],
    approximate: 'The usual loop and overnight towns.',
    stops: [
      { q: 'Marrakech, Morocco', name: 'Marrakech', wiki: 'Jemaa el-Fnaa', text: 'Bikes collected, the Jemaa el-Fnaa square at night.' },
      { q: 'Tizi n\'Tichka', name: 'Tizi n\'Tichka', wiki: 'Tizi n\'Tichka', text: 'Morocco\'s highest main road pass, 2,260 m, in big loops over the High Atlas.', source: REPORT('Rider Magazine (2025)', 'https://ridermagazine.com/2025/03/07/imtbike-morocco-adventure-motorcycle-tour-review/') },
      { q: 'Aït Benhaddou, Morocco', name: 'Aït Benhaddou', wiki: 'Ait Benhaddou', text: 'An earthen fortified village on a hill, seen in many films.' },
      { q: 'Ouarzazate, Morocco', name: 'Ouarzazate', wiki: 'Ouarzazate', text: 'The desert\'s gateway and its film studios.' },
      { q: 'Boumalne Dades, Morocco', name: 'Dades Gorge', wiki: 'Dadès Gorges', text: 'The tight hairpins up the Dades Gorge, red cliffs and kasbahs.' },
      { q: 'Tinghir, Morocco', name: 'Todra Gorge', wiki: 'Todgha Gorge', text: 'A narrow canyon of 300 m walls, near Tinghir.' },
      { q: 'Merzouga, Morocco', name: 'Merzouga', wiki: 'Erg Chebbi', text: 'The dunes of Erg Chebbi: a night in a desert camp.', source: REPORT('Mosko Moto (2025)', 'https://moskomoto.com/blogs/mosko-moto-blog/trip-report-lightweight-dual-sport-route-across-morocco') },
      { q: 'Nkob, Morocco', name: 'Nkob', wiki: 'N\'Kob', text: 'West across the Jbel Saghro, a village of forty-odd kasbahs.' },
      { q: 'Zagora, Morocco', name: 'Zagora', wiki: 'Draa River', text: 'The Draa valley\'s palm groves; an old sign says 52 days to Timbuktu by camel.' },
      { q: 'Marrakech, Morocco', name: 'Back in Marrakech', wiki: 'Koutoubia Mosque', text: 'North over the Atlas again to the city.' },
    ],
  },
  // ---- India ----
  {
    id: 'manali-leh',
    title: 'Manali to Leh',
    who: 'Classic route · the Himalayan highway by motorcycle',
    when: 'Mid-June to September, when the passes are open',
    vehicle: 'Royal Enfield or any adventure bike, 4–6 days',
    kind: 'moto',
    color: '#ea580c',
    summary: 'About 430 km from the green Kullu valley to Ladakh\'s high desert, over five passes up to 5,300 m: Baralacha La, the 21 Gata Loops, the empty More Plains and Tanglang La. Tented camps at Sarchu and Pang, river crossings from snowmelt, and altitude to respect.',
    sources: [
      REPORT('Notes from Chetan: Manali to Leh by bicycle, July 2025', 'https://notesfromchetan.blogspot.com/2025/12'),
      REPORT('Vargis Khan: Pang to Manali by motorcycle', 'https://vargiskhan.com/log/pang-to-manali/'),
    ],
    approximate: 'The usual overnight stops; the line follows the Manali–Leh highway.',
    stops: [
      { q: 'Manali, Himachal Pradesh', name: 'Manali', wiki: 'Manali, Himachal Pradesh', text: 'The start, in apple orchards and deodar forest. Bikes checked, permits sorted.' },
      { q: 'Sissu, Himachal Pradesh', name: 'Atal Tunnel', wiki: 'Atal Tunnel', text: 'Under the Rohtang Pass by the 9 km Atal Tunnel into Lahaul, suddenly drier and starker.' },
      { q: 'Keylong, Himachal Pradesh', name: 'Keylong', wiki: 'Keylong', text: 'Lahaul\'s main town, a common first night.' },
      { q: 'Jispa, Himachal Pradesh', name: 'Jispa', wiki: 'Jispa', text: 'A riverside camp, good for acclimatising at about 3,200 m.' },
      { q: 'Baralacha La', name: 'Baralacha La', at: [32.7586, 77.4231], wiki: 'Baralacha La', text: 'The first big pass, about 4,890 m, with broken road and snow walls early in the season.', source: REPORT('Notes from Chetan (2025)', 'https://notesfromchetan.blogspot.com/2025/12') },
      { q: 'Sarchu', name: 'Sarchu', at: [32.9061, 77.5767], wiki: 'Sarchu', text: 'A plain of tented camps on the Himachal–Ladakh border. Cold nights, no phone signal.', source: REPORT('Notes from Chetan (2025)', 'https://notesfromchetan.blogspot.com/2025/12') },
      { q: 'Pang, Ladakh', name: 'Pang', at: [33.1428, 77.7694], wiki: 'Pang, Ladakh', text: 'Up the 21 hairpins of the Gata Loops, over Nakee La and Lachulung La, to an army post and a few dhabas: one of the highest camps on the road.', source: REPORT('Vargis Khan: Pang to Manali', 'https://vargiskhan.com/log/pang-to-manali/') },
      { q: 'More Plains', name: 'More Plains', at: [33.2833, 77.8833], wiki: 'Morey Plains', text: 'Forty kilometres of flat high plateau at 4,700 m, nomads\' tents and wild asses.' },
      { q: 'Tanglang La', name: 'Tanglang La', at: [33.5072, 77.7697], wiki: 'Taglang La', text: 'The last and highest pass of the highway, about 5,330 m.' },
      { q: 'Upshi, Ladakh', name: 'Upshi', at: [33.8267, 77.8133], wiki: 'Indus River', text: 'Down to the Indus valley and its monasteries.' },
      { q: 'Leh, Ladakh', name: 'Leh', wiki: 'Leh Palace', text: 'Ladakh\'s capital under its old palace. Many ride on over the Khardung La to Nubra.' },
    ],
  },
  {
    id: 'spiti-circuit',
    title: 'Spiti Valley circuit',
    who: 'Classic route · Kinnaur and Spiti by motorcycle or car',
    when: 'June to October (Kunzum La open); September is best',
    vehicle: 'Motorcycle or car, 8–12 days',
    kind: 'moto',
    color: '#0d9488',
    summary: 'A Himalayan loop from Shimla up the Sutlej gorge through Kinnaur, into the cold desert of Spiti with its cliff-top monasteries and villages above 4,000 m, then over the Kunzum La past Chandratal lake and down to Manali. Do it this way round for the altitude.',
    sources: [
      REPORT('Walk with Vicky: Chennai to Spiti (October 2025)', 'https://walkwithvicky.blogspot.com/2025/10/chennai-to-spiti-ultimate-himalayan-adventure.html'),
      REPORT('Discover with Dheeraj: Kinnaur–Spiti circuit itinerary', 'https://discoverwithdheeraj.com/kinnaur-spiti-circuit-itinerary-2026/'),
    ],
    approximate: 'The common clockwise loop and overnight villages.',
    stops: [
      { q: 'Shimla, Himachal Pradesh', name: 'Shimla', wiki: 'Shimla', text: 'The old British summer capital, the start.' },
      { q: 'Narkanda, Himachal Pradesh', name: 'Narkanda', wiki: 'Narkanda', text: 'Apple country on a ridge with the first snow peaks in view.' },
      { q: 'Sangla, Himachal Pradesh', name: 'Sangla', wiki: 'Sangla', text: 'Up the Sutlej into Kinnaur and the Baspa valley.' },
      { q: 'Chitkul, Himachal Pradesh', name: 'Chitkul', wiki: 'Chitkul', text: 'Wooden houses in the last village before Tibet.' },
      { q: 'Kalpa, Himachal Pradesh', name: 'Kalpa', wiki: 'Kalpa, India', text: 'Facing the Kinnaur Kailash range.' },
      { q: 'Nako, Himachal Pradesh', name: 'Nako', wiki: 'Nako, India', text: 'Past cliff roads like the one at Malling to a lake village near the Tibet border.' },
      { q: 'Tabo, Himachal Pradesh', name: 'Tabo', wiki: 'Tabo Monastery', text: 'A monastery more than a thousand years old, with its painted halls.' },
      { q: 'Dhankar, Himachal Pradesh', name: 'Dhankar', wiki: 'Dhankar Monastery', text: 'A fort-monastery on a crumbling ridge above two rivers.' },
      { q: 'Kaza, Himachal Pradesh', name: 'Kaza', wiki: 'Kaza, India', text: 'Spiti\'s small capital, base for Key monastery, Kibber, Langza and Komic.', source: REPORT('Walk with Vicky (2025)', 'https://walkwithvicky.blogspot.com/2025/10/chennai-to-spiti-ultimate-himalayan-adventure.html') },
      { q: 'Losar, Himachal Pradesh', name: 'Losar', wiki: 'Losar, Himachal Pradesh', text: 'The last Spiti village before the pass.' },
      { q: 'Chandratal', name: 'Chandratal', at: [32.4753, 77.6175], wiki: 'Chandra Taal', text: 'Over the Kunzum La to the "moon lake" at 4,300 m. Camps nearby; best after time at altitude.' },
      { q: 'Manali, Himachal Pradesh', name: 'Manali', wiki: 'Manali, Himachal Pradesh', text: 'Rough road through Batal and Chhatru, then the Atal Tunnel down to Manali.' },
    ],
  },
  {
    id: 'rajasthan-road-trip',
    title: 'Rajasthan road trip',
    who: 'Classic route · forts and desert by car',
    when: 'October to March',
    vehicle: 'Car (often with a driver), 10–14 days',
    kind: 'car',
    color: '#e11d48',
    summary: 'The pink, blue, golden and white cities of Rajasthan: Jaipur\'s palaces, Pushkar\'s lake, Jodhpur under Mehrangarh fort, Jaisalmer\'s sandstone citadel in the Thar desert, the Jain temples of Ranakpur and the hill walls of Kumbhalgarh, ending by the lakes of Udaipur.',
    sources: [
      REPORT('The Travel Blog: three weeks in Rajasthan', 'https://thetravelblog.at/magic-of-india-a-3-week-rajasthan-travel-guide'),
      REPORT('Frommer\'s: planning a trip to Rajasthan', 'https://www.frommers.com/destinations/rajasthan/planning-a-trip'),
    ],
    approximate: 'A common loop; the roads are the router\'s choice.',
    stops: [
      { q: 'Jaipur, Rajasthan', name: 'Jaipur', wiki: 'Hawa Mahal', text: 'The pink city: Hawa Mahal, the City Palace and Amber Fort on its hill.' },
      { q: 'Pushkar, Rajasthan', name: 'Pushkar', wiki: 'Pushkar', text: 'A holy lake ringed by bathing ghats; the camel fair in November.' },
      { q: 'Jodhpur, Rajasthan', name: 'Jodhpur', wiki: 'Mehrangarh', text: 'The blue city below Mehrangarh, one of India\'s mightiest forts.', source: REPORT('Frommer\'s: Rajasthan by road', 'https://www.frommers.com/destinations/rajasthan/planning-a-trip') },
      { q: 'Jaisalmer, Rajasthan', name: 'Jaisalmer', wiki: 'Jaisalmer Fort', text: 'A golden sandstone fort that people still live in; a night in the dunes of Sam or Khuri.' },
      { q: 'Ranakpur, Rajasthan', name: 'Ranakpur', wiki: 'Ranakpur Jain Temple', text: 'A marble Jain temple of 1,444 carved pillars.' },
      { q: 'Kumbhalgarh Fort', name: 'Kumbhalgarh', wiki: 'Kumbhalgarh', text: 'Walls of more than 30 km over the Aravalli hills.' },
      { q: 'Udaipur, Rajasthan', name: 'Udaipur', wiki: 'Lake Pichola', text: 'Lake Pichola and its white palaces, the end.' },
    ],
  },
  {
    id: 'south-india-ghats',
    title: 'South India: Western Ghats by motorcycle',
    who: 'Classic route · Karnataka, Tamil Nadu and Kerala',
    when: 'September to March',
    vehicle: 'Royal Enfield or any motorcycle, 8–12 days',
    kind: 'moto',
    color: '#16a34a',
    summary: 'From Bengaluru through Mysuru\'s palace and the coffee hills of Coorg, the forests of Wayanad, the hairpins up to Ooty and Kodaikanal, the tea estates of Munnar, then down to Kerala\'s backwaters and Kochi. Twisty, green and full of spices.',
    sources: [
      REPORT('Vintage Rides: The Spices Route, a travel story', 'https://www.vintagerides.com/gb/blog/the-spices-route-a-travel-story-by-paul-ollett/'),
      REPORT('xBHP: the southern escapade, riding solo across 5 states', 'https://www.xbhp.com/talkies/tourer/30136-the-southern-escapade-riding-solo-across-5-states'),
    ],
    approximate: 'A common loop of hill stations; the roads are the router\'s choice.',
    stops: [
      { q: 'Bengaluru, Karnataka', name: 'Bengaluru', wiki: 'Bangalore', text: 'Out of the big city early to beat the traffic.' },
      { q: 'Mysuru, Karnataka', name: 'Mysuru', wiki: 'Mysore Palace', text: 'The maharajas\' palace, lit up on Sunday nights.' },
      { q: 'Madikeri, Karnataka', name: 'Coorg', wiki: 'Kodagu district', text: 'Coffee estates and misty hills in Kodagu.', source: REPORT('xBHP: southern escapade', 'https://www.xbhp.com/talkies/tourer/30136-the-southern-escapade-riding-solo-across-5-states') },
      { q: 'Kalpetta, Kerala', name: 'Wayanad', wiki: 'Wayanad district', text: 'Forest roads where elephants cross, and spice gardens.' },
      { q: 'Ooty, Tamil Nadu', name: 'Ooty', wiki: 'Ooty', text: 'Up the 36 hairpins from Masinagudi to the Nilgiri hill station.' },
      { q: 'Kodaikanal, Tamil Nadu', name: 'Kodaikanal', wiki: 'Kodaikanal', text: 'Down to the plains and up again into the Palani hills.' },
      { q: 'Munnar, Kerala', name: 'Munnar', wiki: 'Munnar', text: 'Tea estates on every slope.', source: REPORT('Vintage Rides: The Spices Route', 'https://www.vintagerides.com/gb/blog/the-spices-route-a-travel-story-by-paul-ollett/') },
      { q: 'Alappuzha, Kerala', name: 'Alappuzha', wiki: 'Alappuzha', text: 'The backwaters: a night on a houseboat while the bike rests.' },
      { q: 'Fort Kochi, Kerala', name: 'Kochi', wiki: 'Fort Kochi', text: 'Chinese fishing nets and the old spice-trading quarter.' },
    ],
  },
  // ---- Africa ----
  {
    id: 'kilimanjaro-machame',
    title: 'Kilimanjaro: the Machame route',
    who: 'Classic route · to the roof of Africa',
    when: 'January–March and June–October (dry seasons)',
    vehicle: 'On foot with guides and porters, 6–7 days',
    kind: 'walk',
    color: '#78350f',
    summary: 'The "whiskey route" up Africa\'s highest mountain: through rainforest, heath and alpine desert to the glaciers of Uhuru Peak at 5,895 m. Climb high, sleep low: the route\'s shape helps acclimatisation, and seven days is safer than six.',
    sources: [
      REPORT('Adventure Peaks: Machame expedition news (October 2025)', 'https://www.adventurepeaks.com/news/kilimanjaro-machme-expedition-news-18th-october-2025/'),
      REPORT('Wandering Footprints: climbing Kilimanjaro (September 2025)', 'https://wandering-footprints.blogspot.com/2025/09/climbing-kilimanjaro-part-i.html'),
    ],
    approximate: 'The usual camps; the line follows mountain paths where they were found.',
    stops: [
      { q: 'Machame Gate, Kilimanjaro', name: 'Machame Gate', wiki: 'Machame', text: 'Registration at about 1,800 m and into the rainforest.' },
      { q: 'Machame Camp, Kilimanjaro', name: 'Machame Camp', wiki: 'Mount Kilimanjaro', text: 'The first night at the forest\'s edge.' },
      { q: 'Shira 2 Camp, Kilimanjaro', at: [-3.0545, 37.2762], name: 'Shira Camp', wiki: 'Shira', text: 'Onto the Shira plateau, the summit cone ahead.' },
      { q: 'Lava Tower, Kilimanjaro', name: 'Lava Tower', wiki: 'Mount Kilimanjaro', text: 'Up to 4,600 m for acclimatisation, then down again to sleep.' },
      { q: 'Barranco Camp, Kilimanjaro', name: 'Barranco Camp', wiki: 'Mount Kilimanjaro', text: 'Giant groundsels in a valley under the Breach Wall.' },
      { q: 'Karanga Camp, Kilimanjaro', name: 'Karanga', wiki: 'Mount Kilimanjaro', text: 'Over the Barranco Wall, a hands-on scramble, and across the valleys.', source: REPORT('Adventure Peaks (2025)', 'https://www.adventurepeaks.com/news/kilimanjaro-machme-expedition-news-18th-october-2025/') },
      { q: 'Barafu Camp, Kilimanjaro', name: 'Barafu Camp', wiki: 'Mount Kilimanjaro', text: 'High camp on bare rock at 4,600 m. Sleep a few hours; the summit push starts around midnight.' },
      { q: 'Uhuru Peak', name: 'Uhuru Peak', wiki: 'Uhuru Peak', text: 'Stella Point on the crater rim at dawn, then Uhuru, 5,895 m, by the glaciers.' },
      { q: 'Mweka Camp, Kilimanjaro', name: 'Mweka Camp', wiki: 'Mount Kilimanjaro', text: 'A long descent the same day back into the trees.' },
      { q: 'Mweka Gate, Kilimanjaro', name: 'Mweka Gate', wiki: 'Moshi', text: 'Certificates, songs with the crew, and a cold beer.' },
    ],
  },
  {
    id: 'namibia-loop',
    title: 'Namibia: desert and Etosha loop',
    who: 'Classic route · self-drive with a rooftop tent',
    when: 'May to October (dry, cool nights)',
    vehicle: '4x4 with rooftop tent, 12–16 days',
    kind: '4x4',
    color: '#c2410c',
    summary: 'The classic self-drive: from Windhoek over the escarpment to the red dunes of Sossusvlei, along the foggy Atlantic coast at Swakopmund and Cape Cross, through Spitzkoppe and the rock art of Damaraland, to the waterholes of Etosha. Long gravel roads, few people, huge skies.',
    sources: [
      REPORT('Lizy Travels the World: Namibia road trip day by day', 'https://lizytravelstheworld.com/namibia-road-trip-two-week-itinerary-day-by-day/'),
      REPORT('Rough Guides: planning a self-drive safari in Namibia', 'https://www.roughguides.com/namibia/self-drive-safari/'),
    ],
    approximate: 'A common two-week loop; the gravel roads are the router\'s choice.',
    stops: [
      { q: 'Windhoek, Namibia', name: 'Windhoek', wiki: 'Windhoek', text: 'Pick up the 4x4, stock up on water and food.' },
      { q: 'Sesriem, Namibia', name: 'Sossusvlei', wiki: 'Sossusvlei', text: 'Over the Spreetshoogte pass to Sesriem; at dawn, the dunes and the dead trees of Deadvlei.' },
      { q: 'Solitaire, Namibia', name: 'Solitaire', wiki: 'Solitaire, Namibia', text: 'A desert stop famous for its apple pie.' },
      { q: 'Swakopmund, Namibia', name: 'Swakopmund', wiki: 'Swakopmund', text: 'Through the Kuiseb canyon to a German-era town in the coastal fog.', source: REPORT('Lizy Travels the World', 'https://lizytravelstheworld.com/namibia-road-trip-two-week-itinerary-day-by-day/') },
      { q: 'Cape Cross, Namibia', name: 'Cape Cross', wiki: 'Cape Cross', text: 'Tens of thousands of fur seals on the Skeleton Coast.' },
      { q: 'Spitzkoppe, Namibia', name: 'Spitzkoppe', wiki: 'Spitzkoppe', text: 'Granite peaks and wild campsites among the boulders.' },
      { q: 'Twyfelfontein, Namibia', name: 'Twyfelfontein', wiki: 'Twyfelfontein', text: 'Thousands of rock engravings in Damaraland; desert elephants nearby.' },
      { q: 'Okaukuejo, Namibia', name: 'Etosha: Okaukuejo', wiki: 'Etosha National Park', text: 'A floodlit waterhole where rhinos and lions come to drink at night.' },
      { q: 'Halali, Etosha', name: 'Etosha: Halali', at: [-19.0333, 16.4667], route: 'line', wiki: 'Etosha pan', text: 'The middle camp, with a waterhole under a rocky hill.' },
      { q: 'Namutoni, Namibia', at: [-18.8063, 16.9417], route: 'line', name: 'Etosha: Namutoni', wiki: 'Etosha pan', text: 'An old German fort at the east end of the pan.' },
      { q: 'Windhoek, Namibia', name: 'Back in Windhoek', wiki: 'Namibia', text: 'South on tarmac to return the car.' },
    ],
  },
  {
    id: 'botswana-overland',
    title: 'Botswana: Okavango to Chobe',
    who: 'Classic route · self-drive safari',
    when: 'May to October (dry season, best game)',
    vehicle: 'Equipped 4x4, 10–14 days, park campsites',
    kind: '4x4',
    color: '#4d7c0f',
    summary: 'Salt pans and baobabs, then into the wild: Moremi on the edge of the Okavango Delta, the Khwai river, the deep sand to Savuti, and the Chobe riverfront\'s elephant herds. Unfenced campsites, river crossings, and park bookings made months ahead.',
    sources: [
      REPORT('Getaway: road-tripping northern Botswana', 'https://getaway.co.za/photography/road-tripping-northern-botswana-photo-blog'),
      REPORT('We Will Nomad: Botswana by road, a self-drive diary', 'https://www.wewillnomad.com/post/botswana-by-road-our-self-drive-safari-diary'),
    ],
    approximate: 'The classic circuit; tracks in the parks shift with the seasons.',
    stops: [
      { q: 'Nata, Botswana', name: 'Nata', wiki: 'Nata, Botswana', text: 'The edge of the Makgadikgadi pans, with flamingos in the wet season.' },
      { q: 'Gweta, Botswana', name: 'Gweta', wiki: 'Makgadikgadi Pan', text: 'Baobabs and meerkats; trips onto the salt pans.' },
      { q: 'Maun, Botswana', name: 'Maun', wiki: 'Maun', text: 'The safari town: fuel, food, permits, and scenic flights over the Delta.', source: REPORT('Getaway: northern Botswana', 'https://getaway.co.za/photography/road-tripping-northern-botswana-photo-blog') },
      { q: 'Third Bridge, Moremi', name: 'Third Bridge', at: [-19.2386, 23.3531], wiki: 'Moremi Game Reserve', text: 'Moremi\'s famous camp in the Delta, with lions and wild dogs about.' },
      { q: 'Khwai, Botswana', name: 'Khwai', wiki: 'Khwai River', text: 'A river of hippos and elephants on Moremi\'s northern edge.' },
      { q: 'Savuti', name: 'Savuti', at: [-18.5667, 24.0667], wiki: 'Savuti', text: 'Deep sand across the Mababe depression to the Savuti channel, lion country.' },
      { q: 'Chobe Riverfront', name: 'Chobe Riverfront', at: [-17.8167, 25.0333], wiki: 'Chobe National Park', text: 'Hundreds of elephants coming to drink in the afternoon.' },
      { q: 'Kasane, Botswana', name: 'Kasane', wiki: 'Kasane', text: 'The end, a short hop from Victoria Falls.' },
    ],
  },
  {
    id: 'cape-town-garden-route-bike',
    title: 'Cape Town to the Garden Route by bike',
    who: 'Classic route · South Africa\'s Western Cape',
    when: 'October to April',
    vehicle: 'Touring or road bike, 10–14 days',
    kind: 'bike',
    color: '#0369a1',
    summary: 'From Cape Town through the Winelands to whale-watching Hermanus, inland over the Tradouw Pass to Route 62 and the ostrich country of the Little Karoo, then over the Outeniqua mountains to the lagoons and forests of the Garden Route at Knysna.',
    sources: [
      REPORT('Exodus: cycling the Garden Route, trip notes (2025)', 'https://www.exodus.co.uk/tripnotes/mzc/20311'),
      REPORT('Cycloscope: Tradouw Pass, Barrydale and the Seven Passes Road', 'https://cycloscope.net/tradouw-pass-barrydale-seven-passes/'),
    ],
    approximate: 'A common cycling line; the roads are the router\'s choice.',
    stops: [
      { q: 'Cape Town, South Africa', name: 'Cape Town', wiki: 'Table Mountain', text: 'Under Table Mountain, the start.' },
      { q: 'Franschhoek, South Africa', name: 'Franschhoek', wiki: 'Franschhoek', text: 'Through the vineyards of the Cape Winelands.' },
      { q: 'Hermanus, South Africa', name: 'Hermanus', wiki: 'Hermanus', text: 'Over the passes to the coast, where southern right whales come close in spring.' },
      { q: 'Swellendam, South Africa', name: 'Swellendam', wiki: 'Swellendam', text: 'One of South Africa\'s oldest towns, under the Langeberg.' },
      { q: 'Barrydale, South Africa', name: 'Barrydale', wiki: 'Tradouw Pass', text: 'The Tradouw Pass through a red-rock gorge onto Route 62.', source: REPORT('Cycloscope: Tradouw Pass', 'https://cycloscope.net/tradouw-pass-barrydale-seven-passes/') },
      { q: 'Calitzdorp, South Africa', name: 'Calitzdorp', wiki: 'Route 62 (South Africa)', text: 'The quiet Little Karoo road, port wine and dry hills.' },
      { q: 'Oudtshoorn, South Africa', name: 'Oudtshoorn', wiki: 'Oudtshoorn', text: 'Ostrich farms and the Cango Caves.' },
      { q: 'Wilderness, South Africa', name: 'Wilderness', wiki: 'Wilderness, Western Cape', text: 'Over the Outeniqua mountains to the sea, by George and the old Seven Passes Road.' },
      { q: 'Knysna, South Africa', name: 'Knysna', wiki: 'Knysna', text: 'A lagoon between forested hills, the end of the ride.', source: REPORT('Exodus trip notes', 'https://www.exodus.co.uk/tripnotes/mzc/20311') },
    ],
  },
  {
    id: 'congo-nile-trail',
    title: 'Congo Nile Trail',
    who: 'Classic route · Rwanda along Lake Kivu by bike',
    when: 'June to September and December to February (drier)',
    vehicle: 'Mountain or gravel bike, 5–7 days',
    kind: 'bike',
    color: '#15803d',
    summary: 'About 230–260 km along the shore of Lake Kivu, from Rubavu to Rusizi on the border with the DR Congo: red dirt roads over endless steep hills of tea, coffee and banana, with a lot of climbing and children running alongside. Guesthouses and lake beaches at the ends of the days.',
    sources: [
      REPORT('Bikepacking.com: the Congo Nile Trail (bikepacker\'s edition)', 'https://bikepacking.com/routes/congo-nile-trail/'),
      REPORT('Afar: five days biking Rwanda\'s Congo Nile Trail', 'https://www.afar.com/magazine/what-its-like-biking-rwandas-congo-nile-trail'),
    ],
    approximate: 'The usual stages; the line follows tracks near the marked trail.',
    stops: [
      { q: 'Gisenyi, Rwanda', name: 'Rubavu (Gisenyi)', wiki: 'Gisenyi', text: 'A lakeside town with a beach, facing Goma across the border.' },
      { q: 'Kinunu, Rwanda', name: 'Kinunu', at: [-1.9547, 29.3036], wiki: 'Lake Kivu', text: 'Up and down the first steep hills to a coffee washing station by the lake.', source: REPORT('Bikepacking.com route', 'https://bikepacking.com/routes/congo-nile-trail/') },
      { q: 'Kibuye, Rwanda', name: 'Karongi (Kibuye)', wiki: 'Kibuye', text: 'Islands and peninsulas on the lake, and a memorial to remember 1994.' },
      { q: 'Kirambo, Nyamasheke', name: 'Nyamasheke', at: [-2.3181, 29.1186], wiki: 'Nyamasheke District', text: 'Tea estates and fishing boats; the hardest climbing of the trail.', source: REPORT('Afar (5 days)', 'https://www.afar.com/magazine/what-its-like-biking-rwandas-congo-nile-trail') },
      { q: 'Kamembe, Rwanda', name: 'Rusizi (Kamembe)', wiki: 'Rusizi District', text: 'The south end of the lake, close to Nyungwe forest for chimpanzees.' },
    ],
  },
  {
    id: 'lisbon-dakar',
    title: 'Lisbon to Dakar',
    who: 'Classic route · overland by adventure motorcycle',
    when: 'November to March',
    vehicle: 'Adventure motorcycle, 3–4 weeks',
    kind: 'moto',
    color: '#9a3412',
    summary: 'The old rally\'s spirit on public roads: from Lisbon to the Strait of Gibraltar, through Morocco and down the long Atlantic desert road, across Mauritania\'s Sahara and the Senegal river to Saint-Louis and Dakar. Borders take hours; plan visas and the Diama crossing.',
    sources: [
      REPORT('Ducati: route to Dakar with the Multistrada V4 Rally', 'https://www.ducati.com/au/en/stories/travel/route-to-dakar-with-the-multistrada-v4-rally'),
      REPORT('JB\'s Trails: riding a motorcycle across Mauritania', 'https://jbstrails.com/?p=24857'),
    ],
    approximate: 'The main towns on the coastal route; the roads are the router\'s choice.',
    stops: [
      { q: 'Lisbon, Portugal', name: 'Lisbon', wiki: 'Lisbon', text: 'The start, by the Tagus.' },
      { q: 'Tarifa, Spain', name: 'Tarifa', wiki: 'Tarifa', text: 'Through the Alentejo and Andalusia to the southern tip of Europe.' },
      { q: 'Tangier, Morocco', name: 'Tangier', by: 'ferry', wiki: 'Tangier', text: 'A short ferry over the Strait into Africa.' },
      { q: 'Marrakech, Morocco', name: 'Marrakech', wiki: 'Marrakesh', text: 'South past Rabat to the red city.' },
      { q: 'Agadir, Morocco', name: 'Agadir', wiki: 'Agadir', text: 'Over the Atlas to the Atlantic surf coast.' },
      { q: 'Tan-Tan, Morocco', name: 'Tan-Tan', wiki: 'Tan-Tan', text: 'Into the desert; the road follows the ocean cliffs for days.' },
      { q: 'Laayoune', name: 'Laâyoune', wiki: 'Laayoune', text: 'The main town of Western Sahara, police checkpoints on the way.' },
      { q: 'Dakhla', name: 'Dakhla', wiki: 'Dakhla', text: 'A lagoon peninsula famous for kitesurfing, the last big stop before the border.' },
      { q: 'Nouadhibou, Mauritania', name: 'Nouadhibou', wiki: 'Nouadhibou', text: 'Across the no-man\'s-land at Guerguerat into Mauritania.' },
      { q: 'Nouakchott, Mauritania', name: 'Nouakchott', wiki: 'Nouakchott', text: 'Desert tarmac with fuel only every few hundred kilometres.', source: REPORT('JB\'s Trails: across Mauritania', 'https://jbstrails.com/?p=24857') },
      { q: 'Saint-Louis, Senegal', name: 'Saint-Louis', wiki: 'Saint-Louis, Senegal', text: 'By the Diama dam and the Djoudj bird park into Senegal\'s old colonial capital.' },
      { q: 'Dakar, Senegal', name: 'Dakar', wiki: 'Dakar', text: 'The finish at Africa\'s westernmost city; many ride on to Lac Rose, the old rally finish.', source: REPORT('Ducati: route to Dakar', 'https://www.ducati.com/au/en/stories/travel/route-to-dakar-with-the-multistrada-v4-rally') },
    ],
  },
  // ---- Batch 3: around the world ----
  {
    id: 'kumano-kodo',
    title: 'Kumano Kodo: the Nakahechi',
    who: 'Classic route · Japan\'s imperial pilgrimage, a sister trail of the Camino',
    when: 'March–May and October–November',
    vehicle: 'On foot, 4–5 days, family inns (minshuku)',
    kind: 'walk',
    color: '#be123c',
    summary: 'The emperors\' old pilgrimage route through the forested mountains of the Kii peninsula to the three Grand Shrines of Kumano: stone paths under cedars, small oji shrines, hot springs at night and dinners in family inns. Walkers of both this and the Camino de Santiago can become "dual pilgrims".',
    sources: [
      REPORT('Third Eye Mom: Chikatsuyu to Hongu (October 2025)', 'https://thirdeyemom.com/2025/10/21/hiking-the-kumano-kodo-nakahechi-trail-chikatsuyu-to-hongu-grand-shrine/'),
      REPORT('Ski Kangae: Kumano Kodo day 1 (March 2025)', 'https://skikangae.blogspot.com/2025/03/kumano-kodo-day-1.html'),
    ],
    approximate: 'The usual stages; the line follows paths near the waymarked trail.',
    stops: [
      { q: 'Kii-Tanabe Station', name: 'Kii-Tanabe', wiki: 'Tanabe, Wakayama', text: 'The coastal town where pilgrims gather; a bus to the trailhead.' },
      { q: 'Takijiri-oji', name: 'Takijiri-oji', by: 'bus', wiki: 'Takijiri-ōji', text: 'The traditional entrance to the sacred mountains, and a steep first climb.', source: REPORT('Ski Kangae: day 1 (2025)', 'https://skikangae.blogspot.com/2025/03/kumano-kodo-day-1.html') },
      { q: 'Takahara, Tanabe', name: 'Takahara', wiki: 'Kumano Kodō', text: 'A hilltop village called "the village in the mist", looking over the mountains.' },
      { q: 'Chikatsuyu, Tanabe', name: 'Chikatsuyu', wiki: 'Nakahechi', text: 'A river village of minshuku inns: the end of the first day, about 13 km.' },
      { q: 'Hosshinmon-oji', name: 'Hosshinmon-oji', wiki: 'Hosshinmon-ōji', text: 'The longest day, through forest and tea fields to the "gate of awakening".', source: REPORT('Third Eye Mom (2025)', 'https://thirdeyemom.com/2025/10/21/hiking-the-kumano-kodo-nakahechi-trail-chikatsuyu-to-hongu-grand-shrine/') },
      { q: 'Kumano Hongu Taisha', name: 'Kumano Hongu Taisha', wiki: 'Kumano Hongū Taisha', text: 'The first Grand Shrine, and the giant torii gate at Oyunohara.' },
      { q: 'Yunomine Onsen', name: 'Yunomine Onsen', wiki: 'Yunomine Onsen', text: 'One of Japan\'s oldest hot springs, with a tiny bath carved in the river rock.' },
      { q: 'Koguchi, Shingu', name: 'Koguchi', by: 'bus', wiki: 'Kumano Kodō', text: 'A bus to Ukegawa, then the Kogumotori-goe trail down to a valley hamlet.' },
      { q: 'Kumano Nachi Taisha', name: 'Kumano Nachi Taisha', wiki: 'Kumano Nachi Taisha', text: 'Over the steep Ogumotori-goe to the shrine and pagoda by Japan\'s tallest waterfall.' },
    ],
  },
  {
    id: 'lycian-way',
    title: 'Lycian Way',
    who: 'Classic route · Türkiye\'s Mediterranean coast on foot',
    when: 'March–May and September–November',
    vehicle: 'On foot, 2–5 weeks (or highlights in a week)',
    kind: 'walk',
    color: '#0284c7',
    summary: 'About 540 km of old mule paths and Roman roads along the Turquoise Coast from Fethiye towards Antalya: cliff paths above turquoise bays, the ruins of Lycian cities, rock tombs and sunken Kekova, with village pensions and camping. Hot in summer; spring and autumn are best.',
    sources: [
      REPORT('The Gone Goat: hiking the Lycian Way in a week', 'https://www.thegonegoat.com/turkey/hiking-the-lycian-way-turkey'),
      REPORT('Novo-Monde: the Lycian Way from Fethiye to Kabak', 'https://www.novo-monde.com/en/lycian-way-fethiye-kabak/'),
    ],
    approximate: 'Main stages from Ölüdeniz to Çıralı; the line follows paths near the marked trail.',
    stops: [
      { q: 'Ölüdeniz, Fethiye', name: 'Ölüdeniz', wiki: 'Ölüdeniz', text: 'The famous blue lagoon at the start, paragliders overhead.' },
      { q: 'Faralya, Fethiye', name: 'Faralya', wiki: 'Butterfly Valley, Turkey', text: 'High above Butterfly Valley, a gorge running down to a hidden beach.', source: REPORT('Novo-Monde: Fethiye to Kabak', 'https://www.novo-monde.com/en/lycian-way-fethiye-kabak/') },
      { q: 'Kabak, Fethiye', name: 'Kabak', wiki: 'Kabak, Fethiye', text: 'A wild bay of tree-house camps and yoga retreats.' },
      { q: 'Alınca, Muğla', name: 'Alınca', at: [36.4478, 29.1431], wiki: 'Seydikemer', text: 'A cliff-top hamlet with one of the trail\'s great views.' },
      { q: 'Patara, Antalya', name: 'Patara', wiki: 'Patara', text: 'A Lycian capital half buried in dunes, beside an 18 km beach where turtles nest.' },
      { q: 'Kalkan, Antalya', name: 'Kalkan', wiki: 'Kalkan', text: 'A white-house harbour town.' },
      { q: 'Kaş, Antalya', name: 'Kaş', wiki: 'Kaş', text: 'A lively little town with an ancient theatre facing the Greek island of Kastellorizo.', source: REPORT('The Gone Goat', 'https://www.thegonegoat.com/turkey/hiking-the-lycian-way-turkey') },
      { q: 'Üçağız, Demre', name: 'Üçağız (Kekova)', wiki: 'Kekova', text: 'A fishing village by the sunken city of Kekova and the castle of Simena.' },
      { q: 'Demre, Antalya', name: 'Demre (Myra)', wiki: 'Myra', text: 'Rock-cut tombs of Myra and the church of Saint Nicholas, the original Santa Claus.' },
      { q: 'Adrasan, Kumluca', name: 'Adrasan', wiki: 'Adrasan', text: 'Round the cape by Gelidonya lighthouse to a quiet bay.' },
      { q: 'Çıralı, Kemer', name: 'Çıralı (Olympos)', wiki: 'Olympos (Lycia)', text: 'Ruins of Olympos among the trees, and the eternal flames of the Chimaera on the hill.' },
    ],
  },
  {
    id: 'iceland-ring-road-bike',
    title: 'Iceland\'s Ring Road by bike',
    who: 'Classic route · round Iceland on Route 1',
    when: 'June to August',
    vehicle: 'Touring bike with camping gear, 3–4 weeks',
    kind: 'bike',
    color: '#2563eb',
    summary: 'About 1,350 km round the island on Route 1: lava fields, waterfalls, the north\'s fjords and Mývatn\'s craters, the empty east, glaciers and the iceberg lagoon in the south. The wind decides the day: carry warm and waterproof clothes, and time for bad weather.',
    sources: [
      REPORT('AliceAlain: the call of Iceland, 22 days by bike (2025)', 'https://findpenguins.com/alicealain/trip/the-call-of-iceland'),
      REPORT('Cycling West: bike touring Iceland\'s Ring Road', 'https://cyclingwest.com/?p=33927'),
    ],
    approximate: 'The Ring Road and the usual overnight towns.',
    stops: [
      { q: 'Reykjavík, Iceland', name: 'Reykjavík', wiki: 'Reykjavík', text: 'Bikes built at the airport, the first campsite in the capital.', source: REPORT('AliceAlain (2025)', 'https://findpenguins.com/alicealain/trip/the-call-of-iceland') },
      { q: 'Borgarnes, Iceland', name: 'Borgarnes', wiki: 'Borgarnes', text: 'Saga country, under the Hvalfjörður tunnel (bikes go round the fjord).' },
      { q: 'Blönduós, Iceland', name: 'Blönduós', wiki: 'Blönduós', text: 'North over the Holtavörðuheiði moor.' },
      { q: 'Akureyri, Iceland', name: 'Akureyri', wiki: 'Akureyri', text: 'The north\'s capital at the head of a long fjord.' },
      { q: 'Reykjahlíð, Iceland', name: 'Mývatn', wiki: 'Mývatn', text: 'Past Goðafoss to a lake of craters, steaming vents and a nature bath.' },
      { q: 'Egilsstaðir, Iceland', name: 'Egilsstaðir', wiki: 'Egilsstaðir', text: 'Across the highland desert, the longest empty stretch, to the green east.' },
      { q: 'Djúpivogur, Iceland', name: 'Djúpivogur', wiki: 'Djúpivogur', text: 'Down the East Fjords\' winding coast.' },
      { q: 'Höfn, Iceland', name: 'Höfn', wiki: 'Höfn', text: 'A lobster town under the Vatnajökull ice cap.' },
      { q: 'Jökulsárlón', name: 'Jökulsárlón', wiki: 'Jökulsárlón', text: 'Icebergs floating out of the glacier lagoon; ice on the black beach.' },
      { q: 'Skaftafell, Iceland', name: 'Skaftafell', wiki: 'Skaftafell', text: 'Glacier tongues and the Svartifoss falls.' },
      { q: 'Vík í Mýrdal', name: 'Vík', wiki: 'Vík í Mýrdal', text: 'Across the Eldhraun lava to black-sand Reynisfjara.' },
      { q: 'Selfoss, Iceland', name: 'Selfoss', wiki: 'Seljalandsfoss', text: 'Past the waterfalls of Skógafoss and Seljalandsfoss.' },
      { q: 'Reykjavík, Iceland', name: 'Back in Reykjavík', wiki: 'Hallgrímskirkja', text: 'Over the Hellisheiði to the end.' },
    ],
  },
  {
    id: 'danube-cycle-path',
    title: 'Danube Cycle Path: Passau to Budapest',
    who: 'Classic route · EuroVelo 6, Europe\'s favourite river ride',
    when: 'April to October',
    vehicle: 'Any bike (lots of e-bikes), 10–14 days',
    kind: 'bike',
    color: '#0891b2',
    summary: 'About 630 km downhill along the Danube through Austria, Slovakia and Hungary: the best-signposted, smoothest stretch of EuroVelo 6 to Vienna, the vineyards and abbeys of the Wachau, three capitals, and a quieter, rougher Hungarian half. Easy, social, and good for families.',
    sources: [
      REPORT('Epsom CC: Graeme Aston, Regensburg to Budapest (August 2025)', 'https://www.epsomcc.co.uk/?p=11148'),
      REPORT('Cycloscope: Danube Cycling Path, the ultimate guide', 'https://cycloscope.net/danube-cycling-path-map/'),
    ],
    approximate: 'The usual stages; the line follows cycle paths near the river.',
    stops: [
      { q: 'Passau, Germany', name: 'Passau', wiki: 'Passau', text: 'The city of three rivers, where the Inn and the Ilz meet the Danube.', source: REPORT('Epsom CC (2025)', 'https://www.epsomcc.co.uk/?p=11148') },
      { q: 'Schlögen, Austria', name: 'Schlögen bend', wiki: 'Schlögener Schlinge', text: 'Into Austria and round the river\'s great hairpin loop.' },
      { q: 'Linz, Austria', name: 'Linz', wiki: 'Linz', text: 'A riverside city of art and technology.' },
      { q: 'Grein, Austria', name: 'Grein', wiki: 'Strudengau', text: 'The wooded Strudengau gorge.' },
      { q: 'Melk, Austria', name: 'Melk', wiki: 'Melk Abbey', text: 'The golden baroque abbey high over the river.' },
      { q: 'Dürnstein, Austria', name: 'Wachau', wiki: 'Wachau', text: 'Apricot orchards and terraced vineyards; Richard the Lionheart\'s castle ruin above Dürnstein.' },
      { q: 'Tulln an der Donau', name: 'Tulln', wiki: 'Tulln an der Donau', text: 'Flat river meadows towards the capital.' },
      { q: 'Vienna, Austria', name: 'Vienna', wiki: 'Vienna', text: 'Coffee houses, palaces, and a rest day well spent.' },
      { q: 'Bratislava, Slovakia', name: 'Bratislava', wiki: 'Bratislava Castle', text: 'A second capital an hour\'s ride away, under its castle.' },
      { q: 'Győr, Hungary', name: 'Győr', wiki: 'Győr', text: 'Into Hungary: a baroque town between rivers.' },
      { q: 'Komárom, Hungary', name: 'Komárom', wiki: 'Komárom', text: 'Fortresses on both banks, Hungary and Slovakia.' },
      { q: 'Esztergom, Hungary', name: 'Esztergom', wiki: 'Esztergom Basilica', text: 'Hungary\'s huge basilica, then the river turns south through the Danube Bend.' },
      { q: 'Budapest, Hungary', name: 'Budapest', wiki: 'Hungarian Parliament Building', text: 'The parliament on the river and a thermal bath to finish.' },
    ],
  },
  {
    id: 'route-66',
    title: 'Route 66',
    who: 'Classic route · America\'s Main Street by motorcycle',
    when: 'May–June and September–October',
    vehicle: 'Motorcycle (a Harley, traditionally), 2–3 weeks',
    kind: 'moto',
    color: '#b91c1c',
    summary: 'About 3,900 km from Chicago to the Pacific through eight states, on what is left of the 1926 highway: diners, motels and gas stations frozen in time, the plains, the desert Southwest and the Mojave. The road turns 100 in 2026; old alignments run beside the interstates.',
    sources: [
      REPORT('Rider Magazine: recollections of a Route 66 motorcycle ride (July 2025)', 'https://ridermagazine.com/2025/07/17/yore-mother-road-recollections-of-a-route-66-motorcycle-ride/'),
      REPORT('Reflections Around the Campfire: Route 66 start to finish (October 2025)', 'https://reflectionsaroundthecampfire.blogspot.com/2025/10/route-66-start-to-finish-chicago-to.html'),
    ],
    approximate: 'The towns along Route 66; the line follows today\'s roads, often the interstate beside the old one.',
    stops: [
      { q: 'Grant Park, Chicago', name: 'Chicago', wiki: 'U.S. Route 66', text: 'The "Begin Route 66" sign on Adams Street.' },
      { q: 'Pontiac, Illinois', name: 'Pontiac', wiki: 'Pontiac, Illinois', text: 'Murals and the Route 66 Hall of Fame museum.' },
      { q: 'Springfield, Illinois', name: 'Springfield, IL', wiki: 'Springfield, Illinois', text: 'Lincoln\'s home town and the Cozy Dog drive-in.' },
      { q: 'St. Louis, Missouri', name: 'St. Louis', wiki: 'Gateway Arch', text: 'Over the Chain of Rocks bridge to the Gateway Arch.' },
      { q: 'Springfield, Missouri', name: 'Springfield, MO', wiki: 'Springfield, Missouri', text: 'Through the Ozarks, where Route 66 was born on paper.' },
      { q: 'Tulsa, Oklahoma', name: 'Tulsa', wiki: 'Tulsa, Oklahoma', text: 'Neon signs and art deco in Oklahoma.' },
      { q: 'Oklahoma City', name: 'Oklahoma City', wiki: 'Oklahoma City', text: 'Pops, with its giant soda bottle, on the way in.' },
      { q: 'Amarillo, Texas', name: 'Amarillo', wiki: 'Cadillac Ranch', text: 'Ten Cadillacs nose-down in a field, spray cans welcome.' },
      { q: 'Tucumcari, New Mexico', name: 'Tucumcari', wiki: 'Tucumcari, New Mexico', text: 'Neon motels like the Blue Swallow.' },
      { q: 'Santa Rosa, New Mexico', name: 'Santa Rosa', wiki: 'Blue Hole (New Mexico)', text: 'The Blue Hole, a desert spring for divers.' },
      { q: 'Albuquerque, New Mexico', name: 'Albuquerque', wiki: 'Albuquerque, New Mexico', text: 'Central Avenue\'s long neon strip.' },
      { q: 'Gallup, New Mexico', name: 'Gallup', wiki: 'Gallup, New Mexico', text: 'Native American trading posts and the El Rancho hotel of the film stars.' },
      { q: 'Winslow, Arizona', name: 'Winslow', wiki: 'Petrified Forest National Park', text: 'Past the Painted Desert and the Petrified Forest to "standin\' on the corner".' },
      { q: 'Flagstaff, Arizona', name: 'Flagstaff', wiki: 'Flagstaff, Arizona', text: 'Pine forest; the Grand Canyon is a short detour north.' },
      { q: 'Seligman, Arizona', name: 'Seligman', wiki: 'Seligman, Arizona', text: 'The longest surviving stretch of old 66 starts here.' },
      { q: 'Oatman, Arizona', name: 'Oatman', wiki: 'Oatman, Arizona', text: 'Over the Sitgreaves Pass hairpins to a mining town where wild burros walk the street.', source: REPORT('Rider Magazine (2025)', 'https://ridermagazine.com/2025/07/17/yore-mother-road-recollections-of-a-route-66-motorcycle-ride/') },
      { q: 'Barstow, California', name: 'Barstow', wiki: 'Mojave Desert', text: 'Across the Mojave past Amboy and Roy\'s Motel.' },
      { q: 'Santa Monica Pier', name: 'Santa Monica', wiki: 'Santa Monica Pier', text: 'The "End of the Trail" sign on the pier, and the Pacific.', source: REPORT('Reflections Around the Campfire (2025)', 'https://reflectionsaroundthecampfire.blogspot.com/2025/10/route-66-start-to-finish-chicago-to.html') },
    ],
  },
  {
    id: 'great-ocean-road',
    title: 'Great Ocean Road',
    who: 'Classic route · Victoria\'s coast by motorcycle',
    when: 'November to April',
    vehicle: 'Motorcycle (or car), 2–3 days',
    kind: 'moto',
    color: '#0e7490',
    summary: 'About 250 km of coast road built by soldiers back from the First World War: surf beaches, rainforest in the Otways, koalas in the trees and the limestone stacks of the Twelve Apostles. Wet shaded corners and tourist traffic; ride it early.',
    sources: [
      REPORT('Adam Ch: Great Ocean Road trip, Adelaide to Melbourne by motorcycle', 'https://adamch.com/great-ocean-road-trip/'),
      REPORT('Adventure Bike Rider: is this the best coastal road in the world?', 'https://www.adventurebikerider.com/is-this-the-best-coastal-road-in-the-world/'),
    ],
    approximate: 'The usual stops from Torquay to Port Fairy.',
    stops: [
      { q: 'Torquay, Victoria', name: 'Torquay', wiki: 'Torquay, Victoria', text: 'The surf capital, and the official start; Bells Beach is next door.' },
      { q: 'Lorne, Victoria', name: 'Lorne', wiki: 'Lorne, Victoria', text: 'The memorial arch, then the road clings to the cliffs.' },
      { q: 'Apollo Bay, Victoria', name: 'Apollo Bay', wiki: 'Apollo Bay', text: 'The halfway town in a curve of green hills.' },
      { q: 'Cape Otway Lightstation', name: 'Cape Otway', wiki: 'Cape Otway Lighthouse', text: 'Koalas in the gum trees on the road to the old lighthouse.' },
      { q: 'Twelve Apostles, Victoria', name: 'Twelve Apostles', wiki: 'The Twelve Apostles (Victoria)', text: 'Limestone stacks in the Southern Ocean, best at sunrise or sunset.', source: REPORT('Adventure Bike Rider', 'https://www.adventurebikerider.com/is-this-the-best-coastal-road-in-the-world/') },
      { q: 'Loch Ard Gorge', name: 'Loch Ard Gorge', wiki: 'Loch Ard Gorge', text: 'A gorge named after a shipwreck with two survivors.' },
      { q: 'Warrnambool, Victoria', name: 'Warrnambool', wiki: 'Warrnambool', text: 'Whales off Logans Beach in winter.' },
      { q: 'Port Fairy, Victoria', name: 'Port Fairy', wiki: 'Port Fairy', text: 'An old fishing village of stone cottages, the end.' },
    ],
  },
  {
    id: 'transfagarasan-transalpina',
    title: 'Transfăgărășan and Transalpina',
    who: 'Classic route · Romania\'s Carpathian high roads',
    when: 'July to October, when the passes are open',
    vehicle: 'Motorcycle, 4–5 days',
    kind: 'moto',
    color: '#7c3aed',
    summary: 'Two of Europe\'s great mountain roads in the Carpathians: the Transfăgărășan, carved by the army in the 1970s, with its wall of hairpins up to Bâlea Lake, and the Transalpina, higher and wilder, at 2,145 m. Between them, Dracula\'s real castle and the monasteries of Wallachia.',
    sources: [
      REPORT('Horizons Unlimited: Romania solo motorcycle trip (2025 thread)', 'https://www.horizonsunlimited.com/hubb/europe/romania-solo-motorcycle-trip-sept-106165-print'),
      REPORT('Calimoto: motorcycle tours in Romania', 'https://calimoto.com/en/blog/article/motorcycle-tours-romania'),
    ],
    approximate: 'A common loop from Sibiu.',
    stops: [
      { q: 'Sibiu, Romania', name: 'Sibiu', wiki: 'Sibiu', text: 'A Saxon old town with houses whose roof windows look like eyes.' },
      { q: 'Cârțișoara, Romania', name: 'Cârțișoara', wiki: 'Cârțișoara', text: 'The foot of the Transfăgărășan\'s north side.' },
      { q: 'Bâlea Lac', name: 'Bâlea Lake', wiki: 'Transfăgărășan', text: 'The famous ladder of hairpins to a glacial lake at 2,034 m, then a tunnel through the ridge.', source: REPORT('Calimoto: Romania', 'https://calimoto.com/en/blog/article/motorcycle-tours-romania') },
      { q: 'Poienari Castle', name: 'Poienari Castle', wiki: 'Poenari Castle', text: 'Past the Vidraru dam to the ruin of Vlad the Impaler\'s fortress, 1,480 steps up.' },
      { q: 'Curtea de Argeș, Romania', name: 'Curtea de Argeș', wiki: 'Curtea de Argeș Cathedral', text: 'A carved white monastery church, resting place of Romania\'s kings.' },
      { q: 'Horezu, Romania', name: 'Horezu', wiki: 'Horezu Monastery', text: 'A UNESCO monastery and potters\' workshops.' },
      { q: 'Rânca, Romania', name: 'Rânca', wiki: 'Rânca', text: 'Up from Novaci onto the Transalpina.' },
      { q: 'Obârșia Lotrului', name: 'Transalpina', wiki: 'Transalpina', text: 'Romania\'s highest road along the ridge at 2,145 m, sheep and shepherds\' dogs on it.', source: REPORT('Horizons Unlimited thread (2025)', 'https://www.horizonsunlimited.com/hubb/europe/romania-solo-motorcycle-trip-sept-106165-print') },
      { q: 'Sebeș, Romania', name: 'Sebeș', wiki: 'Sebeș', text: 'Down the Sebeș valley past the Oașa lake.' },
      { q: 'Sibiu, Romania', name: 'Back in Sibiu', wiki: 'Sibiu', text: 'Back to the old town for the night.' },
    ],
  },
  {
    id: 'georgia-caucasus',
    title: 'Georgia: Kazbegi and Svaneti',
    who: 'Classic route · the Greater Caucasus by motorcycle',
    when: 'June to September',
    vehicle: 'Adventure motorcycle, 10–14 days',
    kind: 'moto',
    color: '#b45309',
    summary: 'From Tbilisi up the old Georgian Military Highway to Gergeti church under Mount Kazbek, then west to Svaneti, a valley of medieval stone towers, and on dirt to Ushguli, one of Europe\'s highest villages, under Shkhara. Wine, feasts and wild driving; afternoon storms in the mountains.',
    sources: [
      REPORT('Travelogue: Georgia, ten days and Ushguli (August 2025)', 'https://mdwdotla.medium.com/travelogue-georgia-3f39363773b3'),
      REPORT('BMW Motorrad: panoramic Caucasus routes', 'https://fuelforlife.bmw-motorrad.com/en/travel/panoramic-caucasus-routes.html'),
    ],
    approximate: 'A common loop; the roads are the router\'s choice.',
    stops: [
      { q: 'Tbilisi, Georgia', name: 'Tbilisi', wiki: 'Tbilisi', text: 'Sulphur baths, balconies and the old town under Narikala fortress.' },
      { q: 'Ananuri, Georgia', name: 'Ananuri', wiki: 'Ananuri', text: 'A fortress church above a turquoise reservoir.' },
      { q: 'Stepantsminda, Georgia', name: 'Kazbegi', wiki: 'Gergeti Trinity Church', text: 'Over the Jvari pass to Gergeti Trinity church under the glaciers of Kazbek.' },
      { q: 'Mtskheta, Georgia', name: 'Mtskheta', wiki: 'Mtskheta', text: 'Back down to Georgia\'s ancient capital and its cathedral.' },
      { q: 'Kutaisi, Georgia', name: 'Kutaisi', wiki: 'Kutaisi', text: 'West across the country to the old kingdom of Imereti.' },
      { q: 'Zugdidi, Georgia', name: 'Zugdidi', wiki: 'Zugdidi', text: 'The start of the climb into Svaneti, past the Enguri dam.' },
      { q: 'Mestia, Georgia', name: 'Mestia', wiki: 'Mestia', text: 'A town of defensive towers, built against feuds and invaders.' },
      { q: 'Ushguli, Georgia', name: 'Ushguli', at: [42.917, 43.015], wiki: 'Ushguli', text: 'Dirt road to a cluster of tower villages at 2,100 m under Shkhara, Georgia\'s highest peak.', source: REPORT('Travelogue: Georgia (2025)', 'https://mdwdotla.medium.com/travelogue-georgia-3f39363773b3') },
      { q: 'Lentekhi, Georgia', name: 'Lentekhi', wiki: 'Lentekhi', text: 'For the adventurous: the rough Zagari pass south, fords and mud included.' },
      { q: 'Kutaisi, Georgia', name: 'Back to Kutaisi', wiki: 'Bagrati Cathedral', text: 'Back on tarmac towards Tbilisi.' },
    ],
  },
  {
    id: 'utah-mighty-five',
    title: 'Utah\'s Mighty Five',
    who: 'Classic route · five national parks by car',
    when: 'April–May and September–October',
    vehicle: 'Car or camper, 7–12 days',
    kind: 'car',
    color: '#c2410c',
    summary: 'Zion\'s canyon, Bryce\'s hoodoos, Capitol Reef\'s orchards and cliffs, then Arches and Canyonlands around Moab, linked by Scenic Byway 12, one of America\'s great drives. Book Arches timed entry in season and start hikes early.',
    sources: [
      REPORT('Senthil Jayaseelan: Utah Mighty 5, June 2025', 'https://senthiljayaseelan.blogspot.com/2025/07/utah-mighty-5-national-parks-june-2025.html'),
      REPORT('Von\'s SW America road trip: the Mighty 5 (May 2025)', 'https://vonsswamericaroadtrip.blogspot.com/2025/05/utahs-mighty-5-national-parks-they-did.html'),
    ],
    approximate: 'A common route from Las Vegas to Moab.',
    stops: [
      { q: 'Las Vegas, Nevada', name: 'Las Vegas', wiki: 'Las Vegas', text: 'The usual arrival: pick up the car and head north-east.' },
      { q: 'Springdale, Utah', name: 'Zion', wiki: 'Zion National Park', text: 'Angels Landing or the Narrows, walking up the river between canyon walls.' },
      { q: 'Bryce Canyon City, Utah', name: 'Bryce Canyon', wiki: 'Bryce Canyon National Park', text: 'Amphitheatres of orange hoodoos; walk down among them at sunrise.' },
      { q: 'Escalante, Utah', name: 'Escalante', wiki: 'Utah State Route 12', text: 'Scenic Byway 12 over the Hogback, a ridge with drops on both sides.', source: REPORT('Von\'s SW road trip (2025)', 'https://vonsswamericaroadtrip.blogspot.com/2025/05/utahs-mighty-5-national-parks-they-did.html') },
      { q: 'Torrey, Utah', name: 'Capitol Reef', wiki: 'Capitol Reef National Park', text: 'The quiet one: pick fruit in the Fruita orchards under red cliffs.' },
      { q: 'Goblin Valley State Park', name: 'Goblin Valley', wiki: 'Goblin Valley State Park', text: 'A valley of strange mushroom rocks, a fun detour.' },
      { q: 'Moab, Utah', name: 'Moab', wiki: 'Moab, Utah', text: 'The base for the last two parks, and for jeep and bike trails.' },
      { q: 'Arches National Park', name: 'Arches', wiki: 'Arches National Park', text: 'Delicate Arch at sunset, more than 2,000 stone arches in all.', source: REPORT('Senthil Jayaseelan (2025)', 'https://senthiljayaseelan.blogspot.com/2025/07/utah-mighty-5-national-parks-june-2025.html') },
      { q: 'Island in the Sky Visitor Center', name: 'Canyonlands', wiki: 'Canyonlands National Park', text: 'Island in the Sky: Mesa Arch at dawn over canyons cut by the Colorado and Green rivers.' },
    ],
  },
  {
    id: 'torres-del-paine-w',
    title: 'Torres del Paine: the W Trek',
    who: 'Classic route · Patagonia on foot',
    when: 'October to April (refugios open mid-September to mid-April)',
    vehicle: 'On foot, 4–5 days, refugios or campsites',
    kind: 'walk',
    color: '#1e40af',
    summary: 'About 80 km in the shape of a W through Chile\'s most famous park: the granite towers at dawn, the French Valley between hanging glaciers, and the blue icebergs of Grey Glacier. Fierce winds; no wild camping, so book the refugios months ahead.',
    sources: [
      REPORT('Global Summit Guide: W Trek complete guide (January 2025 trip)', 'https://globalsummitguide.com/w-trek-torres-del-paine-complete-guide/'),
      REPORT('RMI Guides: Torres del Paine dispatch (February 2025)', 'https://www.rmiguides.com/blog/expedition/torres_020125/desc'),
    ],
    approximate: 'The usual east-to-west W; the line follows the park\'s trails where they were found.',
    stops: [
      { q: 'Refugio Central, Torres del Paine', name: 'Refugio Central', wiki: 'Torres del Paine National Park', text: 'The east end, by the Hotel Las Torres.' },
      { q: 'Refugio Chileno', name: 'Refugio Chileno', wiki: 'Torres del Paine', text: 'Up the Ascencio valley; sleep here to reach the towers at dawn.', source: REPORT('Global Summit Guide (2025)', 'https://globalsummitguide.com/w-trek-torres-del-paine-complete-guide/') },
      { q: 'Mirador Base Las Torres', name: 'Base of the Towers', wiki: 'Torres del Paine', text: 'A boulder scramble to the lake under the three granite towers, pink at sunrise.' },
      { q: 'Refugio Cuernos', name: 'Los Cuernos', wiki: 'Cuernos del Paine', text: 'Down and west along Lake Nordenskjöld under the black-capped Horns.' },
      { q: 'Mirador Británico', name: 'French Valley', wiki: 'Torres del Paine National Park', text: 'Up the French Valley, avalanches thundering off the glacier, to the Británico lookout.' },
      { q: 'Refugio Paine Grande', name: 'Paine Grande', wiki: 'Lake Pehoé', text: 'By turquoise Lake Pehoé, where the catamaran lands.' },
      { q: 'Refugio Grey', name: 'Refugio Grey', wiki: 'Grey Glacier', text: 'Along the lake of icebergs to the face of Grey Glacier; hanging bridges beyond.', source: REPORT('RMI Guides (2025)', 'https://www.rmiguides.com/blog/expedition/torres_020125/desc') },
      { q: 'Refugio Paine Grande', name: 'Back to Paine Grande', wiki: 'Lake Pehoé', text: 'Back for the catamaran to Pudeto and the bus out.' },
    ],
  },
  // ---- Batch 5: Brazil ----
  {
    id: 'estrada-real',
    title: 'Estrada Real: Caminho Velho',
    who: 'Classic route · Brazil\'s colonial gold road',
    when: 'April to September (dry season)',
    vehicle: 'Motorcycle, bike or on foot, 7–30 days',
    kind: 'moto',
    color: '#ca8a04',
    summary: 'About 710 km from Ouro Preto in Minas Gerais to Paraty on the coast, on the road the Portuguese Crown built to carry gold and diamonds to the sea: baroque towns, cachaça stills, coffee farms and the Serra da Mantiqueira, mostly on dirt, dropping from 1,200 m to sea level. Stamp the Estrada Real passport on the way.',
    sources: [
      REPORT('Bikepacking.com: bikepacking the Estrada Real', 'https://bikepacking.com/?p=203374'),
      REPORT('360meridianos: Estrada Real, os caminhos do Brasil Colônia', 'https://www.360meridianos.com/estrada-real/'),
    ],
    approximate: 'Main towns of the Caminho Velho; the line follows today\'s roads, much of the real route is dirt.',
    stops: [
      { q: 'Ouro Preto, Minas Gerais', name: 'Ouro Preto', wiki: 'Ouro Preto', text: 'The old gold capital of Minas, all baroque churches and steep cobbles: the start.' },
      { q: 'Ouro Branco, Minas Gerais', name: 'Ouro Branco', wiki: 'Ouro Branco', text: 'South over the Serra do Ouro Branco.' },
      { q: 'São João del-Rei, Minas Gerais', name: 'São João del-Rei', wiki: 'São João del-Rei', text: 'A colonial town of church bells and a steam railway.' },
      { q: 'Tiradentes, Minas Gerais', name: 'Tiradentes', wiki: 'Tiradentes, Minas Gerais', text: 'One of Brazil\'s best-preserved colonial towns, under the Serra de São José.', source: REPORT('360meridianos', 'https://www.360meridianos.com/estrada-real/') },
      { q: 'Carrancas, Minas Gerais', name: 'Carrancas', wiki: 'Carrancas', text: 'Waterfalls and dirt roads through the hills.' },
      { q: 'Baependi, Minas Gerais', name: 'Baependi', wiki: 'Baependi', text: 'Into the Serra da Mantiqueira.' },
      { q: 'Passa Quatro, Minas Gerais', name: 'Passa Quatro', wiki: 'Passa Quatro', text: 'A mountain town, then over the Mantiqueira into São Paulo state.' },
      { q: 'Cunha, São Paulo', name: 'Cunha', wiki: 'Cunha', text: 'Potters\' kilns and the high valleys above the coast.' },
      { q: 'Paraty, Rio de Janeiro', name: 'Paraty', wiki: 'Paraty', text: 'A steep, slippery descent to the colonial port where the gold was shipped out.', source: REPORT('Bikepacking.com (into Paraty)', 'https://bikepacking.com/?p=203374') },
    ],
  },
  {
    id: 'caminho-da-fe',
    title: 'Caminho da Fé',
    who: 'Classic route · Brazil\'s pilgrimage to Aparecida, 34,000 pilgrims in 2025',
    when: 'April to September (dry, cool)',
    vehicle: 'On foot (or bike), about 12 days',
    kind: 'walk',
    color: '#1e3a8a',
    summary: 'Brazil\'s answer to the Camino de Santiago: 318 km on the main branch from Águas da Prata to the Basilica of Our Lady of Aparecida, through the coffee farms and mountains of southern Minas Gerais and the Serra da Mantiqueira. Pousadas for pilgrims, a credential to stamp, and steep climbs.',
    sources: [
      REPORT('Gazeta SP: Caminho da Fé, 318 km and the Serra da Mantiqueira', 'https://www.gazetasp.com.br/turismo/caminho-da-fe-rota-de-318-km-ate-aparecida-exige-atencao-aos-desafios-da-serra-da-mantiqueira/'),
      REPORT('Associação dos Amigos do Caminho da Fé', 'https://caminhodafe.com.br/ptbr/'),
    ],
    approximate: 'Main towns of the classic branch; the path follows dirt roads and trails near the line shown.',
    stops: [
      { q: 'Águas da Prata, São Paulo', name: 'Águas da Prata', wiki: 'Águas da Prata', text: 'A spa town and the start of the main branch, credential in hand.' },
      { q: 'Andradas, Minas Gerais', name: 'Andradas', wiki: 'Andradas', text: 'Into Minas Gerais, wine and coffee country.' },
      { q: 'Ouro Fino, Minas Gerais', name: 'Ouro Fino', wiki: 'Ouro Fino', text: 'Hill farms and the first long climbs.' },
      { q: 'Borda da Mata, Minas Gerais', name: 'Borda da Mata', wiki: 'Borda da Mata', text: 'A town of pyjama makers on the pilgrims\' road.' },
      { q: 'Paraisópolis, Minas Gerais', name: 'Paraisópolis', wiki: 'Paraisópolis', text: 'Towards the Mantiqueira.' },
      { q: 'Luminosa, Brazópolis', name: 'Luminosa', wiki: 'Serra da Mantiqueira', text: 'The hardest days: up and over the Serra da Mantiqueira.', source: REPORT('Gazeta SP: the Mantiqueira', 'https://www.gazetasp.com.br/turismo/caminho-da-fe-rota-de-318-km-ate-aparecida-exige-atencao-aos-desafios-da-serra-da-mantiqueira/') },
      { q: 'Campos do Jordão, São Paulo', name: 'Campos do Jordão', wiki: 'Campos do Jordão', text: 'A mountain town at 1,600 m, cool and Alpine-looking.' },
      { q: 'Pindamonhangaba, São Paulo', name: 'Pindamonhangaba', wiki: 'Pindamonhangaba', text: 'Down into the Paraíba valley.' },
      { q: 'Basílica de Aparecida', name: 'Aparecida', wiki: 'Basilica of the National Shrine of Our Lady of Aparecida', text: 'The huge basilica of Brazil\'s patron saint, the end of the way.' },
    ],
  },
  {
    id: 'rota-das-emocoes',
    title: 'Rota das Emoções',
    who: 'Classic route · north-east Brazil\'s dunes and delta, 20 years old in 2025',
    when: 'June to September (lagoons full until about August)',
    vehicle: '4x4 or transfers, 7–10 days',
    kind: '4x4',
    color: '#0891b2',
    summary: 'About 500 km of coast across three states, from the white dunes and rain-filled lagoons of the Lençóis Maranhenses, through the mangroves and scarlet ibis of the Parnaíba Delta, to the beach village of Jericoacoara. Sand tracks, river ferries, kitesurfing and hammocks.',
    sources: [
      REPORT('Viaje na Viagem: Rota das Emoções', 'https://www.viajenaviagem.com/destino/rota-das-emocoes/'),
      REPORT('Viagens e Caminhos: roteiro e dicas', 'https://www.viagensecaminhos.com/rota-das-emocoes/'),
    ],
    approximate: 'Main stops; much of the coast is driven on sand, not the roads shown.',
    stops: [
      { q: 'São Luís, Maranhão', name: 'São Luís', wiki: 'São Luís, Maranhão', text: 'A colonial island city of tiled façades, where most trips start.' },
      { q: 'Barreirinhas, Maranhão', name: 'Barreirinhas', wiki: 'Lençóis Maranhenses National Park', text: 'Gateway to the Lençóis Maranhenses: white dunes and blue rainwater lagoons.', source: REPORT('Viaje na Viagem', 'https://www.viajenaviagem.com/destino/rota-das-emocoes/') },
      { q: 'Atins, Maranhão', name: 'Atins', wiki: 'Preguiças River', text: 'Down the Preguiças river to a kitesurf village at the edge of the dunes.' },
      { q: 'Tutóia, Maranhão', name: 'Tutóia', wiki: 'Tutóia', text: 'Sand tracks along the coast to the "little Lençóis".' },
      { q: 'Parnaíba, Piauí', name: 'Parnaíba Delta', wiki: 'Parnaíba River', text: 'A boat through the delta\'s mangroves at dusk, when the scarlet ibis fly home.' },
      { q: 'Camocim, Ceará', name: 'Camocim', wiki: 'Camocim', text: 'Into Ceará on beaches and river crossings.' },
      { q: 'Jericoacoara, Ceará', name: 'Jericoacoara', wiki: 'Jericoacoara', text: 'Sunset from the big dune, a stone arch at Pedra Furada, and sandy streets.', source: REPORT('Viagens e Caminhos', 'https://www.viagensecaminhos.com/rota-das-emocoes/') },
    ],
  },
  {
    id: 'jalapao',
    title: 'Jalapão',
    who: 'Classic route · the Cerrado\'s desert by 4x4',
    when: 'May to October',
    vehicle: '4x4 (or guided), 4–7 days',
    kind: '4x4',
    color: '#ea580c',
    summary: 'A loop from Palmas into the empty heart of Tocantins: orange dunes under a table mountain, spring-fed "fervedouros" where the water pushes you up so you can\'t sink, waterfalls, golden-grass crafts in quilombola villages. Over 165 km of sand and stone with no phone signal; carry fuel and spares.',
    sources: [
      REPORT('Mala de Aventuras: roteiro Jalapão em 4, 5 ou 7 dias', 'https://maladeaventuras.com/roteiro-jalapao'),
      REPORT('Melhores Destinos: como se locomover no Jalapão', 'https://guia.melhoresdestinos.com.br/como-se-locomover-no-jalapao.html'),
    ],
    approximate: 'The usual circuit; the tracks are sand and the line is a guide only.',
    stops: [
      { q: 'Palmas, Tocantins', name: 'Palmas', wiki: 'Palmas, Tocantins', text: 'Brazil\'s newest state capital, last big shop and fuel.' },
      { q: 'Ponte Alta do Tocantins', name: 'Ponte Alta', wiki: 'Ponte Alta do Tocantins', text: 'The "gateway of Jalapão": Lagoa do Japonês and the Pedra Furada arch.' },
      { q: 'Mateiros, Tocantins', name: 'Mateiros', wiki: 'Mateiros', text: 'The hardest stretch, sand and stones over the Serra da Muriçoca, to the central village.', source: REPORT('Mala de Aventuras', 'https://maladeaventuras.com/roteiro-jalapao') },
      { q: 'Dunas do Jalapão', name: 'The dunes', at: [-10.4467, -46.6603], route: 'line', wiki: 'Jalapão State Park', text: 'Orange dunes at the foot of the Serra do Espírito Santo, best at sunset.' },
      { q: 'São Félix do Tocantins', name: 'São Félix', wiki: 'São Félix do Tocantins', text: 'The Buritizinho and Bela Vista fervedouros: floating in a spring.' },
      { q: 'Palmas, Tocantins', name: 'Back to Palmas', wiki: 'Tocantins', text: 'Back to tarmac and the city.' },
    ],
  },
  {
    id: 'transpantaneira',
    title: 'Transpantaneira',
    who: 'Classic route · the Pantanal\'s wildlife road',
    when: 'July to October for jaguars (dry season)',
    vehicle: 'Car or 4x4, 3–5 days with boat trips',
    kind: 'car',
    color: '#15803d',
    summary: 'The MT-060: about 145 km of dirt road and over a hundred wooden bridges from Poconé into the world\'s largest wetland, with caimans, capybaras, hyacinth macaws and jabirus all along it. At Porto Jofre the road ends; boats go up the rivers to look for jaguars. No fuel on the way.',
    sources: [
      REPORT('Lorenzo Expeditions: from Poconé to Porto Jofre, the jaguar trail', 'https://www.lorenzoexpeditions.com/from-pocone-to-porto-jofre-the-jaguar-trail'),
      REPORT('Seguro Viagem: guia da Transpantaneira', 'https://www.seguroviagem.srv.br/blog/viagem-estrada-transpantaneira/'),
    ],
    approximate: 'The road and its main lodges; distances along the dirt road are approximate.',
    stops: [
      { q: 'Cuiabá, Mato Grosso', name: 'Cuiabá', wiki: 'Cuiabá', text: 'The hot capital of Mato Grosso; bring cash, there are no ATMs further on.' },
      { q: 'Poconé, Mato Grosso', name: 'Poconé', wiki: 'Poconé', text: 'The gateway: the Transpantaneira starts at the arch south of town.' },
      { q: 'Pixaim, Poconé', name: 'Pixaim', at: [-16.7667, -56.85], route: 'line', wiki: 'Pantanal', text: 'Lodges by the Pixaim river, giant otters and birds by the hundred.' },
      { q: 'Porto Jofre, Mato Grosso', name: 'Porto Jofre', at: [-17.3622, -56.7731], route: 'line', wiki: 'Encontro das Águas State Park', text: 'The end of the road: boats into the Encontro das Águas park, famous for jaguars. Fires hit it in September 2025.', source: REPORT('Lorenzo Expeditions', 'https://www.lorenzoexpeditions.com/from-pocone-to-porto-jofre-the-jaguar-trail') },
    ],
  },
  {
    id: 'serra-catarinense',
    title: 'Serra do Rio do Rastro and the Serra Catarinense',
    who: 'Classic route · southern Brazil\'s mountain roads by motorcycle',
    when: 'All year (snow is possible in winter, June–August)',
    vehicle: 'Motorcycle, 3–5 days',
    kind: 'moto',
    color: '#4338ca',
    summary: 'Santa Catarina\'s mountain loop: 284 curves in 24 km up the Serra do Rio do Rastro, the cold highlands of São Joaquim and Urubici with frost and vineyards, the rock cut of the Serra do Corvo Branco, and canyons at the edge of the Serra Geral. Check the Corvo Branco\'s state before going.',
    sources: [
      REPORT('Motonline: Serra do Rio do Rastro, a place every rider must know', 'https://www.motonline.com.br/noticia/serra-do-rio-do-rastro-lugar-que-todo-motociclista-deve-conhecer/'),
      REPORT('Viagens e Caminhos: Serra do Rio do Rastro', 'https://www.viagensecaminhos.com/serra-do-rio-do-rastro-sc/'),
    ],
    approximate: 'A common loop from the coast.',
    stops: [
      { q: 'Florianópolis, Santa Catarina', name: 'Florianópolis', wiki: 'Florianópolis', text: 'Island capital and start, south along the BR-101.' },
      { q: 'Lauro Müller, Santa Catarina', name: 'Lauro Müller', wiki: 'Lauro Müller', text: 'The foot of the serra.' },
      { q: 'Bom Jardim da Serra, Santa Catarina', name: 'Serra do Rio do Rastro', wiki: 'Serra do Rio do Rastro', text: 'The SC-390\'s 284 hairpins up to the viewpoint at about 1,400 m, often in cloud.', source: REPORT('Motonline', 'https://www.motonline.com.br/noticia/serra-do-rio-do-rastro-lugar-que-todo-motociclista-deve-conhecer/') },
      { q: 'São Joaquim, Santa Catarina', name: 'São Joaquim', wiki: 'São Joaquim, Santa Catarina', text: 'Brazil\'s coldest town, apples and high-altitude wines.' },
      { q: 'Urubici, Santa Catarina', name: 'Urubici', wiki: 'Urubici', text: 'Morro da Igreja and its rock window, and the best base in the serra.' },
      { q: 'Serra do Corvo Branco', name: 'Serra do Corvo Branco', at: [-28.0539, -49.3628], wiki: 'Grão-Pará, Santa Catarina', text: 'A road through a 90 m rock cut, steep and tight; part of it was closed for paving works.' },
      { q: 'Grão-Pará, Santa Catarina', name: 'Grão-Pará', wiki: 'Grão-Pará, Santa Catarina', text: 'Down to the plains and back to the coast.' },
    ],
  },
  {
    id: 'vale-do-pati',
    title: 'Vale do Pati, Chapada Diamantina',
    who: 'Classic route · one of Brazil\'s great treks',
    when: 'April to October',
    vehicle: 'On foot, 3–5 days, homestays',
    kind: 'walk',
    color: '#166534',
    summary: 'A trek into a deep green valley in the Chapada Diamantina\'s table mountains, where a few families still live and host walkers in their houses: waterfalls, cliff-top views from the Mirante do Pati and the Morro do Castelo, rivers to swim in. Often crossed from Guiné to Andaraí; a local guide is strongly advised.',
    sources: [
      REPORT('360meridianos: Vale do Pati travessia', 'https://www.360meridianos.com/vale-do-pati-travessia/'),
      REPORT('Mala de Aventuras: trilha Vale do Pati', 'https://maladeaventuras.com/tudo-que-voce-precisa-saber-para-planejar-seu-trekking-pelo-vale-do-pati/'),
    ],
    approximate: 'The usual 3–4 day crossing; the line follows trails where they were found.',
    stops: [
      { q: 'Guiné, Mucugê', name: 'Guiné', wiki: 'Mucugê', text: 'Up the Aleixos trail from Guiné onto the Gerais plateau.' },
      { q: 'Mirante do Pati', name: 'Mirante do Pati', at: [-12.8333, -41.4], route: 'line', wiki: 'Chapada Diamantina National Park', text: 'The view down into the valley.' },
      { q: 'Igrejinha, Vale do Pati', name: 'Igrejinha', at: [-12.8, -41.43], route: 'line', wiki: 'Chapada Diamantina', text: 'A night with a valley family; day trips to the Cachoeirão waterfalls and the Morro do Castelo.', source: REPORT('360meridianos', 'https://www.360meridianos.com/vale-do-pati-travessia/') },
      { q: 'Andaraí, Bahia', name: 'Andaraí', wiki: 'Andaraí', text: 'Out by the old diamond miners\' path down the Ladeira do Império.' },
    ],
  },
  {
    id: 'transamazonica',
    title: 'Transamazônica (BR-230)',
    who: 'Classic route · across the Amazon by motorcycle',
    when: 'June to October (dry season); in the rains it turns to mud',
    vehicle: 'Adventure motorcycle or 4x4, 2–3 weeks',
    kind: 'moto',
    color: '#9a3412',
    summary: 'The 1970s highway pushed across the Amazon: from the Tocantins at Marabá west past Altamira and the Xingu, Itaituba on the Tapajós, to Humaitá on the Madeira. Long stretches are still dirt, with dust, potholes, mud and wooden bridges; one 2025 couple called it harder than the Andes.',
    sources: [
      REPORT('Portal Amazônia: Amapá couple crosses South America by motorcycle (2025)', 'https://portalamazonia.com/turismo/andes-casal-ap-cruza-america-sul/'),
      REPORT('Horizons Unlimited: BR-230, Humaitá and the BR-163', 'https://horizonsunlimited.com/hubb/south-america/br-230-humaita-br-163-a-72836'),
    ],
    approximate: 'Main towns; the line follows today\'s roads, conditions change with every rainy season.',
    stops: [
      { q: 'Marabá, Pará', name: 'Marabá', wiki: 'Marabá', text: 'Where the Transamazônica crosses the Tocantins, the start west.' },
      { q: 'Novo Repartimento, Pará', name: 'Novo Repartimento', wiki: 'Novo Repartimento', text: 'Past the Tucuruí reservoir.' },
      { q: 'Altamira, Pará', name: 'Altamira', wiki: 'Altamira', text: 'The Xingu river and the controversial Belo Monte dam.' },
      { q: 'Rurópolis, Pará', name: 'Rurópolis', wiki: 'Rurópolis', text: 'Where the BR-230 meets the BR-163.' },
      { q: 'Itaituba, Pará', name: 'Itaituba', wiki: 'Itaituba', text: 'On the wide Tapajós; the hardest dirt starts here.' },
      { q: 'Jacareacanga, Pará', name: 'Jacareacanga', wiki: 'Jacareacanga', text: 'Deep in the forest on the upper Tapajós.', source: REPORT('Portal Amazônia (2025)', 'https://portalamazonia.com/turismo/andes-casal-ap-cruza-america-sul/') },
      { q: 'Apuí, Amazonas', name: 'Apuí', wiki: 'Apuí', text: 'Into Amazonas state, cattle frontier and forest.' },
      { q: 'Humaitá, Amazonas', name: 'Humaitá', wiki: 'Humaitá, Amazonas', text: 'The Madeira river: tarmac again on the BR-319 or BR-230 west.' },
    ],
  },
  // ---- Batch 5: South America ----
  {
    id: 'salkantay-trek',
    title: 'Salkantay Trek to Machu Picchu',
    who: 'Classic route · the Inca Trail\'s wilder alternative',
    when: 'April to October (dry season)',
    vehicle: 'On foot, 4–5 days, camps and lodges',
    kind: 'walk',
    color: '#0f766e',
    summary: 'From the glacier lake of Humantay over the 4,630 m Salkantay pass, under one of the Andes\' holy mountains, then down through cloud forest and coffee farms to Machu Picchu: from snow to jungle in two days. No permits needed, unlike the classic Inca Trail.',
    sources: [
      REPORT('Matador Network: the Salkantay trek (July 2025)', 'https://matadornetwork.com/read/salkantay-trek-peru/'),
      REPORT('Salkantay Trekking: Salkantay to Machu Picchu, 5 days', 'https://www.salkantaytrekking.com/trekking-in-peru/cusco/salkantay-explorer-machu-picchu-5d'),
    ],
    approximate: 'The usual camps; the line follows trails where they were found.',
    stops: [
      { q: 'Mollepata, Cusco', name: 'Mollepata', wiki: 'Mollepata District', text: 'An early drive from Cusco to the trailhead village.' },
      { q: 'Soraypampa', name: 'Soraypampa', at: [-13.3833, -72.5833], route: 'line', wiki: 'Humantay Lake', text: 'Camp under the mountain; an afternoon hike to turquoise Humantay lake.' },
      { q: 'Abra Salkantay', name: 'Salkantay Pass', at: [-13.3500, -72.5586], route: 'line', wiki: 'Salkantay', text: 'The pass at 4,630 m, the hardest climb, the ice face of Salkantay above.', source: REPORT('Matador Network (2025)', 'https://matadornetwork.com/read/salkantay-trek-peru/') },
      { q: 'Chaullay, Santa Teresa', name: 'Chaullay', at: [-13.2167, -72.5333], route: 'line', wiki: 'Santa Teresa District, La Convención', text: 'Down 2,000 m into the cloud forest.' },
      { q: 'Lucmabamba', name: 'Lucmabamba', at: [-13.1667, -72.5667], route: 'line', wiki: 'Llactapata', text: 'Coffee farms, and the Inca site of Llactapata with a first glimpse of Machu Picchu.' },
      { q: 'Aguas Calientes, Peru', name: 'Aguas Calientes', wiki: 'Aguas Calientes, Peru', text: 'Along the railway to the town below the ruins.' },
      { q: 'Machu Picchu', name: 'Machu Picchu', wiki: 'Machu Picchu', text: 'The Inca citadel at dawn.' },
    ],
  },
  {
    id: 'huayhuash-circuit',
    title: 'Cordillera Huayhuash Circuit',
    who: 'Classic route · one of the world\'s great treks, Peru',
    when: 'May to September (driest July–August)',
    vehicle: 'On foot with burros, 8–12 days, camping',
    kind: 'walk',
    color: '#1e40af',
    summary: 'A loop round a compact range of ice peaks including Yerupajá and Siula Grande, of "Touching the Void" fame: passes up to 5,000 m almost every day, glacier lakes, hot springs and herders\' villages. Wild, high and remote; community fees are paid on the way.',
    sources: [
      REPORT('Trail Hiking Australia: hiking the Huayhuash Circuit (June 2025)', 'https://www.trailhiking.com.au/trip-reports/hiking-the-huayhuash-circuit-in-peru/'),
      REPORT('The Mountaineers: trek Peru\'s Cordillera Huayhuash (2025)', 'https://www.mountaineers.org/activities/trip-reports/global-adventure-trek-perus-cordillera-huayhuash'),
    ],
    approximate: 'The usual camps; the line is a rough guide on high trails.',
    stops: [
      { q: 'Llamac, Peru', name: 'Llamac', wiki: 'Cordillera Huayhuash', text: 'The trailhead village, after a long drive from Huaraz.' },
      { q: 'Carhuacocha', name: 'Carhuacocha', at: [-10.2522, -76.8814], route: 'line', wiki: 'Yerupajá', text: 'The famous camp by the lake, Yerupajá and Jirishanca reflected at dawn.', source: REPORT('Trail Hiking Australia (2025)', 'https://www.trailhiking.com.au/trip-reports/hiking-the-huayhuash-circuit-in-peru/') },
      { q: 'Siula Pass', name: 'Siula Pass', at: [-10.2803, -76.8681], route: 'line', wiki: 'Siula Grande', text: 'Past three glacier lakes to a 4,800 m pass under Siula Grande.' },
      { q: 'Huayhuash camp', name: 'Huayhuash camp', at: [-10.3, -76.85], route: 'line', wiki: 'Cordillera Huayhuash', text: 'A high meadow camp at about 4,350 m.' },
      { q: 'Viconga hot springs', name: 'Viconga', at: [-10.36, -76.83], route: 'line', wiki: 'Cordillera Huayhuash', text: 'Hot springs for tired legs.' },
      { q: 'Huayllapa, Peru', name: 'Huayllapa', at: [-10.3667, -76.9167], route: 'line', wiki: 'Lauricocha Province', text: 'The only real village on the circuit; a place to cut it short.' },
      { q: 'Llamac, Peru', name: 'Back to Llamac', route: 'line', wiki: 'Jirishanca', text: 'Over the last passes and down to Llamac.' },
    ],
  },
  {
    id: 'quilotoa-loop',
    title: 'Quilotoa Loop',
    who: 'Classic route · Ecuador\'s Andean village trek',
    when: 'June to September (drier)',
    vehicle: 'On foot, 3–4 days, hostels',
    kind: 'walk',
    color: '#059669',
    summary: 'A walk between Andean villages from Sigchos to the crater lake of Quilotoa, through canyons, farmland and indigenous Kichwa communities, sleeping in friendly hostels with dinner included. Saving the green crater lake for the end is the classic way.',
    sources: [
      REPORT('Novo-Monde: Quilotoa Loop in 3 or 4 days', 'https://www.novo-monde.com/en/ecuador-quilotoa-loop-trekking/'),
      REPORT('Goats on the Road: hiking the Quilotoa Loop', 'https://goatsontheroad.com/quilotoa-loop'),
    ],
    approximate: 'The usual stages; the trail changes after landslides, so ask locally.',
    stops: [
      { q: 'Latacunga, Ecuador', name: 'Latacunga', wiki: 'Latacunga', text: 'Bags stored, a bus up into the hills.' },
      { q: 'Sigchos, Ecuador', name: 'Sigchos', by: 'bus', wiki: 'Sigchos Canton', text: 'The start, about 2,850 m.' },
      { q: 'Isinliví, Ecuador', name: 'Isinliví', wiki: 'Cotopaxi Province', text: 'Down a canyon and up to a hillside village, about 10 km.', source: REPORT('Novo-Monde', 'https://www.novo-monde.com/en/ecuador-quilotoa-loop-trekking/') },
      { q: 'Chugchilán, Ecuador', name: 'Chugchilán', wiki: 'Chugchilán', text: 'Across the Toachi canyon to a village of cheese makers.' },
      { q: 'Quilotoa, Ecuador', name: 'Quilotoa', wiki: 'Quilotoa', text: 'A long climb to the rim of the crater and its green lake at 3,800 m.' },
    ],
  },
  {
    id: 'ruta-40-argentina',
    title: 'Ruta 40, Argentina',
    who: 'Classic route · Argentina\'s spine by motorcycle',
    when: 'November to March (southern summer)',
    vehicle: 'Adventure motorcycle, 3–5 weeks',
    kind: 'moto',
    color: '#0284c7',
    summary: 'About 5,000 km along the Andes, from the glaciers of Santa Cruz to the high desert of the north-west: Perito Moreno, Fitz Roy, Patagonian wind on endless steppe, the lakes of Bariloche, the wine of Mendoza and Cafayate, and the coloured gorges near Salta. Mostly paved now, with wild gravel stretches left.',
    sources: [
      REPORT('La Gaceta: a Tucumán couple rides to Ushuaia (February 2025)', 'https://www.lagaceta.com.ar/nota/1070396/sociedad/pareja-tucumana-fue-ushuaia-moto-da-detalles-viaje-paisajes-ensueno'),
      REPORT('Argentina.travel: Ruta 40, an unforgettable journey', 'https://www.argentina.travel/novedades/la-ruta-40-un-viaje-inolvidable-por-el-corazon-de-argentina'),
    ],
    approximate: 'Main towns from south to north.',
    stops: [
      { q: 'El Calafate, Argentina', name: 'El Calafate', wiki: 'Perito Moreno Glacier', text: 'The Perito Moreno glacier calving into Lago Argentino.' },
      { q: 'El Chaltén, Argentina', name: 'El Chaltén', wiki: 'Mount Fitz Roy', text: 'The trekking village under Fitz Roy.', source: REPORT('La Gaceta (2025)', 'https://www.lagaceta.com.ar/nota/1070396/sociedad/pareja-tucumana-fue-ushuaia-moto-da-detalles-viaje-paisajes-ensueno') },
      { q: 'Perito Moreno, Santa Cruz', name: 'Perito Moreno town', wiki: 'Cueva de las Manos', text: 'Empty steppe and wind; the Cueva de las Manos rock art nearby.' },
      { q: 'Esquel, Argentina', name: 'Esquel', wiki: 'Esquel', text: 'Back to the mountains and Los Alerces park.' },
      { q: 'San Carlos de Bariloche', name: 'Bariloche', wiki: 'San Carlos de Bariloche', text: 'Lakes, chocolate, and the Seven Lakes road north.' },
      { q: 'Malargüe, Argentina', name: 'Malargüe', wiki: 'Malargüe', text: 'Volcanic desert and lava fields of La Payunia.' },
      { q: 'Mendoza, Argentina', name: 'Mendoza', wiki: 'Mendoza, Argentina', text: 'Malbec country under Aconcagua.' },
      { q: 'Chilecito, Argentina', name: 'Chilecito', wiki: 'Cuesta de Miranda', text: 'The red Cuesta de Miranda pass.' },
      { q: 'Cafayate, Argentina', name: 'Cafayate', wiki: 'Quebrada de las Conchas', text: 'High vineyards and the Quebrada de las Conchas gorge.' },
      { q: 'Salta, Argentina', name: 'Salta', wiki: 'Salta', text: 'The colonial north-west, gateway to the Quebrada de Humahuaca.' },
    ],
  },
  {
    id: 'colombia-andes-moto',
    title: 'Colombia: coffee country to the Trampolín de la Muerte',
    who: 'Classic route · the Colombian Andes by motorcycle',
    when: 'December–March and June–August (drier)',
    vehicle: 'Motorcycle, 10–14 days',
    kind: 'moto',
    color: '#d97706',
    summary: 'From Medellín south through colonial villages and the green hills of the coffee region, past Salento and the giant wax palms of the Cocora valley, down the Cauca valley to San Agustín\'s stone statues, and the famous dirt road of the Trampolín de la Muerte to Mocoa at the edge of the Amazon.',
    sources: [
      REPORT('Upshift: the Colombia experience, part 2', 'https://upshiftonline.com/blogs/content/the-colombia-experience-part-2'),
      REPORT('JB\'s Trails: riding Colombian jungle roads', 'https://jbstrails.com/?p=9121'),
    ],
    approximate: 'A common route; the roads are the router\'s choice.',
    stops: [
      { q: 'Medellín, Colombia', name: 'Medellín', wiki: 'Medellín', text: 'The city of eternal spring.' },
      { q: 'Jardín, Antioquia', name: 'Jardín', wiki: 'Jardín, Antioquia', text: 'A colourful coffee village with a big church on the square.' },
      { q: 'Manizales, Colombia', name: 'Manizales', wiki: 'Manizales', text: 'A ridge-top city under the Nevado del Ruiz volcano.' },
      { q: 'Salento, Quindío', name: 'Salento', wiki: 'Cocora Valley', text: 'Willys jeeps to the Cocora valley\'s 50 m wax palms.', source: REPORT('Upshift', 'https://upshiftonline.com/blogs/content/the-colombia-experience-part-2') },
      { q: 'Popayán, Colombia', name: 'Popayán', wiki: 'Popayán', text: 'The "white city" of colonial churches.' },
      { q: 'San Agustín, Huila', name: 'San Agustín', wiki: 'San Agustín Archaeological Park', text: 'Hundreds of ancient stone statues in the hills.' },
      { q: 'Mocoa, Putumayo', name: 'Mocoa', wiki: 'Mocoa', text: 'By the Trampolín de la Muerte: a narrow dirt road over the Andes to the Amazon basin.', source: REPORT('JB\'s Trails', 'https://jbstrails.com/?p=9121') },
    ],
  },
  {
    id: 'death-road-bolivia',
    title: 'The Death Road, Bolivia',
    who: 'Classic route · the North Yungas road by mountain bike',
    when: 'May to October (dry season)',
    vehicle: 'Mountain bike, one day, with an operator',
    kind: 'bike',
    color: '#78350f',
    summary: 'The old road from La Paz down to Coroico, once called the world\'s most dangerous: a single dirt lane cut into cliffs, dropping from about 4,700 m at La Cumbre to the warm Yungas valleys. Traffic moved to a new road, and riders now come in their thousands. Cold at the top, hot at the bottom.',
    sources: [
      REPORT('Bolivian Life: Death Road bike, 2025 guide from La Paz', 'https://www.bolivianlife.com/death-road-cycle-all-you-need-to-know/'),
      REPORT('A Globe Well Travelled: biking down Death Road (February 2025)', 'https://aglobewelltravelled.com/2025/02/21/bike-down-death-road-bolivia/'),
    ],
    approximate: 'Start, middle and finish of the ride.',
    stops: [
      { q: 'La Paz, Bolivia', name: 'La Paz', wiki: 'La Paz', text: 'An early pick-up; acclimatise in La Paz first.' },
      { q: 'La Cumbre, Bolivia', name: 'La Cumbre', at: [-16.3606, -68.0408], route: 'car', wiki: 'Yungas Road', text: 'Bikes off the roof at about 4,700 m, often below freezing.', source: REPORT('Bolivian Life (2025)', 'https://www.bolivianlife.com/death-road-cycle-all-you-need-to-know/') },
      { q: 'Unduavi, Bolivia', name: 'Unduavi', at: [-16.3083, -67.8956], wiki: 'Yungas Road', text: 'The toll point, then onto the old dirt road.' },
      { q: 'Yolosa, Bolivia', name: 'Yolosa', at: [-16.2236, -67.7458], wiki: 'Yungas Road', text: 'Down past waterfalls and cliff edges to the jungle at about 1,200 m.', source: REPORT('A Globe Well Travelled (2025)', 'https://aglobewelltravelled.com/2025/02/21/bike-down-death-road-bolivia/') },
      { q: 'Coroico, Bolivia', name: 'Coroico', wiki: 'Coroico', text: 'A hill town of the Yungas, a cold drink and a swim.' },
    ],
  },
  // ---- Batch 5: elsewhere ----
  {
    id: 'pacific-coast-bike',
    title: 'Pacific Coast by bike: Seattle to San Diego',
    who: 'Classic route · America\'s favourite bike tour',
    when: 'Late spring to early autumn (ride southbound with the wind)',
    vehicle: 'Touring bike, 4–8 weeks, hiker-biker campsites',
    kind: 'bike',
    color: '#0369a1',
    summary: 'About 3,000 km down the coast of Washington, Oregon and California: Olympic forests, Oregon\'s sea stacks and cheap hiker-biker campsites, redwoods, the Golden Gate, Big Sur\'s cliffs and the beach towns of the south. Almost all paved; watch the narrow tunnels and bridges.',
    sources: [
      REPORT('Edinburgh Bicycle: bike the Pacific Coast Highway, part 4', 'https://www.edinburghbicycle.com/info/blog/bike-pacific-coast-highway-us-part-4-4'),
      REPORT('Adventure Cycling: Pacific Coast Bicycle Route', 'https://www.adventurecycling.org/routes-and-maps/adventure-cycling-route-network/pacific-coast/'),
    ],
    approximate: 'Main towns; the line follows cycle routes near the coast.',
    stops: [
      { q: 'Seattle, Washington', name: 'Seattle', wiki: 'Seattle', text: 'Ferry across Puget Sound to the Olympic peninsula.' },
      { q: 'Astoria, Oregon', name: 'Astoria', wiki: 'Astoria, Oregon', text: 'Over the Columbia river into Oregon.' },
      { q: 'Cannon Beach, Oregon', name: 'Cannon Beach', wiki: 'Haystack Rock', text: 'Haystack Rock and the start of Oregon\'s wild coast.' },
      { q: 'Florence, Oregon', name: 'Florence', wiki: 'Oregon Dunes National Recreation Area', text: 'Sea lion caves and the Oregon dunes.' },
      { q: 'Crescent City, California', name: 'Crescent City', wiki: 'Redwood National and State Parks', text: 'Into California and the redwoods.' },
      { q: 'Garberville, California', name: 'Avenue of the Giants', wiki: 'Avenue of the Giants', text: 'Riding between the tallest trees on earth.' },
      { q: 'San Francisco, California', name: 'San Francisco', wiki: 'Golden Gate Bridge', text: 'Across the Golden Gate.', source: REPORT('Edinburgh Bicycle', 'https://www.edinburghbicycle.com/info/blog/bike-pacific-coast-highway-us-part-4-4') },
      { q: 'Big Sur, California', name: 'Big Sur', wiki: 'Big Sur', text: 'Cliffs, Bixby Bridge and the best day of the trip.' },
      { q: 'Santa Barbara, California', name: 'Santa Barbara', wiki: 'Santa Barbara, California', text: 'Palms and missions on the way south.' },
      { q: 'San Diego, California', name: 'San Diego', wiki: 'San Diego', text: 'The end, near the Mexican border.' },
    ],
  },
  {
    id: 'mongolia-gobi',
    title: 'Mongolia: Ulaanbaatar to the Gobi',
    who: 'Classic route · overland in the Gobi by 4x4',
    when: 'June to September',
    vehicle: '4x4 with a driver or self-drive, 7–11 days',
    kind: '4x4',
    color: '#b45309',
    summary: 'South from the capital across the steppe into the Gobi: the eroded White Stupa cliffs, the ice-filled Yolyn Am gorge, the singing dunes of Khongoryn Els, the dinosaur cliffs of Bayanzag, then north to the old capital Karakorum. Tracks, not roads; nights in gers with herding families.',
    sources: [
      REPORT('Adventures Overland: Mongolia overland', 'https://www.adventuresoverland.com/fixed-departure/mongolia-overland'),
      REPORT('Amateur Traveler: overlanding in Mongolia', 'https://amateurtraveler.com/?p=58475'),
    ],
    approximate: 'Main sights; the tracks are the drivers\' choice, and the line is a guide only.',
    stops: [
      { q: 'Ulaanbaatar, Mongolia', name: 'Ulaanbaatar', wiki: 'Ulaanbaatar', text: 'Stock up and download offline maps: little signal ahead.' },
      { q: 'Tsagaan Suvarga', name: 'Tsagaan Suvarga', at: [44.5833, 105.75], route: 'line', wiki: 'Tsagaan Suvarga', text: 'Eroded white and pink cliffs, the "White Stupa".' },
      { q: 'Yolyn Am', name: 'Yolyn Am', at: [43.4875, 104.0583], route: 'line', wiki: 'Yolyn Am', text: 'A narrow gorge in the Gurvan Saikhan mountains where ice lasts into summer.' },
      { q: 'Khongoryn Els', name: 'Khongoryn Els', at: [43.7833, 102.2167], route: 'line', wiki: 'Khongoryn Els', text: 'Mongolia\'s largest dunes, about 100 km long and up to 300 m high; camel rides at sunset.', source: REPORT('Amateur Traveler', 'https://amateurtraveler.com/?p=58475') },
      { q: 'Bayanzag', name: 'Bayanzag', at: [44.1386, 103.7286], route: 'line', wiki: 'Flaming Cliffs', text: 'The Flaming Cliffs, where the first dinosaur eggs were found.' },
      { q: 'Kharkhorin, Mongolia', name: 'Karakorum', route: 'line', wiki: 'Erdene Zuu Monastery', text: 'Genghis Khan\'s capital and the Erdene Zuu monastery.' },
      { q: 'Ulaanbaatar, Mongolia', name: 'Back in Ulaanbaatar', route: 'line', wiki: 'Mongolia', text: 'Back across the steppe.' },
    ],
  },
  {
    id: 'oman-4x4',
    title: 'Oman by 4x4',
    who: 'Classic route · mountains, desert and coast',
    when: 'October to March',
    vehicle: '4x4, often with a rooftop tent, 8–14 days',
    kind: '4x4',
    color: '#be123c',
    summary: 'A loop of about 1,400 km from Muscat: the forts and souq of Nizwa, the gravel road up Jebel Shams to the edge of the "Grand Canyon of Arabia", the dunes of the Wahiba Sands, palm-filled wadis to swim in, turtles at Ras al-Jinz and dhow yards at Sur. Wild camping is a big part of it.',
    sources: [
      REPORT('Mapping Megan: wild camping in Oman, 7-day 4WD itinerary', 'https://mappingmegan.com/wild-camping-oman-7-day-4wd-itinerary-self-drive-roadtrip-without-a-guide'),
      REPORT('Ountravela: Oman off-road itinerary and GPS tracks', 'https://ountravela.com/en/overlanding-off-road-trip/oman-travel-map-4x4/'),
    ],
    approximate: 'A common loop; the roads are the router\'s choice.',
    stops: [
      { q: 'Muscat, Oman', name: 'Muscat', wiki: 'Muscat', text: 'The Grand Mosque and the corniche, then inland.' },
      { q: 'Nizwa, Oman', name: 'Nizwa', wiki: 'Nizwa', text: 'A great round fort and the Friday goat market.' },
      { q: 'Jebel Shams, Oman', name: 'Jebel Shams', at: [23.2372, 57.2633], wiki: 'Jebel Shams', text: 'Gravel to the rim of Wadi Ghul, the "Grand Canyon of Arabia"; a balcony walk along it.', source: REPORT('Mapping Megan', 'https://mappingmegan.com/wild-camping-oman-7-day-4wd-itinerary-self-drive-roadtrip-without-a-guide') },
      { q: 'Misfat al Abriyeen', name: 'Misfat al-Abriyeen', wiki: 'Misfat al Abriyeen', text: 'A mountain village of mud houses and falaj water channels.' },
      { q: 'Bidiyah, Oman', name: 'Wahiba Sands', wiki: 'Wahiba Sands', text: 'Into the dunes for a night at a desert camp.' },
      { q: 'Wadi Bani Khalid', name: 'Wadi Bani Khalid', wiki: 'Wadi Bani Khalid', text: 'Green pools in the rocks for a swim.' },
      { q: 'Ras al Jinz', name: 'Ras al-Jinz', wiki: 'Ras al Jinz', text: 'Green turtles coming ashore to nest at night.' },
      { q: 'Sur, Oman', name: 'Sur', wiki: 'Sur, Oman', text: 'Dhow-building yards, then Wadi Shab on the way back.' },
      { q: 'Muscat, Oman', name: 'Back in Muscat', wiki: 'Mutrah', text: 'Along the coast road to the capital.' },
    ],
  },
  {
    id: 'wild-atlantic-way-bike',
    title: 'Wild Atlantic Way by bike: Galway to Kinsale',
    who: 'Classic route · Ireland\'s west coast',
    when: 'May to September',
    vehicle: 'Touring bike, about 2 weeks',
    kind: 'bike',
    color: '#15803d',
    summary: 'The southern half of the world\'s longest defined coastal route: Connemara\'s bogs and mountains, the Cliffs of Moher and the Burren, the Dingle peninsula and Slea Head, the Ring of Kerry and Beara, ending in the food town of Kinsale. Wind, rain, pubs and music; 80–100 km a day.',
    sources: [
      REPORT('Cycloscope: Ireland, the Wild Atlantic Way by bicycle', 'https://cycloscope.net/cycling-ireland-wild-atlantic-way-bicycle/'),
      REPORT('Discover Ireland: cycling the Wild Atlantic Way', 'https://www.discoverireland.ie/wild-atlantic-way/wild-atlantic-way-cycle'),
    ],
    approximate: 'Main stops; the line follows quiet roads near the coast.',
    stops: [
      { q: 'Galway, Ireland', name: 'Galway', wiki: 'Galway', text: 'A lively harbour city of music pubs.' },
      { q: 'Clifden, Ireland', name: 'Clifden', wiki: 'Clifden', text: 'Into Connemara: lakes, bog and the Twelve Bens, about 94 km.' },
      { q: 'Doolin, Ireland', name: 'Doolin', wiki: 'Cliffs of Moher', text: 'Back through Galway and the Burren\'s limestone to the Cliffs of Moher.' },
      { q: 'Kilrush, County Clare', name: 'Kilrush', at: [52.6397, -9.4836], wiki: 'Loop Head', text: 'Out to Loop Head, then the ferry over the Shannon.' },
      { q: 'Dingle, Ireland', name: 'Dingle', wiki: 'Slea Head Drive', text: 'Slea Head and the Blasket Islands from the end of Europe.', source: REPORT('Cycloscope', 'https://cycloscope.net/cycling-ireland-wild-atlantic-way-bicycle/') },
      { q: 'Kenmare, Ireland', name: 'Kenmare', wiki: 'Ring of Kerry', text: 'Round the Ring of Kerry, or over the passes of the Iveragh peninsula.' },
      { q: 'Bantry, Ireland', name: 'Bantry', wiki: 'Healy Pass', text: 'The Healy Pass over the Beara peninsula.' },
      { q: 'Kinsale, Ireland', name: 'Kinsale', wiki: 'Kinsale', text: 'Along West Cork\'s coves to a harbour town famous for seafood.' },
    ],
  },
  {
    id: 'sardinia-moto',
    title: 'Sardinia by motorcycle',
    who: 'Classic route · the island\'s great coastal roads',
    when: 'April–June and September–October',
    vehicle: 'Motorcycle, 7–10 days',
    kind: 'moto',
    color: '#0e7490',
    summary: 'A loop of the island by ferry from mainland Italy: the SS125 Orientale Sarda through the wild mountains of the east between Baunei and Dorgali, nuraghe towers from the Bronze Age, the white coves of the Gulf of Orosei, and the coast road from Bosa to Catalan Alghero. Watch for goats and tourists in the curves.',
    sources: [
      REPORT('Moto.it: Sardinia, 1,500 km on the BMW R 1300 GS', 'https://www.moto.it/accessori/sardegna-in-moto-viaggio-bmw-r-1300-gs.html'),
      REPORT('ADAC: the most beautiful motorcycle tours in Sardinia', 'https://www.adac.de/reise-freizeit/reisen-mit-motorrad/motorradtouren/sardinien/'),
    ],
    approximate: 'A common loop from Olbia.',
    stops: [
      { q: 'Olbia, Sardinia', name: 'Olbia', wiki: 'Olbia', text: 'Off the night ferry from the mainland.' },
      { q: 'Dorgali, Sardinia', name: 'Dorgali', wiki: 'Cala Gonone', text: 'Down to Cala Gonone and the coves of the Gulf of Orosei.' },
      { q: 'Baunei, Sardinia', name: 'Baunei', wiki: 'Strada statale 125 Var Orientale Sarda', text: 'The SS125 Orientale Sarda\'s finest 50 km, curve after curve through the mountains.', source: REPORT('Moto.it', 'https://www.moto.it/accessori/sardegna-in-moto-viaggio-bmw-r-1300-gs.html') },
      { q: 'Arbatax, Sardinia', name: 'Arbatax', wiki: 'Arbatax', text: 'Red porphyry rocks by the sea.' },
      { q: 'Cagliari, Sardinia', name: 'Cagliari', wiki: 'Cagliari', text: 'The capital, and the coast road east towards Villasimius.' },
      { q: 'Barumini, Sardinia', name: 'Su Nuraxi', wiki: 'Su Nuraxi', text: 'The great Bronze Age nuraghe fortress, a UNESCO site.' },
      { q: 'Bosa, Sardinia', name: 'Bosa', wiki: 'Bosa', text: 'Pastel houses on a river under a castle.' },
      { q: 'Alghero, Sardinia', name: 'Alghero', wiki: 'Alghero', text: 'The cliff road from Bosa to the Catalan-speaking walled town.' },
      { q: 'Castelsardo, Sardinia', name: 'Castelsardo', wiki: 'Castelsardo', text: 'A castle village on a rock, then back to Olbia.' },
    ],
  },
  {
    id: 'uzbekistan-silk-road-bike',
    title: 'The Silk Road by bike: Uzbekistan',
    who: 'Classic route · Samarkand, Bukhara and Khiva',
    when: 'April–May and September–October',
    vehicle: 'Touring bike, 12–15 days',
    kind: 'bike',
    color: '#0284c7',
    summary: 'Blue-tiled cities of the old caravan road: Samarkand\'s Registan, the Nuratau mountains and yurt camps by Aydarkul lake, holy Bukhara, then across the Kyzylkum desert to the walled town of Khiva. Hot in summer; ride in spring or autumn.',
    sources: [
      REPORT('Skedaddle: the Silk Road and beyond, cycling Uzbekistan', 'https://www.skedaddle.com/blog/the-silk-road-and-beyond-pedal-through-time-on-our-new-uzbek-cycling-adventure/'),
      REPORT('Overland Europe: Bukhara to Samarkand by bike', 'https://overland-europe.com/breaking-the-cycle-central-asia-the-zerafshan-karakum-corridor-part-2-bukhara-to-samarkand/'),
    ],
    approximate: 'A common route; the roads are the router\'s choice.',
    stops: [
      { q: 'Tashkent, Uzbekistan', name: 'Tashkent', wiki: 'Tashkent', text: 'The capital, then the train or a ride to Samarkand.' },
      { q: 'Samarkand, Uzbekistan', name: 'Samarkand', by: 'train', wiki: 'Registan', text: 'The Registan\'s three madrasas, Tamerlane\'s city.' },
      { q: 'Nurata, Uzbekistan', name: 'Nuratau', wiki: 'Nuratau Mountains', text: 'Mountain villages and homestays.' },
      { q: 'Aydarkul', name: 'Aydarkul lake', at: [40.8, 66.9], wiki: 'Aydar Lake', text: 'Yurt camps and camels between desert and lake.' },
      { q: 'Bukhara, Uzbekistan', name: 'Bukhara', wiki: 'Bukhara', text: 'A holy city of madrasas and the Kalyan minaret.', source: REPORT('Overland Europe', 'https://overland-europe.com/breaking-the-cycle-central-asia-the-zerafshan-karakum-corridor-part-2-bukhara-to-samarkand/') },
      { q: 'Khiva, Uzbekistan', name: 'Khiva', wiki: 'Itchan Kala', text: 'Across the Kyzylkum desert to the walled inner town of Itchan Kala.' },
    ],
  },
  // ---- Batch 6 ----
  {
    id: 'via-francigena-lucca-rome',
    title: 'Via Francigena: Lucca to Rome',
    who: 'Classic route · the medieval pilgrims\' road through Tuscany and Lazio',
    when: 'April–June and September–October',
    vehicle: 'On foot, 18–20 days',
    kind: 'walk',
    color: '#7c2d12',
    summary: 'The Italian end of the old road from Canterbury to Rome: about 410 km through Tuscan hill towns, the towers of San Gimignano, Siena\'s Campo, the Val d\'Orcia, Etruscan sunken roads and Lake Bolsena to St Peter\'s. The last 100+ km from Viterbo earn the Testimonium certificate.',
    sources: [
      REPORT('Camino de Santiago Forum: Via Francigena in May (walkers\' notes)', 'https://www.caminodesantiago.me/community/threads/via-francigena-in-may-26.97200/latest'),
      REPORT('Cicerone: walking the Via Francigena, part 3', 'https://www.cicerone.co.uk/walking-the-via-francigena-pilgrim-route-part-3?refer=eavf'),
    ],
    approximate: 'Usual stage towns; the line follows paths near the waymarked route.',
    stops: [
      { q: 'Lucca, Italy', name: 'Lucca', wiki: 'Lucca', text: 'Walk the Renaissance walls, then out across the plain.' },
      { q: 'Altopascio, Italy', name: 'Altopascio', wiki: 'Altopascio', text: 'A medieval pilgrims\' hospice town whose bell guided walkers in fog.' },
      { q: 'San Miniato, Italy', name: 'San Miniato', wiki: 'San Miniato', text: 'A hilltop town famous for white truffles.' },
      { q: 'Gambassi Terme, Italy', name: 'Gambassi Terme', wiki: 'Gambassi Terme', text: 'Into the hills, past the old church of Santa Maria a Chianni.' },
      { q: 'San Gimignano, Italy', name: 'San Gimignano', wiki: 'San Gimignano', text: 'The "medieval Manhattan" of stone towers.', source: REPORT('Walkers\' notes, Camino Forum', 'https://www.caminodesantiago.me/community/threads/via-francigena-in-may-26.97200/latest') },
      { q: 'Monteriggioni, Italy', name: 'Monteriggioni', wiki: 'Monteriggioni', text: 'A tiny walled village that Dante wrote about.' },
      { q: 'Siena, Italy', name: 'Siena', at: [43.3188, 11.3308], wiki: 'Piazza del Campo', text: 'The shell-shaped Campo and the striped cathedral: a rest day.' },
      { q: 'San Quirico d\'Orcia, Italy', name: 'San Quirico d\'Orcia', wiki: 'Val d\'Orcia', text: 'The cypress hills of the Val d\'Orcia.' },
      { q: 'Radicofani, Italy', name: 'Radicofani', wiki: 'Radicofani', text: 'A fortress on a hill, the last of Tuscany.' },
      { q: 'Bolsena, Italy', name: 'Bolsena', wiki: 'Lake Bolsena', text: 'A volcanic crater lake in Lazio.' },
      { q: 'Viterbo, Italy', name: 'Viterbo', wiki: 'Viterbo', text: 'The city of popes; Etruscan sunken roads ahead.' },
      { q: 'Sutri, Italy', name: 'Sutri', wiki: 'Sutri', text: 'A rock-cut amphitheatre and Etruscan tombs.' },
      { q: 'St. Peter\'s Square, Vatican City', name: 'Rome', wiki: 'St. Peter\'s Basilica', text: 'Across Monte Mario to St Peter\'s Square.' },
    ],
  },
  {
    id: 'alta-via-1',
    title: 'Alta Via 1, Dolomites',
    who: 'Classic route · the queen of Dolomite hut treks',
    when: 'Late June to mid-September, when the rifugi are open',
    vehicle: 'On foot, 8–11 days, mountain huts',
    kind: 'walk',
    color: '#be185d',
    summary: 'About 120 km south through the pale towers of the Dolomites from Lago di Braies to near Belluno: the Fanes plateau, First World War tunnels at Lagazuoi, the Cinque Torri, the Civetta\'s great wall, and nights in rifugi with polenta and grappa. No via ferrata needed, though some passages have cables.',
    sources: [
      REPORT('Tumbarumba: Alta Via 1, 2025 practical notes', 'https://tumbarumba.co.uk/MOUNTAIN%20WALKING/ALTA%20VIA%201%20-%202025/The Practical.html'),
      REPORT('Fastest Known Time: Alta Via 1, August 2025', 'https://fastestknowntime.com/fkt/matteo-grassi-alta-dolomiti-n-1-italy-2025-08-24'),
    ],
    approximate: 'The usual huts; the line follows mountain paths where they were found.',
    stops: [
      { q: 'Lago di Braies', name: 'Lago di Braies', wiki: 'Lago di Braies', text: 'The emerald lake at the start, crowded at noon, magical at dawn.' },
      { q: 'Rifugio Sennes', name: 'Rifugio Sennes', wiki: 'Fanes-Senes-Prags Nature Park', text: 'Up past the Croda del Becco to the high Sennes plateau.', source: REPORT('Tumbarumba (2025)', 'https://tumbarumba.co.uk/MOUNTAIN%20WALKING/ALTA%20VIA%201%20-%202025/The Practical.html') },
      { q: 'Rifugio Lavarella', name: 'Fanes', wiki: 'Fanes', text: 'The Fanes alp, land of Ladin legends.' },
      { q: 'Rifugio Lagazuoi', name: 'Lagazuoi', wiki: 'Lagazuoi', text: 'The highest hut at 2,752 m; down through the war tunnels next morning.' },
      { q: 'Rifugio Averau', name: 'Cinque Torri', wiki: 'Cinque Torri', text: 'Five rock towers and open-air war trenches.' },
      { q: 'Rifugio Città di Fiume', name: 'Città di Fiume', wiki: 'Monte Pelmo', text: 'Under the "throne of God", Monte Pelmo.' },
      { q: 'Rifugio Coldai', name: 'Civetta', wiki: 'Civetta', text: 'Lago Coldai and the Civetta\'s 1,200 m north-west wall.' },
      { q: 'Rifugio Carestiato', name: 'Rifugio Carestiato', wiki: 'Moiazza', text: 'Under the Moiazza towers.' },
      { q: 'La Pissa, Belluno', name: 'La Pissa (Belluno)', at: [46.2167, 12.1], wiki: 'Belluno', text: 'Down through the Schiara massif\'s foothills to the bus for Belluno.' },
    ],
  },
  {
    id: 'everest-base-camp',
    title: 'Everest Base Camp Trek',
    who: 'Classic route · the Khumbu, Nepal',
    when: 'October–November and March–May',
    vehicle: 'On foot, 12–14 days, teahouses',
    kind: 'walk',
    color: '#0369a1',
    summary: 'From the steep airstrip at Lukla up the Dudh Kosi to the Sherpa capital Namche Bazaar, Tengboche monastery, and the moraines to Gorak Shep and the base camp at 5,364 m, with sunrise on Everest from Kala Patthar. Two acclimatisation days, prayer flags and yak trains.',
    sources: [
      REPORT('Adventure Peaks: Ultimate Everest Base Camp trek news (March 2025)', 'https://www.adventurepeaks.com/news/ultimate-everest-base-camp-trek-news-29th-march-2025/'),
      REPORT('YAMAP: Everest Base Camp trip log (December 2025)', 'https://yamap.com/activities/45226359/article'),
    ],
    approximate: 'The usual teahouse villages; the line follows trails where they were found.',
    stops: [
      { q: 'Lukla, Nepal', name: 'Lukla', wiki: 'Lukla', text: 'One of the world\'s most exciting airstrips, built on a slope.' },
      { q: 'Phakding, Nepal', name: 'Phakding', wiki: 'Phakding', text: 'An easy first afternoon along the river.' },
      { q: 'Namche Bazaar, Nepal', name: 'Namche Bazaar', wiki: 'Namche Bazaar', text: 'The Sherpa market town in a horseshoe valley; an acclimatisation day and the Everest View hotel.', source: REPORT('YAMAP log (2025)', 'https://yamap.com/activities/45226359/article') },
      { q: 'Tengboche, Nepal', name: 'Tengboche', wiki: 'Tengboche Monastery', text: 'The monastery facing Ama Dablam.' },
      { q: 'Dingboche, Nepal', name: 'Dingboche', wiki: 'Dingboche', text: 'Stone-walled fields at 4,400 m; a second rest day climbing Nangkartshang.' },
      { q: 'Lobuche, Nepal', name: 'Lobuche', wiki: 'Lobuche', text: 'Past the memorials to climbers at Thukla pass.' },
      { q: 'Gorak Shep, Nepal', name: 'Gorak Shep', wiki: 'Gorak Shep', text: 'The last lodges, on a frozen lake bed at 5,160 m.' },
      { q: 'Everest Base Camp, Nepal', name: 'Everest Base Camp', at: [28.0026, 86.8528], route: 'line', wiki: 'Everest base camps', text: 'The base camp by the Khumbu icefall, at about 5,364 m.' },
      { q: 'Kala Patthar', name: 'Kala Patthar', at: [27.9958, 86.8286], route: 'line', wiki: 'Kala Patthar', text: 'A pre-dawn climb to 5,600 m for the best view of Everest itself.', source: REPORT('Adventure Peaks (2025)', 'https://www.adventurepeaks.com/news/ultimate-everest-base-camp-trek-news-29th-march-2025/') },
    ],
  },
  {
    id: 'overland-track',
    title: 'Overland Track, Tasmania',
    who: 'Classic route · Australia\'s great alpine walk',
    when: 'October to May (booking needed in season)',
    vehicle: 'On foot, 6 days, huts and tent platforms',
    kind: 'walk',
    color: '#166534',
    summary: 'About 65 km through the Cradle Mountain–Lake St Clair National Park: alpine moors, ancient pencil pines, waterfalls, wombats, side trips up Tasmania\'s highest peak Mount Ossa, ending with a ferry across Australia\'s deepest lake. Weather can bring snow even in summer.',
    sources: [
      REPORT('Tasmania Parks: Overland Track walk notes', 'https://parks.tas.gov.au/explore-our-parks/cradle-mountain/overland-track/overland-track-walk-notes'),
      REPORT('Bike Hike Safari: Overland Track 2025', 'https://bikehikesafari.com/?p=144'),
    ],
    approximate: 'The usual hut stages; the line follows the track where it was found.',
    stops: [
      { q: 'Ronny Creek, Cradle Mountain', name: 'Ronny Creek', at: [-41.6437, 145.9506], wiki: 'Cradle Mountain', text: 'Boardwalks past Crater Lake towards Cradle Mountain.' },
      { q: 'Waterfall Valley Hut', name: 'Waterfall Valley', at: [-41.7144, 145.9478], route: 'line', wiki: 'Cradle Mountain-Lake St Clair National Park', text: 'Under Barn Bluff; side trip up Cradle Mountain on the way.', source: REPORT('Bike Hike Safari (2025)', 'https://bikehikesafari.com/?p=144') },
      { q: 'Windermere Hut', name: 'Lake Windermere', at: [-41.7708, 145.9542], route: 'line', wiki: 'Cradle Mountain-Lake St Clair National Park', text: 'A swim in a cold tarn.' },
      { q: 'New Pelion Hut', name: 'New Pelion', at: [-41.8292, 146.0464], route: 'line', wiki: 'Mount Pelion West', text: 'Buttongrass plains and a big hut; the old miners\' hut nearby.' },
      { q: 'Kia Ora Hut', name: 'Kia Ora', at: [-41.8939, 146.0828], route: 'line', wiki: 'Mount Ossa', text: 'Over Pelion Gap, with the climb up Mount Ossa, 1,617 m.' },
      { q: 'Windy Ridge Hut', name: 'Windy Ridge', at: [-41.9447, 146.1031], route: 'line', wiki: 'Cradle Mountain-Lake St Clair National Park', text: 'Through forest past D\'Alton and Fergusson falls.' },
      { q: 'Narcissus Hut', name: 'Narcissus', at: [-42.0217, 146.1083], route: 'line', wiki: 'Lake St Clair', text: 'The ferry across Lake St Clair, or walk the shore.' },
    ],
  },
  {
    id: 'john-muir-trail',
    title: 'John Muir Trail',
    who: 'Classic route · the High Sierra, California',
    when: 'July to September',
    vehicle: 'On foot, 2–3 weeks (permits by lottery)',
    kind: 'walk',
    color: '#4338ca',
    summary: 'About 340 km from Yosemite Valley to the summit of Mount Whitney, the highest point in the lower 48: granite domes, a dozen passes over 3,300 m, Evolution Basin\'s lakes, Muir Pass\'s stone hut, and almost no roads. Shares much of its way with the Pacific Crest Trail.',
    sources: [
      REPORT('FarOut: reflections from the John Muir Trail (2025)', 'https://faroutguides.com/reflections-from-the-john-muir-trail/'),
      REPORT('Halfway Anywhere: John Muir Trail, class of 2025', 'https://www.halfwayanywhere.com/trails/john-muir-trail/jmt-hiker-surprises-2025/'),
    ],
    approximate: 'Main points; the line follows trails where they were found.',
    stops: [
      { q: 'Happy Isles, Yosemite', name: 'Happy Isles', at: [37.7316, -119.5575], wiki: 'Yosemite Valley', text: 'The start in Yosemite Valley, up past Vernal and Nevada falls.' },
      { q: 'Tuolumne Meadows', name: 'Tuolumne Meadows', wiki: 'Tuolumne Meadows', text: 'Over Cathedral Pass to the high meadows.' },
      { q: 'Thousand Island Lake', name: 'Thousand Island Lake', at: [37.7225, -119.1797], route: 'line', wiki: 'Thousand Island Lake', text: 'Over Donohue Pass, Banner Peak above a lake of islets.' },
      { q: 'Reds Meadow', name: 'Reds Meadow', at: [37.6158, -119.0744], wiki: 'Devils Postpile National Monument', text: 'The basalt columns of Devils Postpile; resupply.' },
      { q: 'Muir Trail Ranch', name: 'Muir Trail Ranch', at: [37.2431, -118.8828], wiki: 'John Muir Wilderness', text: 'A remote ranch that holds hikers\' resupply buckets.' },
      { q: 'Evolution Lake', name: 'Evolution Basin', at: [37.1633, -118.7072], route: 'line', wiki: 'Evolution Basin', text: 'Lakes under peaks named after Darwin and Huxley: many hikers\' favourite day.', source: REPORT('FarOut (2025)', 'https://faroutguides.com/reflections-from-the-john-muir-trail/') },
      { q: 'Muir Hut', name: 'Muir Pass', at: [37.1119, -118.6706], route: 'line', wiki: 'Muir Pass', text: 'The stone hut on top of the pass, 3,644 m.' },
      { q: 'Rae Lakes', name: 'Rae Lakes', at: [36.8131, -118.4011], route: 'line', wiki: 'Rae Lakes', text: 'Over Mather, Pinchot and Glen passes to one of the Sierra\'s loveliest lakes.' },
      { q: 'Forester Pass', name: 'Forester Pass', at: [36.6942, -118.3717], route: 'line', wiki: 'Forester Pass', text: 'The highest pass on the trail, 4,009 m.' },
      { q: 'Mount Whitney', name: 'Mount Whitney', at: [36.5785, -118.2923], route: 'line', wiki: 'Mount Whitney', text: 'The summit at 4,421 m, then down to Whitney Portal.' },
    ],
  },
  {
    id: 'fishermens-trail',
    title: 'Rota Vicentina: Fishermen\'s Trail',
    who: 'Classic route · Portugal\'s wild Atlantic coast on foot',
    when: 'September to June (summer is hot)',
    vehicle: 'On foot, 4–13 days',
    kind: 'walk',
    color: '#0e7490',
    summary: 'A cliff-top path in soft sand along the south-west coast of Portugal, used by fishermen to reach their spots: storks nesting on sea stacks, hidden beaches, river mouths and whitewashed villages, through the Southwest Alentejo and Vicentine Coast Natural Park. The classic four stages run Porto Covo to Odeceixe; it now continues to the Cape St Vincent.',
    sources: [
      REPORT('Monkey\'s Tale: hiking the Fishermen\'s Trail, northern section (January 2025)', 'https://monkeystale.ca/2025/01/21/hiking-the-fishermens-trail-the-northern-section/'),
      REPORT('Rota Vicentina: Fishermen\'s Trail', 'https://blog.rotavicentina.com/en/tag/fishermens-trail'),
    ],
    approximate: 'The classic stages; the path follows the coast near the line shown.',
    stops: [
      { q: 'Porto Covo, Portugal', name: 'Porto Covo', wiki: 'Porto Covo', text: 'A white fishing village and the start, the island of Pessegueiro offshore.' },
      { q: 'Vila Nova de Milfontes, Portugal', name: 'Vila Nova de Milfontes', wiki: 'Vila Nova de Milfontes', text: 'Sand dunes and cliffs to the mouth of the Mira river.', source: REPORT('Monkey\'s Tale (2025)', 'https://monkeystale.ca/2025/01/21/hiking-the-fishermens-trail-the-northern-section/') },
      { q: 'Almograve, Portugal', name: 'Almograve', wiki: 'Almograve', text: 'Dark schist cliffs and beaches below.' },
      { q: 'Zambujeira do Mar, Portugal', name: 'Zambujeira do Mar', wiki: 'Zambujeira do Mar', text: 'Past Cabo Sardão, where white storks nest on the sea cliffs.' },
      { q: 'Odeceixe, Portugal', name: 'Odeceixe', wiki: 'Odeceixe', text: 'Across the Seixe river into the Algarve, a beach in a river bend.' },
      { q: 'Aljezur, Portugal', name: 'Aljezur', wiki: 'Aljezur', text: 'A Moorish castle above the town.' },
      { q: 'Carrapateira, Portugal', name: 'Carrapateira', wiki: 'Carrapateira', text: 'Surf beaches at Bordeira and Amado.' },
      { q: 'Cabo de São Vicente', name: 'Cape St Vincent', wiki: 'Cape St. Vincent', text: 'The south-west corner of Europe, once thought the end of the world.' },
    ],
  },
  {
    id: 'loire-a-velo',
    title: 'Loire à Vélo',
    who: 'Classic route · France\'s river of châteaux by bike',
    when: 'April to October',
    vehicle: 'Any bike, 7–12 days',
    kind: 'bike',
    color: '#9333ea',
    summary: 'About 480 km of well-signed, mostly flat paths along the Loire from Orléans to the Atlantic at Saint-Nazaire: the royal châteaux of Chambord, Blois, Amboise and Chenonceau, troglodyte houses and Saumur wine, Angers and Nantes, part of EuroVelo 6.',
    sources: [
      REPORT('Jo Harrison: La Loire à Vélo, practical information (August 2025)', 'https://joharrisontour.blogspot.com/2025/08/la-loire-velo-practical-information.html'),
      REPORT('Loire by Bike: from Châteauneuf-sur-Loire to Saint-Brevin', 'https://loirebybike.co.uk/suggestion/thierry-on-the-loire-a-velo-from-chateauneuf-sur-loire-to-saint-brevin-les-pins'),
    ],
    approximate: 'Main towns; the line follows cycle paths near the river.',
    stops: [
      { q: 'Orléans, France', name: 'Orléans', wiki: 'Orléans', text: 'Joan of Arc\'s city, the start.' },
      { q: 'Chambord, France', at: [47.6161, 1.517], name: 'Chambord', wiki: 'Château de Chambord', text: 'The biggest château, with its double-spiral staircase.' },
      { q: 'Blois, France', name: 'Blois', wiki: 'Château de Blois', text: 'A royal château in four styles.' },
      { q: 'Amboise, France', name: 'Amboise', wiki: 'Château d\'Amboise', text: 'Where Leonardo da Vinci spent his last years.' },
      { q: 'Tours, France', name: 'Tours', wiki: 'Tours', text: 'A detour to Chenonceau over the Cher.', source: REPORT('Jo Harrison (2025)', 'https://joharrisontour.blogspot.com/2025/08/la-loire-velo-practical-information.html') },
      { q: 'Saumur, France', name: 'Saumur', wiki: 'Saumur', text: 'White tufa cliffs, troglodyte homes and sparkling wine.' },
      { q: 'Angers, France', name: 'Angers', wiki: 'Château d\'Angers', text: 'A black fortress and the great Apocalypse tapestry.' },
      { q: 'Nantes, France', name: 'Nantes', wiki: 'Machines of the Isle of Nantes', text: 'A giant mechanical elephant walking the old shipyards.' },
      { q: 'Saint-Nazaire, France', name: 'Saint-Nazaire', wiki: 'Saint-Nazaire Bridge', text: 'The estuary and the ocean; a bike shuttle over the big bridge.' },
    ],
  },
  {
    id: 'hebridean-way',
    title: 'Hebridean Way by bike',
    who: 'Classic route · the Outer Hebrides, Scotland',
    when: 'May to September',
    vehicle: 'Bike, 6–8 days',
    kind: 'bike',
    color: '#0891b2',
    summary: '297 km across ten islands, six causeways and two ferries from Vatersay to the Butt of Lewis: white beaches and turquoise water, Gaelic-speaking crofting townships, the mountains of Harris and the standing stones of Calanais. Headwinds are part of the deal.',
    sources: [
      REPORT('Cycling UK: travellers\' tales, Hebridean e-biking (2025)', 'https://www.cyclinguk.org/cycle-magazine/travellers-tales-hebridean-e-biking'),
      REPORT('VisitScotland: Hebridean Way cycling route', 'https://www.visitscotland.com/things-to-do/outdoor-activities/cycling/hebridean-way-cycling-route'),
    ],
    approximate: 'Main stops; ferries between islands drawn as dashed lines.',
    stops: [
      { q: 'Vatersay', name: 'Vatersay', wiki: 'Vatersay', text: 'The southern start, past two white beaches.' },
      { q: 'Castlebay, Barra', name: 'Barra', wiki: 'Barra', text: 'Kisimul castle in the bay; planes land on the beach here.' },
      { q: 'Eriskay', name: 'Eriskay', by: 'ferry', wiki: 'Eriskay', text: 'Ferry over the Sound of Barra; the "Whisky Galore" island.' },
      { q: 'Lochboisdale, South Uist', name: 'South Uist', wiki: 'South Uist', text: 'Machair grassland and long Atlantic beaches.' },
      { q: 'Lochmaddy, North Uist', name: 'North Uist', wiki: 'North Uist', text: 'Across Benbecula\'s causeways, a land of lochs.' },
      { q: 'Leverburgh, Harris', name: 'Harris', by: 'ferry', wiki: 'Harris, Scotland', text: 'Ferry from Berneray through the islets of the Sound of Harris.', source: REPORT('Cycling UK (2025)', 'https://www.cyclinguk.org/cycle-magazine/travellers-tales-hebridean-e-biking') },
      { q: 'Luskentyre', name: 'Luskentyre', wiki: 'Luskentyre', text: 'One of the world\'s finest beaches, then the mountains of North Harris.' },
      { q: 'Callanish, Lewis', name: 'Calanais', wiki: 'Calanais Standing Stones', text: 'Stone circles older than Stonehenge.' },
      { q: 'Butt of Lewis Lighthouse', name: 'Butt of Lewis', wiki: 'Butt of Lewis', text: 'The red-brick lighthouse at the northern tip.' },
    ],
  },
  {
    id: 'taiwan-round-island',
    title: 'Round Taiwan by bike (Huandao)',
    who: 'Classic route · Taiwan\'s national cycling rite',
    when: 'October to April (ride anticlockwise in winter)',
    vehicle: 'Road or touring bike, 9–14 days',
    kind: 'bike',
    color: '#dc2626',
    summary: 'About 950 km around the island, a rite of passage in Taiwan: the busy west coast and its night markets, the tropical south at Kenting, the Shouka pass, the rice paddies of the East Rift Valley on Highway 9, and the marble cliffs of the Pacific coast. 7-Elevens every few kilometres and bike-friendly police stations.',
    sources: [
      REPORT('Albinger: a bike ride around Taiwan, part 2, the east coast (2025 trip)', 'https://albinger.me/2026/01/10/a-bike-ride-around-taiwan-part-2-the-east-coast/'),
      REPORT('CycleBlaze: Yuli south to Taitung City (January 2025)', 'https://cycleblaze.com/journals/2025cny/yuli-south-to-taitung-city'),
    ],
    approximate: 'Main towns, anticlockwise; the line follows Route 1 and 9 roughly.',
    stops: [
      { q: 'Taipei, Taiwan', name: 'Taipei', wiki: 'Taipei 101', text: 'The start under Taipei 101.' },
      { q: 'Hsinchu, Taiwan', name: 'Hsinchu', wiki: 'Hsinchu', text: 'The windy city of the west coast.' },
      { q: 'Taichung, Taiwan', name: 'Taichung', wiki: 'Taichung', text: 'Bubble tea\'s home town.' },
      { q: 'Chiayi, Taiwan', name: 'Chiayi', wiki: 'Chiayi', text: 'Gateway to Alishan\'s forests.' },
      { q: 'Tainan, Taiwan', name: 'Tainan', wiki: 'Tainan', text: 'The old capital, temples and street food.' },
      { q: 'Kenting, Taiwan', name: 'Kenting', wiki: 'Kenting National Park', text: 'Tropical beaches at the southern tip.' },
      { q: 'Taitung, Taiwan', name: 'Taitung', wiki: 'Taitung City', text: 'Over the Shouka pass, the biggest climb, to the Pacific.' },
      { q: 'Yuli, Taiwan', name: 'Yuli', wiki: 'Huatung Valley', text: 'Up the flat East Rift Valley between two mountain ranges on Highway 9.', source: REPORT('CycleBlaze (2025)', 'https://cycleblaze.com/journals/2025cny/yuli-south-to-taitung-city') },
      { q: 'Hualien, Taiwan', name: 'Hualien', wiki: 'Taroko National Park', text: 'Near the marble gorge of Taroko.' },
      { q: 'Su-ao, Taiwan', name: 'Su\'ao', wiki: 'Suhua Highway', text: 'The Su-Hua cliff road (many take the train past it).' },
      { q: 'Taipei, Taiwan', name: 'Back in Taipei', wiki: 'Taiwan', text: 'Back via Yilan and the hills.' },
    ],
  },
  {
    id: 'tour-aotearoa',
    title: 'Tour Aotearoa',
    who: 'Classic route · New Zealand top to bottom by bike',
    when: 'February brevet start; ridden October to April',
    vehicle: 'Bikepacking, 3–4 weeks',
    kind: 'bike',
    color: '#15803d',
    summary: 'About 3,000 km from Cape Reinga to Bluff, as a brevet with 30 photo checkpoints or at your own pace: 90 Mile Beach at low tide, Northland forests, the Timber Trail, the Whanganui river by jet boat, Wellington, then the South Island\'s rail trails and lakes. Thousands now ride it each season.',
    sources: [
      REPORT('DotWatcher: Tour Aotearoa 2025 round-up', 'https://develop.dotwatcher.cc/feature/tour-aotearoa-2025-round-up'),
      REPORT('NZ Cycle Trail: Tour Aotearoa', 'https://nzcycletrail.com/tour-aotearoa'),
    ],
    approximate: 'Main points; the route uses trails and back roads near the line shown.',
    stops: [
      { q: 'Cape Reinga', name: 'Cape Reinga', wiki: 'Cape Reinga', text: 'The lighthouse where the Tasman meets the Pacific: the start.', source: REPORT('DotWatcher (2025)', 'https://develop.dotwatcher.cc/feature/tour-aotearoa-2025-round-up') },
      { q: 'Ahipara, New Zealand', name: '90 Mile Beach', wiki: 'Ninety Mile Beach, New Zealand', text: 'Down the beach at low tide to Ahipara.' },
      { q: 'Auckland, New Zealand', name: 'Auckland', wiki: 'Auckland', text: 'Through Northland and a ferry over the Kaipara harbour.' },
      { q: 'Taumarunui, New Zealand', name: 'Timber Trail', wiki: 'Timber Trail', text: 'Swing bridges through Pureora forest.' },
      { q: 'Pipiriki, New Zealand', name: 'Whanganui River', wiki: 'Whanganui River', text: 'The Bridge to Nowhere and a jet boat down the river.' },
      { q: 'Wellington, New Zealand', name: 'Wellington', wiki: 'Wellington', text: 'The capital, and the ferry over Cook Strait.' },
      { q: 'Picton, New Zealand', name: 'Picton', by: 'ferry', wiki: 'Queen Charlotte Sound', text: 'Into the South Island\'s sounds.' },
      { q: 'Hanmer Springs, New Zealand', name: 'Hanmer Springs', wiki: 'Hanmer Springs', text: 'Over the Rainbow Road to hot pools.' },
      { q: 'Lake Tekapo', name: 'Lake Tekapo', wiki: 'Lake Tekapo', text: 'The turquoise lakes under Aoraki/Mount Cook.' },
      { q: 'Queenstown, New Zealand', name: 'Queenstown', wiki: 'Queenstown, New Zealand', text: 'By the Alps 2 Ocean and Otago trails to the lake.' },
      { q: 'Bluff, New Zealand', name: 'Bluff', wiki: 'Stirling Point', text: 'The signpost at Stirling Point: the end.' },
    ],
  },
  {
    id: 'icefields-parkway-bike',
    title: 'Icefields Parkway by bike',
    who: 'Classic route · the Canadian Rockies',
    when: 'Mid-June to mid-September',
    vehicle: 'Road or touring bike, 3–5 days',
    kind: 'bike',
    color: '#0284c7',
    summary: 'About 230 km between Jasper and Lake Louise along the spine of the Rockies: a hundred glaciers, turquoise lakes, Bow Summit at 2,134 m, the Columbia Icefield, bears and goats by the road. Lodges and campgrounds are few and book up early. Jasper was hit by wildfire in July 2024.',
    sources: [
      REPORT('Rider Magazine: above the timberline, Canada\'s Rocky Mountain corridor', 'https://ridermagazine.com/above-the-timberline-riding-canadas-wild-rocky-mountain-corridor/'),
      REPORT('10Adventures: cycle Jasper to Banff', 'https://www.10adventures.com/cycle-jasper-to-banff/'),
    ],
    approximate: 'Main stops; the line follows Highway 93.',
    stops: [
      { q: 'Jasper, Alberta', name: 'Jasper', wiki: 'Jasper, Alberta', text: 'A mountain town recovering from the 2024 wildfire.' },
      { q: 'Athabasca Falls', name: 'Athabasca Falls', wiki: 'Athabasca Falls', text: 'A thundering gorge just off the road.' },
      { q: 'Sunwapta Falls', name: 'Sunwapta Falls', wiki: 'Sunwapta Falls', text: 'Into the wilder southern half.' },
      { q: 'Columbia Icefield Discovery Centre', at: [52.2203, -117.2244], name: 'Columbia Icefield', wiki: 'Columbia Icefield', text: 'The Athabasca glacier reaches almost to the road.', source: REPORT('Rider Magazine', 'https://ridermagazine.com/above-the-timberline-riding-canadas-wild-rocky-mountain-corridor/') },
      { q: 'Saskatchewan River Crossing', name: 'Saskatchewan Crossing', wiki: 'North Saskatchewan River', text: 'Over Sunwapta Pass, the only services for miles.' },
      { q: 'Peyto Lake', name: 'Bow Summit', wiki: 'Peyto Lake', text: 'The highest point, 2,134 m, above wolf-head-shaped Peyto Lake.' },
      { q: 'Lake Louise, Alberta', name: 'Lake Louise', wiki: 'Lake Louise (Alberta)', text: 'Past Bow Lake to the famous lake, and on to Banff.' },
    ],
  },
  {
    id: 'alps-passes-moto',
    title: 'Alpine passes: Stelvio, Gavia and Grossglockner',
    who: 'Classic route · the great passes by motorcycle',
    when: 'June to September (passes closed in winter)',
    vehicle: 'Motorcycle, 6–8 days',
    kind: 'moto',
    color: '#e11d48',
    summary: 'The legendary roads of the Alps: the Stelvio\'s 48 hairpins, the narrow Gavia, the Bernina into Switzerland, the Timmelsjoch, and Austria\'s Grossglockner High Alpine Road under the country\'s highest peak, with the Dolomites in between. Ride early to beat the crowds.',
    sources: [
      REPORT('Rider Magazine: Edelweiss Grand Alps tour review (January 2025)', 'https://ridermagazine.com/2025/01/29/edelweiss-grand-alps-tour-review/'),
      REPORT('Motovibes: 8-day Central Alps challenge', 'https://motovibes-shop.fourthwall.com/products/8-day-central-alps-challenge-self-guided-motorcycle-tour'),
    ],
    approximate: 'A common loop; the roads are the router\'s choice.',
    stops: [
      { q: 'Bormio, Italy', name: 'Bormio', wiki: 'Bormio', text: 'The base for the two great passes.' },
      { q: 'Passo dello Stelvio', name: 'Stelvio Pass', wiki: 'Stelvio Pass', text: '48 numbered hairpins on the Trafoi side up to 2,757 m.', source: REPORT('Rider Magazine (2025)', 'https://ridermagazine.com/2025/01/29/edelweiss-grand-alps-tour-review/') },
      { q: 'Passo di Gavia', name: 'Gavia Pass', wiki: 'Gavia Pass', text: 'A narrow, wild road over 2,621 m, famous from the Giro d\'Italia.' },
      { q: 'Livigno, Italy', name: 'Livigno', wiki: 'Livigno', text: 'A duty-free valley town.' },
      { q: 'Passo del Bernina', name: 'Bernina Pass', wiki: 'Bernina Pass', text: 'Into Switzerland past glaciers and the red train.' },
      { q: 'Merano, Italy', name: 'Merano', wiki: 'Merano', text: 'Down the Val Venosta to a spa town.' },
      { q: 'Timmelsjoch', name: 'Timmelsjoch', wiki: 'Timmelsjoch', text: 'A high toll road into Austria\'s Ötztal.' },
      { q: 'Heiligenblut, Austria', name: 'Grossglockner', wiki: 'Grossglockner High Alpine Road', text: 'The High Alpine Road to Edelweissspitze and the Pasterze glacier.' },
      { q: 'Cortina d\'Ampezzo, Italy', name: 'Cortina', wiki: 'Cortina d\'Ampezzo', text: 'Back into Italy through the Dolomites.' },
    ],
  },
  {
    id: 'norway-fjords-moto',
    title: 'Norway\'s fjords by motorcycle',
    who: 'Classic route · western Norway\'s scenic roads',
    when: 'June to August (Trollstigen open May–October)',
    vehicle: 'Motorcycle, 6–8 days',
    kind: 'moto',
    color: '#1d4ed8',
    summary: 'From Bergen north through the fjord country: Stegastein above the Aurlandsfjord, the Sognefjord ferries, Geiranger and the Eagle Road, the eleven hairpins of Trollstigen, and the bridges of the Atlantic Road hopping over the sea. Wet weather, tolls and many ferries; long light nights.',
    sources: [
      REPORT('UKGSer: trip report Norway, July 2025', 'https://www.ukgser.com/community/threads/trip-report-norway-july-2025.491204/'),
      REPORT('Lonely Planet: road-tripping Norway\'s west coast', 'https://www.lonelyplanet.com/articles/winding-through-the-wilds-road-tripping-norways-west-coast'),
    ],
    approximate: 'Main stops; ferry crossings are part of the roads.',
    stops: [
      { q: 'Bergen, Norway', name: 'Bergen', wiki: 'Bryggen', text: 'The wooden wharf of Bryggen, and usually rain.' },
      { q: 'Flåm, Norway', name: 'Flåm', wiki: 'Stegastein', text: 'The Stegastein viewpoint high over the Aurlandsfjord.' },
      { q: 'Sogndal, Norway', name: 'Sognefjord', wiki: 'Sognefjord', text: 'Across Norway\'s longest fjord by ferry.' },
      { q: 'Geiranger, Norway', name: 'Geiranger', wiki: 'Geirangerfjord', text: 'Down the hairpins to the World Heritage fjord; the Eagle Road out.', source: REPORT('UKGSer (2025)', 'https://www.ukgser.com/community/threads/trip-report-norway-july-2025.491204/') },
      { q: 'Trollstigen', name: 'Trollstigen', at: [62.4553, 7.6681], wiki: 'Trollstigen', text: 'Eleven hairpins down a cliff wall, waterfalls alongside.' },
      { q: 'Åndalsnes, Norway', name: 'Åndalsnes', wiki: 'Åndalsnes', text: 'At the foot of the Romsdal mountains.' },
      { q: 'Atlantic Ocean Road', at: [63.0167, 7.35], name: 'Atlantic Road', wiki: 'Atlantic Ocean Road', text: 'Eight bridges hopping between skerries, best in a storm.' },
      { q: 'Kristiansund, Norway', name: 'Kristiansund', wiki: 'Kristiansund', text: 'A fishing town on islands, the end of the coast run.' },
    ],
  },
  {
    id: 'albania-moto',
    title: 'Albania by adventure motorcycle',
    who: 'Classic route · the Accursed Mountains to the Riviera',
    when: 'May–June and September–October',
    vehicle: 'Adventure or enduro motorcycle, 8–10 days',
    kind: 'moto',
    color: '#b91c1c',
    summary: 'From Shkodër into the Albanian Alps at Theth, the Komani lake ferry to Valbona, down through the mountains to the Ottoman stone towns of Berat and Gjirokastër, and over the Llogara pass to the Riviera\'s coves. Dirt tracks, goats, bunkers and a warm welcome.',
    sources: [
      REPORT('Motorrad: Albania, turquoise coasts and mountain roads', 'https://www.motorradonline.de/reise/motorradreise-albanien-tuerkisblaue-kuesten-und-abenteuerliche-bergstrassen/'),
      REPORT('Albanian Riviera motorcycle guide', 'https://himara.pages.dev/blog/albanian-riviera-motorcycle-guide'),
    ],
    approximate: 'A common route; the roads are the router\'s choice.',
    stops: [
      { q: 'Shkodër, Albania', name: 'Shkodër', wiki: 'Shkodër', text: 'Rozafa castle above the lake.' },
      { q: 'Theth, Albania', name: 'Theth', wiki: 'Theth', text: 'Up into the Accursed Mountains to a village of stone towers.' },
      { q: 'Koman, Albania', name: 'Lake Komani', wiki: 'Lake Koman', text: 'A ferry through a fjord-like reservoir (bikes go in summer).' },
      { q: 'Valbona, Albania', name: 'Valbona', by: 'boat', wiki: 'Valbonë Valley National Park', text: 'A green alpine valley.' },
      { q: 'Berat, Albania', name: 'Berat', wiki: 'Berat', text: 'The "city of a thousand windows".' },
      { q: 'Gjirokastër, Albania', name: 'Gjirokastër', wiki: 'Gjirokastër', text: 'A UNESCO Ottoman stone town under a great castle.', source: REPORT('Riviera motorcycle guide', 'https://himara.pages.dev/blog/albanian-riviera-motorcycle-guide') },
      { q: 'Himarë, Albania', name: 'Himarë', wiki: 'Himarë', text: 'Coves on the Ionian Riviera.' },
      { q: 'Llogara Pass', name: 'Llogara Pass', wiki: 'Llogara Pass', text: 'Hairpins up to about 1,027 m, the sea far below.' },
      { q: 'Vlorë, Albania', name: 'Vlorë', wiki: 'Vlorë', text: 'Where Albania declared independence in 1912.' },
    ],
  },
  {
    id: 'mae-hong-son-loop',
    title: 'Mae Hong Son Loop',
    who: 'Classic route · northern Thailand by motorbike',
    when: 'November to February (cool, dry)',
    vehicle: 'Motorbike, 4–7 days',
    kind: 'moto',
    color: '#ea580c',
    summary: 'About 600 km and, it is said, 1,864 curves on Routes 1095 and 108 through the mountains on the Myanmar border: hippie Pai, the Tham Lod cave, misty Mae Hong Son and its lakeside temple, Mae Sariang, and Doi Inthanon, Thailand\'s highest mountain. Use a bigger bike than a 125.',
    sources: [
      REPORT('Backpack Moments: Mae Hong Son Loop, the full guide', 'https://backpackmoments.com/mae-hong-son-loop-full-guide/'),
      REPORT('Nomadasaurus: riding the Mae Hong Son Loop', 'https://www.nomadasaurus.com/mae-hong-son-loop-motorbike-travel-guide/'),
    ],
    approximate: 'The usual anticlockwise loop.',
    stops: [
      { q: 'Chiang Mai, Thailand', name: 'Chiang Mai', wiki: 'Chiang Mai', text: 'Rent a bike in the old city.' },
      { q: 'Pai, Thailand', name: 'Pai', wiki: 'Pai, Thailand', text: '762 curves to a laid-back valley town.' },
      { q: 'Soppong, Thailand', name: 'Tham Lod', wiki: 'Tham Lot', text: 'A river cave of swifts at dusk.' },
      { q: 'Mae Hong Son, Thailand', at: [19.302, 97.9654], name: 'Mae Hong Son', wiki: 'Mae Hong Son', text: 'Temples on a lake and Doi Kong Mu above.', source: REPORT('Backpack Moments', 'https://backpackmoments.com/mae-hong-son-loop-full-guide/') },
      { q: 'Mae Sariang, Thailand', name: 'Mae Sariang', wiki: 'Mae Sariang district', text: 'A quiet riverside town.' },
      { q: 'Doi Inthanon', name: 'Doi Inthanon', wiki: 'Doi Inthanon', text: 'Up to Thailand\'s highest point, 2,565 m.' },
      { q: 'Chiang Mai, Thailand', name: 'Back in Chiang Mai', wiki: 'Wat Phra That Doi Suthep', text: 'Back to the city.' },
    ],
  },
  {
    id: 'blue-ridge-dragon',
    title: 'Blue Ridge Parkway and the Tail of the Dragon',
    who: 'Classic route · the Appalachians by motorcycle',
    when: 'May–June and October (autumn colours)',
    vehicle: 'Motorcycle, 5–7 days',
    kind: 'moto',
    color: '#4d7c0f',
    summary: '469 miles of the slow, beautiful Blue Ridge Parkway along the crest of the Appalachians from Virginia to the Great Smokies, then the Tail of the Dragon at Deals Gap: 318 curves in 11 miles. The Cherohala Skyway nearby is the locals\' favourite. Mind the 15 mph corners.',
    sources: [
      REPORT('Rider Magazine: a father-and-son journey on the Blue Ridge Parkway', 'https://ridermagazine.com/healing-ride-a-father-and-son-journey-on-the-blue-ridge-parkway-and-beyond/'),
      REPORT('Riders Share: Tail of the Dragon, a guide to 318 curves', 'https://www.riders-share.com/blog/article/tail-of-the-dragon'),
    ],
    approximate: 'Main stops along the parkway.',
    stops: [
      { q: 'Waynesboro, Virginia', name: 'Rockfish Gap', wiki: 'Blue Ridge Parkway', text: 'The northern start, milepost 0.' },
      { q: 'Roanoke, Virginia', name: 'Roanoke', wiki: 'Roanoke, Virginia', text: 'The Mill Mountain star above the city.' },
      { q: 'Mabry Mill', name: 'Mabry Mill', wiki: 'Mabry Mill', text: 'An old water mill, one of the most photographed spots on the parkway.' },
      { q: 'Blowing Rock, North Carolina', name: 'Blowing Rock', wiki: 'Linn Cove Viaduct', text: 'The Linn Cove Viaduct curving round Grandfather Mountain.' },
      { q: 'Asheville, North Carolina', name: 'Asheville', wiki: 'Biltmore Estate', text: 'Breweries and the Biltmore estate.' },
      { q: 'Cherokee, North Carolina', at: [35.4743, -83.3149], name: 'Cherokee', wiki: 'Great Smoky Mountains National Park', text: 'The southern end, at the Smokies.', source: REPORT('Rider Magazine', 'https://ridermagazine.com/healing-ride-a-father-and-son-journey-on-the-blue-ridge-parkway-and-beyond/') },
      { q: 'Deals Gap', name: 'Tail of the Dragon', wiki: 'Deals Gap', text: '318 curves in 11 miles on US 129, and the "Tree of Shame".' },
      { q: 'Tellico Plains, Tennessee', name: 'Cherohala Skyway', wiki: 'Cherohala Skyway', text: 'High, sweeping curves through national forest.' },
    ],
  },
  {
    id: 'dalton-highway',
    title: 'Dalton Highway to Prudhoe Bay',
    who: 'Classic route · Alaska\'s Haul Road by motorcycle',
    when: 'June to August',
    vehicle: 'Adventure motorcycle, 4–6 days return',
    kind: 'moto',
    color: '#475569',
    summary: 'The 414-mile road built to supply the Alaska pipeline, from the boreal forest across the Arctic Circle and the Brooks Range by Atigun Pass to the oil fields on the Arctic Ocean. Gravel, calcium-chloride mud, trucks and almost no services: 245 miles with no fuel between Coldfoot and Deadhorse.',
    sources: [
      REPORT('Ray Jardine: 2025 Moto Alaska (July 2025)', 'https://www.rayjardine.com/adventures/2025-07-Moto-Alaska/index.php'),
      REPORT('Freewheelings: how to survive the Dalton Highway by motorcycle', 'https://www.freewheelings.com/how-to-survive-the-dalton-highway-haul-road-by-motorcycle/'),
    ],
    approximate: 'Main stops on the Haul Road.',
    stops: [
      { q: 'Fairbanks, Alaska', name: 'Fairbanks', wiki: 'Fairbanks, Alaska', text: 'Last big town: tyres, fuel cans, food.' },
      { q: 'Livengood, Alaska', name: 'Livengood', wiki: 'Dalton Highway', text: 'The start of the Dalton proper.' },
      { q: 'Yukon River Bridge', name: 'Yukon River', at: [65.8781, -149.7253], wiki: 'E. L. Patton Yukon River Bridge', text: 'A wooden-decked bridge over the Yukon.' },
      { q: 'Arctic Circle, Dalton Highway', name: 'Arctic Circle', at: [66.5578, -150.7956], wiki: 'Arctic Circle', text: 'The sign and photo stop.' },
      { q: 'Coldfoot, Alaska', name: 'Coldfoot', wiki: 'Coldfoot, Alaska', text: 'Truck stop and the last fuel for 245 miles.', source: REPORT('Ray Jardine (2025)', 'https://www.rayjardine.com/adventures/2025-07-Moto-Alaska/index.php') },
      { q: 'Atigun Pass', name: 'Atigun Pass', at: [68.1286, -149.4775], wiki: 'Atigun Pass', text: 'Over the Brooks Range at 4,739 ft, snow possible any month.' },
      { q: 'Deadhorse, Alaska', name: 'Deadhorse', wiki: 'Deadhorse, Alaska', text: 'Across the tundra to the oil field camp by the Arctic Ocean.' },
    ],
  },
  {
    id: 'cape-york',
    title: 'Cape York and the Old Telegraph Track',
    who: 'Classic route · to the tip of Australia by 4x4',
    when: 'June to October (dry season)',
    vehicle: 'Well-prepared 4x4, 2–3 weeks',
    kind: '4x4',
    color: '#c2410c',
    summary: 'North from Cairns past the rock art of Laura into the wild Cape York Peninsula: corrugated red roads, the Old Telegraph Track\'s deep creek crossings and washouts, Fruit Bat and Elliot falls, the Jardine river ferry, and a walk to the northernmost point of mainland Australia. Crocodiles in the water; a bypass road exists.',
    sources: [
      REPORT('Expedition Portal: driving Australia\'s most challenging off-road trail', 'https://expeditionportal.com/driving-australias-most-challenging-off-road-trail/'),
      REPORT('Cooktown and Cape York visitor guide 2025', 'https://www.cooktownandcapeyork.com/files/visitor_guide_2025.pdf'),
    ],
    approximate: 'Main stops; the track is drawn as straight lines where the routers don\'t know it.',
    stops: [
      { q: 'Cairns, Queensland', name: 'Cairns', wiki: 'Cairns', text: 'Last big shop and a check of the vehicle.' },
      { q: 'Cooktown, Queensland', name: 'Cooktown', wiki: 'Cooktown, Queensland', text: 'Where Captain Cook beached the Endeavour in 1770.' },
      { q: 'Laura, Queensland', name: 'Laura', wiki: 'Quinkan rock art', text: 'Ancient Quinkan rock art; the seal ends here.', source: REPORT('Cape York visitor guide 2025', 'https://www.cooktownandcapeyork.com/files/visitor_guide_2025.pdf') },
      { q: 'Coen, Queensland', name: 'Coen', wiki: 'Coen, Queensland', text: 'A tiny town with a pub.' },
      { q: 'Bramwell Junction', name: 'Bramwell Junction', at: [-12.1308, 142.6119], wiki: 'Old Telegraph Track', text: 'Start of the Old Telegraph Track behind the roadhouse.' },
      { q: 'Fruit Bat Falls', name: 'Fruit Bat Falls', at: [-11.7608, 142.4164], route: 'line', wiki: 'Jardine River National Park', text: 'Croc-free swimming at the falls.', source: REPORT('Expedition Portal', 'https://expeditionportal.com/driving-australias-most-challenging-off-road-trail/') },
      { q: 'Jardine River Ferry', name: 'Jardine River', at: [-11.1408, 142.3536], route: 'line', wiki: 'Jardine River', text: 'The ferry over the Jardine, crocodiles below.' },
      { q: 'Bamaga, Queensland', name: 'Bamaga', wiki: 'Bamaga', text: 'The community at the top of the Cape.' },
      { q: 'Cape York, Queensland', name: 'The Tip', at: [-10.6872, 142.5314], route: 'line', wiki: 'Cape York', text: 'A walk over the rocks to the sign at the northernmost point.' },
    ],
  },
  {
    id: 'karakoram-highway',
    title: 'Karakoram Highway',
    who: 'Classic route · Pakistan to the Chinese border',
    when: 'May to October',
    vehicle: 'Car or 4x4 (or motorcycle), 7–10 days',
    kind: 'car',
    color: '#0f766e',
    summary: 'The "eighth wonder of the world": a highway cut through the Karakoram from Islamabad past the Indus gorges, Nanga Parbat and Rakaposhi to the apricot orchards of Hunza, the Passu Cones and the Khunjerab Pass at about 4,700 m. Landslides happen; mountain welcome is famous.',
    sources: [
      REPORT('Tribune: my road trip to Khunjerab and Skardu via the KKH', 'https://tribune.com.pk/article/68892/my-road-trip-to-khunjerab-and-skardu-via-the-engineering-marvel-that-is-the-karakoram-highway'),
      REPORT('South China Morning Post: the KKH\'s ups and downs', 'https://amp.scmp.com/magazines/post-magazine/travel/article/3254603/pakistans-karakoram-highway-ups-and-downs-taking-8th-wonder-world-stunning-views-welcoming-people'),
    ],
    approximate: 'Main stops; the line follows the highway.',
    stops: [
      { q: 'Islamabad, Pakistan', name: 'Islamabad', wiki: 'Faisal Mosque', text: 'The capital under the Margalla hills.' },
      { q: 'Abbottabad, Pakistan', name: 'Abbottabad', wiki: 'Abbottabad', text: 'Pine hills where the KKH begins.' },
      { q: 'Besham, Pakistan', name: 'Besham', wiki: 'Indus River', text: 'Into the deep Indus gorge.' },
      { q: 'Chilas, Pakistan', name: 'Chilas', wiki: 'Rock art and petroglyphs in Gilgit-Baltistan', text: 'Ancient rock carvings by the road; Nanga Parbat views at Raikot.' },
      { q: 'Gilgit, Pakistan', name: 'Gilgit', wiki: 'Gilgit', text: 'Past the meeting of three great ranges.' },
      { q: 'Karimabad, Hunza', name: 'Hunza (Karimabad)', wiki: 'Baltit Fort', text: 'Baltit fort, apricot trees and Rakaposhi across the valley.', source: REPORT('Tribune', 'https://tribune.com.pk/article/68892/my-road-trip-to-khunjerab-and-skardu-via-the-engineering-marvel-that-is-the-karakoram-highway') },
      { q: 'Passu, Pakistan', name: 'Passu', wiki: 'Passu Cones', text: 'The jagged Passu Cones and a famous swaying bridge.' },
      { q: 'Khunjerab Pass', name: 'Khunjerab Pass', wiki: 'Khunjerab Pass', text: 'The border gate with China at about 4,700 m.' },
    ],
  },
  {
    id: 'iceland-highlands-4x4',
    title: 'Iceland\'s Highlands by 4x4',
    who: 'Classic route · the F-roads of the interior',
    when: 'Late June/July to early September, when the F-roads open',
    vehicle: '4x4 (required by law), 7–10 days',
    kind: '4x4',
    color: '#334155',
    summary: 'Through the empty interior on the summer-only F-roads: the coloured rhyolite hills and hot river of Landmannalaugar, the black desert of Sprengisandur between two ice caps, Askja\'s crater lakes, and the geothermal valley of Hveravellir on the Kjölur road. River crossings, no fuel, no shops: check road.is and your rental insurance.',
    sources: [
      REPORT('Guide to Iceland: F-roads, a guide to Icelandic mountain roads', 'https://guidetoiceland.is/best-of-iceland/f-roads-in-iceland-a-guide-to-icelandic-mountain-roads'),
      REPORT('Luxe Adventure Traveler: 9-day Iceland Highlands 4x4 itinerary', 'https://luxeadventuretraveler.com/iceland-highlands-itinerary-the-ultimate-9-day-4x4-adventure/'),
    ],
    approximate: 'Main stops; the F-roads are drawn as straight lines where the routers don\'t know them.',
    stops: [
      { q: 'Reykjavík, Iceland', name: 'Reykjavík', wiki: 'Reykjavík', text: 'Pick up the 4x4 and supplies.' },
      { q: 'Landmannalaugar', name: 'Landmannalaugar', at: [63.9917, -19.0606], wiki: 'Landmannalaugar', text: 'Rhyolite mountains in every colour and a natural hot stream.', source: REPORT('Guide to Iceland', 'https://guidetoiceland.is/best-of-iceland/f-roads-in-iceland-a-guide-to-icelandic-mountain-roads') },
      { q: 'Hrauneyjar', name: 'Hrauneyjar', at: [64.1972, -19.2706], wiki: 'Sprengisandur', text: 'The last fuel before the interior.' },
      { q: 'Nýidalur', name: 'Sprengisandur', at: [64.7353, -18.0711], route: 'line', wiki: 'Sprengisandur', text: 'About 200 km of black desert between Hofsjökull and Vatnajökull.' },
      { q: 'Askja', name: 'Askja', at: [65.0525, -16.7764], route: 'line', wiki: 'Askja', text: 'A caldera with the milky-blue Víti crater lake.' },
      { q: 'Reykjahlíð, Iceland', name: 'Mývatn', wiki: 'Mývatn', text: 'Out to Lake Mývatn and its nature baths.' },
      { q: 'Hveravellir', name: 'Hveravellir', at: [64.8664, -19.5544], route: 'line', wiki: 'Hveravellir', text: 'Back south on the Kjölur road to a geothermal oasis with a hot pool.' },
      { q: 'Gullfoss', name: 'Gullfoss', wiki: 'Gullfoss', text: 'Down to the golden falls and the Golden Circle.' },
      { q: 'Reykjavík, Iceland', name: 'Back in Reykjavík', wiki: 'Hallgrímskirkja', text: 'Return the 4x4, hopefully clean.' },
    ],
  },
  // ---- Batch 7 ----
  {
    id: 'gr20-corsica',
    title: 'GR20, Corsica',
    who: 'Classic route · "Europe\'s toughest trek"',
    when: 'June to September, when the refuges are staffed',
    vehicle: 'On foot, 12–16 days, refuges (no wild camping)',
    kind: 'walk',
    color: '#9a3412',
    summary: 'About 180 km and 12,000 m of climbing along Corsica\'s granite spine from Calenzana to Conca: scrambles with chains, high ridges above the sea, mountain lakes and shepherds\' huts selling cheese. The steep, alpine north ends at Vizzavona, with a train out; the gentler south runs through beech forests.',
    sources: [
      REPORT('Bookatrekking: GR20 stages, difficulty and refuges', 'https://bookatrekking.com/en/blog/gr20-corsica/'),
      REPORT('Much Better Adventures: GR20 guide in 15 stages', 'https://muchbetteradventures.com/magazine/gr20-corsica-guide-15-stages'),
    ],
    approximate: 'Main refuges; the line follows mountain paths where they were found.',
    stops: [
      { q: 'Calenzana, Corsica', name: 'Calenzana', wiki: 'Calenzana', text: 'A long, hot first climb from the village.' },
      { q: 'Refuge d\'Ortu di u Piobbu', at: [42.465, 8.9059], name: 'Ortu di u Piobbu', wiki: 'Monte Cinto', text: 'The first refuge, about 1,570 m.' },
      { q: 'Refuge de Carozzu', name: 'Carozzu', wiki: 'GR 20', text: 'Over the ridge and down past the Spasimata slabs and footbridge.' },
      { q: 'Haut-Asco', name: 'Haut-Asco', wiki: 'Asco', text: 'A ski station under Monte Cinto, Corsica\'s highest peak.' },
      { q: 'Refuge de Ciottulu di i Mori', name: 'Ciottulu di i Mori', wiki: 'Paglia Orba', text: 'Under the Paglia Orba, past the old Cirque de la Solitude.' },
      { q: 'Refuge de Manganu', name: 'Manganu', wiki: 'Lac de Nino', text: 'Past Lac de Nino and its grazing horses.' },
      { q: 'Vizzavona, Corsica', name: 'Vizzavona', wiki: 'Vizzavona', text: 'Halfway, with a train station to Ajaccio and Bastia.', source: REPORT('Much Better Adventures', 'https://muchbetteradventures.com/magazine/gr20-corsica-guide-15-stages') },
      { q: 'Refuge de Prati', name: 'Prati', wiki: 'Monte Renoso', text: 'The gentler south, ridges and beech forest.' },
      { q: 'Refuge d\'Asinau', name: 'Asinau', wiki: 'Monte Incudine', text: 'Over Monte Incudine, 2,134 m.' },
      { q: 'Refuge de Paliri', at: [41.7803, 9.2706], name: 'Paliri', wiki: 'Aiguilles de Bavella', text: 'The red spires of Bavella.' },
      { q: 'Conca, Corsica', name: 'Conca', wiki: 'Conca, Corse-du-Sud', text: 'Down to the village near the sea, the end.' },
    ],
  },
  {
    id: 'kungsleden-north',
    title: 'Kungsleden: Abisko to Nikkaluokta',
    who: 'Classic route · Sweden\'s King\'s Trail through Lapland',
    when: 'Late June to mid-September (midnight sun until late July)',
    vehicle: 'On foot, 5–7 days, mountain huts',
    kind: 'walk',
    color: '#0369a1',
    summary: 'The northern classic of Sweden\'s long trail: from Abisko through birch forest and wide treeless valleys to the Tjäktja pass, then down to the Kebnekaise mountain station with a climb of Sweden\'s highest peak. Reindeer, Sami lands and STF huts with saunas; snow can linger on the pass into July.',
    sources: [
      REPORT('C. Sprague: Kungsleden, a little too fast (July 2025)', 'https://cisprague.github.io/thoughts/kungsleden-2025.html'),
      REPORT('Swedish Tourist Association: Abisko–Nikkaluokta', 'https://www.swedishtouristassociation.com/trails/abisko-nikkaluokta/'),
    ],
    approximate: 'The usual huts; the line follows the trail where it was found.',
    stops: [
      { q: 'Abisko Turiststation', at: [68.3502, 18.83], name: 'Abisko', wiki: 'Abisko National Park', text: 'The start, by the train station and Lake Torneträsk.' },
      { q: 'Abiskojaure', name: 'Abiskojaure', at: [68.2853, 18.5797], route: 'line', wiki: 'Abisko National Park', text: 'Birch forest along the Abiskojåkka river to the first hut.' },
      { q: 'Alesjaure', name: 'Alesjaure', at: [68.1386, 18.4186], route: 'line', wiki: 'Alesjaure', text: 'Wide open valley, a Sami summer village and a hut with a sauna.' },
      { q: 'Tjäktja', name: 'Tjäktja Pass', at: [67.9831, 18.3636], route: 'line', wiki: 'Kungsleden', text: 'The pass at about 1,140 m, often snowy into July.', source: REPORT('C. Sprague (2025)', 'https://cisprague.github.io/thoughts/kungsleden-2025.html') },
      { q: 'Sälka', name: 'Sälka', at: [67.9081, 18.3006], route: 'line', wiki: 'Tjäktjavagge', text: 'Down the long Tjäktjavagge valley.' },
      { q: 'Singi', name: 'Singi', at: [67.8361, 18.3053], route: 'line', wiki: 'Kungsleden', text: 'Where the trail to Kebnekaise leaves the Kungsleden.' },
      { q: 'Kebnekaise Fjällstation', name: 'Kebnekaise', wiki: 'Kebnekaise', text: 'The mountain station, and a long day up Sweden\'s highest peak.' },
      { q: 'Nikkaluokta', name: 'Nikkaluokta', wiki: 'Nikkaluokta', text: 'A boat across Láddjujávri, then the bus to Kiruna.' },
    ],
  },
  {
    id: 'shikoku-henro',
    title: 'Shikoku 88 Temple Pilgrimage',
    who: 'Classic route · Japan\'s henro circuit',
    when: 'March–May and October–November',
    vehicle: 'On foot, 5–8 weeks (or by bike, bus or car)',
    kind: 'walk',
    color: '#be123c',
    summary: 'A loop of about 1,200 km round the island of Shikoku visiting 88 temples linked to the monk Kūkai, walked in white clothes with a sedge hat and staff. Coast roads, mountain temples, Cape Muroto and Cape Ashizuri, and the custom of osettai: gifts from locals to pilgrims. About 25 km a day.',
    sources: [
      REPORT('Notes from a Dadbear: day 56, temples 87 and 88 (June 2025)', 'https://buttondown.com/cpratt/archive/day-56-t87-t88-from-takamatsu'),
      REPORT('Treeline Review: Shikoku 88 Temple Pilgrimage guide', 'https://www.treelinereview.com/where-to-go/shikoku-88-temple-pilgrimage'),
    ],
    approximate: 'Key temples and towns; the line follows roads near the pilgrim route.',
    stops: [
      { q: 'Ryōzen-ji, Naruto', name: 'Temple 1: Ryōzen-ji', wiki: 'Ryōzen-ji', text: 'Most henro start here, buying their white clothes and stamp book.' },
      { q: 'Shōsan-ji, Kamiyama', name: 'Temple 12: Shōsan-ji', wiki: 'Shōsan-ji', text: 'The "henro korogashi", the first steep mountain temple.' },
      { q: 'Cape Muroto', name: 'Cape Muroto', wiki: 'Cape Muroto', text: 'A long coast walk to the cape where Kūkai is said to have found enlightenment.' },
      { q: 'Kōchi, Japan', name: 'Kōchi', wiki: 'Kōchi Castle', text: 'Kōchi\'s castle and Sunday market.' },
      { q: 'Cape Ashizuri', name: 'Cape Ashizuri', wiki: 'Cape Ashizuri', text: 'The southern tip, temple 38 among camellias.' },
      { q: 'Uwajima, Japan', name: 'Uwajima', wiki: 'Uwajima', text: 'Into Ehime prefecture.' },
      { q: 'Matsuyama, Japan', name: 'Matsuyama', wiki: 'Dōgo Onsen', text: 'Dōgo Onsen, one of Japan\'s oldest hot springs.' },
      { q: 'Unpen-ji', at: [34.0351, 133.7229], name: 'Temple 66: Unpen-ji', wiki: 'Unpen-ji', text: 'The highest temple, about 900 m.' },
      { q: 'Ōkubo-ji', name: 'Temple 88: Ōkubo-ji', wiki: 'Ōkubo-ji', text: 'The last temple, where pilgrims leave their staffs.', source: REPORT('Notes from a Dadbear (2025)', 'https://buttondown.com/cpratt/archive/day-56-t87-t88-from-takamatsu') },
    ],
  },
  {
    id: 'at-smokies',
    title: 'Appalachian Trail through the Smokies',
    who: 'Classic route · the A.T.\'s highest section',
    when: 'April–June and September–October',
    vehicle: 'On foot, 5–7 days, shelters (permit needed)',
    kind: 'walk',
    color: '#15803d',
    summary: 'About 70 miles of the Appalachian Trail along the crest of Great Smoky Mountains National Park, from Fontana Dam over Clingmans Dome (Kuwohi), the trail\'s highest point at 6,643 ft, to Davenport Gap. Misty ridges, bald meadows, black bears and shelters. Hurricane damage closed the trail north of Davenport Gap in 2025: check the ATC.',
    sources: [
      REPORT('ATC: Davenport Gap and I-40 area damage (2025 updates)', 'https://appalachiantrail.org/trail-updates/davenport-gap-i-40-area-damage/'),
      REPORT('Friends of the Smokies: ridgerunners on the A.T., 2025', 'https://friendsofthesmokies.org/blog/ridgerunners-on-appalachian-trail-gsmnp-2025/'),
    ],
    approximate: 'Main points; the line follows the trail where it was found.',
    stops: [
      { q: 'Fontana Dam', name: 'Fontana Dam', wiki: 'Fontana Dam', text: 'Across the dam into the park, the "Fontana Hilton" shelter behind.' },
      { q: 'Spence Field', name: 'Spence Field', at: [35.5642, -83.7375], route: 'line', wiki: 'Thunderhead Mountain', text: 'A grassy bald with views, under Thunderhead.' },
      { q: 'Clingmans Dome', name: 'Clingmans Dome (Kuwohi)', wiki: 'Clingmans Dome', text: 'The highest point of the whole A.T., with an observation tower.' },
      { q: 'Newfound Gap', at: [35.6111, -83.425], name: 'Newfound Gap', wiki: 'Newfound Gap', text: 'The road across the park, and the halfway point.' },
      { q: 'Charlies Bunion', name: 'Charlies Bunion', at: [35.6367, -83.3753], route: 'line', wiki: 'Charlies Bunion', text: 'A bare rock outcrop with huge views.' },
      { q: 'Cosby Knob Shelter', name: 'Cosby Knob', at: [35.7389, -83.1814], route: 'line', wiki: 'Great Smoky Mountains National Park', text: 'Down the long northern ridge.' },
      { q: 'Davenport Gap', name: 'Davenport Gap', wiki: 'Davenport Gap', text: 'The park\'s north end, near I-40; the trail beyond was damaged in 2025.', source: REPORT('ATC trail update', 'https://appalachiantrail.org/trail-updates/davenport-gap-i-40-area-damage/') },
    ],
  },
  {
    id: 'velodyssee-bordeaux-hendaye',
    title: 'La Vélodyssée: Bordeaux to San Sebastián',
    who: 'Classic route · EuroVelo 1 along the Atlantic',
    when: 'May to October',
    vehicle: 'Any bike, 6–9 days',
    kind: 'bike',
    color: '#0891b2',
    summary: 'From Bordeaux\'s wine country to the coast at Lacanau, then south on traffic-free paths through the pine forests of the Landes behind the surf beaches, past the Dune du Pilat, to Biarritz, Saint-Jean-de-Luz and over the border to San Sebastián. Flat, well signed, and EuroVelo-certified since 2024.',
    sources: [
      REPORT('La Vélodyssée: 2025 press kit', 'https://www.lavelodyssee.com/sites/velodyssee/files/inline-files/DP-2025-la-velodyssee.pdf'),
      REPORT('Tourisme Landes: La Vélodyssée in the Landes', 'https://www.tourismelandes.com/?p=78151'),
    ],
    approximate: 'Main stops; the line follows cycle paths near the coast.',
    stops: [
      { q: 'Bordeaux, France', name: 'Bordeaux', wiki: 'Bordeaux', text: 'The Place de la Bourse and its water mirror.' },
      { q: 'Lacanau-Océan', name: 'Lacanau', wiki: 'Lacanau', text: 'A forest cycle path to the surf coast.' },
      { q: 'Arcachon, France', name: 'Arcachon', wiki: 'Dune of Pilat', text: 'The oyster bay and Europe\'s tallest sand dune.' },
      { q: 'Biscarrosse, France', name: 'Biscarrosse', wiki: 'Biscarrosse', text: 'Into the Landes: 160 km of paths through pine forest.', source: REPORT('Tourisme Landes', 'https://www.tourismelandes.com/?p=78151') },
      { q: 'Mimizan, France', name: 'Mimizan', wiki: 'Mimizan', text: 'Lakes and beaches behind the dunes.' },
      { q: 'Hossegor, France', name: 'Hossegor', wiki: 'Soorts-Hossegor', text: 'A world-famous surf town.' },
      { q: 'Bayonne, France', name: 'Bayonne', wiki: 'Bayonne', text: 'Into the Basque Country, ham and chocolate.' },
      { q: 'Saint-Jean-de-Luz', name: 'Saint-Jean-de-Luz', wiki: 'Saint-Jean-de-Luz', text: 'A fishing port of red-and-white Basque houses.' },
      { q: 'Hendaye, France', name: 'Hendaye', wiki: 'Hendaye', text: 'The end of the Vélodyssée at the border.' },
      { q: 'San Sebastián, Spain', name: 'San Sebastián', wiki: 'La Concha', text: 'Over the hills to La Concha bay and pintxos bars.' },
    ],
  },
  {
    id: 'ecopista-do-dao',
    title: 'Ecopista do Dão',
    who: 'Classic route · Portugal\'s railway path, family-friendly',
    when: 'All year (spring and autumn best)',
    vehicle: 'Any bike, 1–2 days',
    kind: 'bike',
    color: '#16a34a',
    summary: 'About 49 km of paved path on the old Dão railway line between Viseu, Tondela and Santa Comba Dão, opened in 2011: gentle gradients, pine woods and vineyards, old stations, and colour-coded surfaces by municipality. It now links with the Ecopista do Vouga for 114 km without traffic.',
    sources: [
      REPORT('e-konomista: ecopistas em Portugal para pedalar em família', 'https://www.e-konomista.pt/ecopistas-portugal-pedalar-em-familia/'),
      REPORT('Echoboomer: Ecopista do Vouga inaugurada, ligação ao Dão', 'https://echoboomer.pt/ecopista-do-vouga-foi-inaugurada'),
    ],
    approximate: 'The old railway stations along the path.',
    stops: [
      { q: 'Viseu, Portugal', name: 'Viseu', wiki: 'Viseu', text: 'A granite cathedral town and the north end (red path).' },
      { q: 'Torredeita, Viseu', name: 'Torredeita', wiki: 'Viseu', text: 'Through pine woods on a gentle gradient.' },
      { q: 'Tondela, Portugal', name: 'Tondela', wiki: 'Tondela', text: 'The middle (green path); a bike station for washing and repairs.', source: REPORT('e-konomista', 'https://www.e-konomista.pt/ecopistas-portugal-pedalar-em-familia/') },
      { q: 'Treixedo, Santa Comba Dão', name: 'Treixedo', wiki: 'Santa Comba Dão', text: 'Fewer cafés on this stretch: bring water.' },
      { q: 'Santa Comba Dão, Portugal', name: 'Santa Comba Dão', wiki: 'Santa Comba Dão', text: 'The south end (blue path), by the Dão and Mondego rivers.' },
    ],
  },
  {
    id: 'alentejo-coast-bike',
    title: 'Bikepacking the Alentejo coast: Lisbon to Sagres',
    who: 'Classic route · Portugal\'s wild south-west by bike',
    when: 'March–June and September–November',
    vehicle: 'Gravel or touring bike, 5–7 days',
    kind: 'bike',
    color: '#ca8a04',
    summary: 'From Lisbon across the Tagus and down the Atlantic edge of the Alentejo: Comporta\'s rice fields and storks, the sandy tracks and cliffs of the Vicentine Coast Natural Park, fishing villages like Vila Nova de Milfontes and Zambujeira, surf beaches near Aljezur, and the cape at Sagres. Plan 50–70 km a day.',
    sources: [
      REPORT('Cycloscope: the best self-guided bike tours in Portugal', 'https://cycloscope.net/?p=25964'),
      REPORT('Mute Life: bikepacking to Lagos', 'https://mutelife.com/2023/04/bikepacking-to-lagos'),
    ],
    approximate: 'Main stops; the line follows back roads and tracks near the coast.',
    stops: [
      { q: 'Lisbon, Portugal', name: 'Lisbon', wiki: 'Lisbon', text: 'The ferry from Cais do Sodré to Seixal or Cacilhas.' },
      { q: 'Setúbal, Portugal', name: 'Setúbal', wiki: 'Setúbal', text: 'Over the Arrábida hills, then the Troia ferry.' },
      { q: 'Comporta, Portugal', name: 'Comporta', wiki: 'Comporta', text: 'Rice fields, storks\' nests and empty beaches.' },
      { q: 'Sines, Portugal', name: 'Sines', wiki: 'Sines', text: 'Vasco da Gama\'s birthplace.' },
      { q: 'Vila Nova de Milfontes, Portugal', name: 'Vila Nova de Milfontes', wiki: 'Vila Nova de Milfontes', text: 'Into the natural park, the Mira estuary.' },
      { q: 'Zambujeira do Mar, Portugal', name: 'Zambujeira do Mar', wiki: 'Zambujeira do Mar', text: 'Cliffs and white houses.' },
      { q: 'Aljezur, Portugal', name: 'Aljezur', wiki: 'Aljezur', text: 'Into the Algarve, surf beaches at Arrifana and Monte Clérigo.', source: REPORT('Cycloscope', 'https://cycloscope.net/?p=25964') },
      { q: 'Sagres, Portugal', name: 'Sagres', wiki: 'Sagres, Portugal', text: 'The fortress and Cape St Vincent, the end of Europe.' },
    ],
  },
  {
    id: 'pyrenees-sea-to-sea',
    title: 'The Pyrenees sea to sea by bike',
    who: 'Classic route · Atlantic to Mediterranean over the cols',
    when: 'June to September',
    vehicle: 'Road or gravel bike, 8–12 days',
    kind: 'bike',
    color: '#be185d',
    summary: 'The Raid Pyrénéen line from Hendaye on the Atlantic to Collioure on the Mediterranean: the Tour de France\'s legendary cols — Aubisque, Tourmalet, Aspin, Peyresourde — through the Basque Country, Béarn and the Ariège to the vineyards of Catalonia. About 750 km and 15,000 m of climbing.',
    sources: [
      REPORT('Mariposa Bicycles: Raid Pyrénéen, more than a crossing', 'https://mariposabicycles.ca/blogs/features/raid-pyreneen-much-more-than-a-crossing'),
      REPORT('La Rebenne: crossing the Pyrenees by bike, the Orientale', 'https://res.cloudinary.com/larebenne/image/upload/v1766276615/Crossing_the_Pyrenees_by_bike_The_Orientale_772dbee1f7.pdf'),
    ],
    approximate: 'Main cols and towns; the roads are the router\'s choice.',
    stops: [
      { q: 'Hendaye, France', name: 'Hendaye', wiki: 'Hendaye', text: 'Wheels dipped in the Atlantic.' },
      { q: 'Saint-Jean-Pied-de-Port', name: 'Saint-Jean-Pied-de-Port', wiki: 'Saint-Jean-Pied-de-Port', text: 'The Camino town, through Basque hills.' },
      { q: 'Col d\'Aubisque', name: 'Col d\'Aubisque', wiki: 'Col d\'Aubisque', text: 'Cows and a cliff-side road to 1,709 m.' },
      { q: 'Col du Tourmalet', name: 'Col du Tourmalet', wiki: 'Col du Tourmalet', text: 'The most-climbed pass in Tour history, 2,115 m.', source: REPORT('Mariposa Bicycles', 'https://mariposabicycles.ca/blogs/features/raid-pyreneen-much-more-than-a-crossing') },
      { q: 'Col d\'Aspin', name: 'Col d\'Aspin', wiki: 'Col d\'Aspin', text: 'Short and beautiful.' },
      { q: 'Bagnères-de-Luchon', name: 'Luchon', wiki: 'Bagnères-de-Luchon', text: 'Over the Peyresourde to a spa town.' },
      { q: 'Ax-les-Thermes', name: 'Ax-les-Thermes', wiki: 'Ax-les-Thermes', text: 'Through the Ariège\'s quieter cols.' },
      { q: 'Prades, Pyrénées-Orientales', name: 'Prades', wiki: 'Canigou', text: 'Under Mount Canigou, into Catalonia.' },
      { q: 'Collioure, France', name: 'Collioure', wiki: 'Collioure', text: 'The painters\' harbour on the Mediterranean.' },
    ],
  },
  {
    id: 'transalp-mtb',
    title: 'Transalp by mountain bike: Garmisch to Lake Garda',
    who: 'Classic route · crossing the Alps on dirt',
    when: 'July to September',
    vehicle: 'Mountain bike, 5–7 days',
    kind: 'bike',
    color: '#4338ca',
    summary: 'The classic Alpencross from the Zugspitze to the palms of Lake Garda: about 350 km and 6–7,000 m of climbing on forest roads and trails through Tyrol, over the Reschen pass, down the Val Venosta\'s apple orchards, past Merano and the Dolomites\' edge to Riva. Hotels and a shuttle back.',
    sources: [
      REPORT('Bergwelten: from Garmisch to Lake Garda on two routes', 'https://www.bergwelten.com/a/von-garmisch-an-den-gardasee-im-twin-konzept-auf-zwei-verschiedenen-routen-an-den-lago'),
      REPORT('Outdoor Magazin: Alpencross by bike from Garmisch to Riva', 'https://www.outdoor-magazin.com/service/touren-planung/alpencross-mit-dem-fahrrad-von-garmisch-nach-riva.794077.3.htm'),
    ],
    approximate: 'Main stage towns; the line follows cycle routes and tracks near the line shown.',
    stops: [
      { q: 'Garmisch-Partenkirchen', name: 'Garmisch-Partenkirchen', wiki: 'Garmisch-Partenkirchen', text: 'Under the Zugspitze, the start.' },
      { q: 'Ehrwald, Austria', name: 'Ehrwald', wiki: 'Ehrwald', text: 'Into Tyrol.' },
      { q: 'Imst, Austria', name: 'Imst', wiki: 'Imst', text: 'Over the Fernpass to the Inn valley.' },
      { q: 'Nauders, Austria', name: 'Nauders', wiki: 'Reschen Pass', text: 'Up the Inn to the Reschen pass and the drowned church tower in the lake.' },
      { q: 'Merano, Italy', name: 'Merano', wiki: 'Vinschgau', text: 'Down the Val Venosta\'s apple orchards.', source: REPORT('Bergwelten', 'https://www.bergwelten.com/a/von-garmisch-an-den-gardasee-im-twin-konzept-auf-zwei-verschiedenen-routen-an-den-lago') },
      { q: 'Caldaro sulla Strada del Vino', name: 'Caldaro', wiki: 'Lake Kaltern', text: 'The wine road and its lake.' },
      { q: 'Andalo, Italy', name: 'Andalo', wiki: 'Brenta Group', text: 'Under the Brenta Dolomites.' },
      { q: 'Riva del Garda', name: 'Riva del Garda', wiki: 'Lake Garda', text: 'Down to the lake and an ice cream.' },
    ],
  },
  {
    id: 'trans-dinarica-bike',
    title: 'Trans Dinarica by bike: Ljubljana to Kotor',
    who: 'Classic route · the Western Balkans\' new cycling trail',
    when: 'May–June and September–October',
    vehicle: 'Gravel or touring bike, 3–4 weeks',
    kind: 'bike',
    color: '#0e7490',
    summary: 'A slice of the 2024 Trans Dinarica cycling route across eight countries: from Ljubljana through Slovenia\'s karst and Croatia\'s Plitvice lakes, the Bosnian highlands, Sarajevo and Mostar\'s bridge, to the fjord-like Bay of Kotor. Gravel, quiet asphalt, no signposts yet: use the official route data.',
    sources: [
      REPORT('Epic Road Rides: Trans Dinarica in Slovenia (July 2025)', 'https://epicroadrides.com/cycling-blog/trans-dinarica-bike-touring-in-slovenia/'),
      REPORT('Rouleur: making a 3,364 km route across eight countries', 'https://rouleur.cc/blogs/rouleur-explore/what-goes-into-making-a-3-364km-cycle-route-across-eight-countries'),
    ],
    approximate: 'Main towns; the route is not signposted and the line is a guide only.',
    stops: [
      { q: 'Ljubljana, Slovenia', name: 'Ljubljana', wiki: 'Ljubljana', text: 'Slovenia\'s green little capital.' },
      { q: 'Postojna, Slovenia', name: 'Postojna', wiki: 'Postojna Cave', text: 'Karst caves and forests.', source: REPORT('Epic Road Rides (2025)', 'https://epicroadrides.com/cycling-blog/trans-dinarica-bike-touring-in-slovenia/') },
      { q: 'Plitvice Lakes', name: 'Plitvice Lakes', wiki: 'Plitvice Lakes National Park', text: 'Turquoise lakes stepped down by waterfalls.' },
      { q: 'Bihać, Bosnia and Herzegovina', name: 'Bihać', wiki: 'Una National Park', text: 'Into Bosnia by the Una river.' },
      { q: 'Jajce, Bosnia and Herzegovina', name: 'Jajce', wiki: 'Jajce', text: 'A waterfall in the middle of town.' },
      { q: 'Sarajevo, Bosnia and Herzegovina', name: 'Sarajevo', wiki: 'Sarajevo', text: 'East meets West in the old bazaar.' },
      { q: 'Mostar, Bosnia and Herzegovina', name: 'Mostar', wiki: 'Stari Most', text: 'The rebuilt Old Bridge and its divers.' },
      { q: 'Trebinje, Bosnia and Herzegovina', name: 'Trebinje', wiki: 'Trebinje', text: 'Plane trees and Herzegovina wine.' },
      { q: 'Kotor, Montenegro', name: 'Kotor', wiki: 'Bay of Kotor', text: 'Down to the walled town at the end of the bay.' },
    ],
  },
  {
    id: 'shimanami-kaido',
    title: 'Shimanami Kaido',
    who: 'Classic route · Japan\'s island-hopping bike path',
    when: 'March–May and October–November',
    vehicle: 'Any bike (rental), 1–2 days',
    kind: 'bike',
    color: '#0284c7',
    summary: 'About 70 km over the Seto Inland Sea on bridges linking six islands between Onomichi in Hiroshima and Imabari in Shikoku: a blue line painted on the road, citrus groves, temples, salt-making and a dedicated cycle lane on every bridge. Rent a bike at one end, drop it at the other.',
    sources: [
      REPORT('Cycling Mum Japan: Shimanami Kaido (October 2025)', 'https://cyclingmumjapan.blogspot.com/2025/10/shimanami-kaido.html'),
      REPORT('i-tan: cycling islands, Shimanami Kaido (March 2025)', 'https://i-tan.blogspot.com/2025/04/cycling-islands.html'),
    ],
    approximate: 'The islands along the route.',
    stops: [
      { q: 'Onomichi, Japan', name: 'Onomichi', wiki: 'Onomichi', text: 'A temple town on a hill; a 5-minute ferry to the first island.' },
      { q: 'Mukaishima, Onomichi', name: 'Mukaishima', wiki: 'Mukaishima', text: 'The first island.' },
      { q: 'Innoshima, Onomichi', name: 'Innoshima', wiki: 'Innoshima', text: 'Over a bridge with a cycle deck under the road.', source: REPORT('i-tan (2025)', 'https://i-tan.blogspot.com/2025/04/cycling-islands.html') },
      { q: 'Ikuchijima', name: 'Ikuchijima', wiki: 'Ikuchijima', text: 'Lemon groves and the extravagant Kōsan-ji temple.' },
      { q: 'Ōmishima', name: 'Ōmishima', wiki: 'Ōyamazumi Shrine', text: 'The ancient Ōyamazumi shrine, full of samurai armour.' },
      { q: 'Hakatajima', name: 'Hakatajima', wiki: 'Hakatajima', text: 'Salt pans and quiet beaches.' },
      { q: 'Ōshima, Imabari', name: 'Ōshima', wiki: 'Kurushima Strait', text: 'The fierce whirlpools of the Kurushima strait.' },
      { q: 'Imabari, Japan', name: 'Imabari', wiki: 'Kurushima-Kaikyō Bridge', text: 'Across the world\'s first triple suspension bridge to Shikoku.' },
    ],
  },
  {
    id: 'mekong-bike',
    title: 'The Mekong by bike: Vientiane to Phnom Penh',
    who: 'Classic route · Laos and Cambodia along the river',
    when: 'November to February (dry and cooler)',
    vehicle: 'Touring bike, 2–3 weeks',
    kind: 'bike',
    color: '#ea580c',
    summary: 'Down the Mekong from Laos\'s sleepy capital through riverside villages and temples, the Khmer ruins of Wat Phou, the coffee plateau near Pakse, the 4000 Islands with their waterfalls, across into Cambodia to see Irrawaddy dolphins at Kratie, and on to Phnom Penh. Flat, hot and friendly.',
    sources: [
      REPORT('Cycloscope: cycling Cambodia, Phnom Penh to the Lao border', 'https://cycloscope.net/cycling-cambodia-phnom-penh-lao-border-kampong-cham-kratie-stung-treng/'),
      REPORT('Exo Travel: cycling southern Laos islands', 'https://www.exotravel.com/tours/laos/cycling-southern-laos-islands-to-siem-reap/'),
    ],
    approximate: 'Main towns; the roads are the router\'s choice.',
    stops: [
      { q: 'Vientiane, Laos', name: 'Vientiane', wiki: 'Vientiane', text: 'Golden stupas and baguettes by the river.' },
      { q: 'Paksan, Laos', name: 'Paksan', wiki: 'Paksan', text: 'Rice fields along Route 13.' },
      { q: 'Thakhek, Laos', name: 'Thakhek', wiki: 'Thakhek', text: 'Limestone karst on the horizon.' },
      { q: 'Savannakhet, Laos', name: 'Savannakhet', wiki: 'Savannakhet', text: 'A faded French colonial town.' },
      { q: 'Pakse, Laos', name: 'Pakse', wiki: 'Bolaven Plateau', text: 'Gateway to the coffee plantations of the Bolaven plateau.' },
      { q: 'Champasak, Laos', name: 'Wat Phou', wiki: 'Vat Phou', text: 'A Khmer temple older than Angkor Wat.' },
      { q: 'Don Det, Laos', name: '4000 Islands', wiki: 'Si Phan Don', text: 'Hammocks, the Khone falls and the river\'s widest point.' },
      { q: 'Stung Treng, Cambodia', name: 'Stung Treng', wiki: 'Stung Treng', text: 'Over the border into Cambodia.' },
      { q: 'Kratié, Cambodia', name: 'Kratie', wiki: 'Kratié', text: 'Rare Irrawaddy dolphins in the river.', source: REPORT('Cycloscope', 'https://cycloscope.net/cycling-cambodia-phnom-penh-lao-border-kampong-cham-kratie-stung-treng/') },
      { q: 'Kampong Cham, Cambodia', name: 'Kampong Cham', wiki: 'Kampong Cham', text: 'A bamboo bridge to an island.' },
      { q: 'Phnom Penh, Cambodia', name: 'Phnom Penh', wiki: 'Phnom Penh', text: 'The Royal Palace where the Mekong meets the Tonlé Sap.' },
    ],
  },
  {
    id: 'cabot-trail-bike',
    title: 'Cabot Trail by bike',
    who: 'Classic route · Cape Breton Island, Nova Scotia',
    when: 'June to early October (autumn colours late September)',
    vehicle: 'Road or touring bike, 4–6 days',
    kind: 'bike',
    color: '#be123c',
    summary: 'A 298 km loop round the northern tip of Cape Breton: Acadian villages at Chéticamp, the big climbs of French and MacKenzie mountains in the highlands national park, the Gulf of St Lawrence below, Cape North, Ingonish beaches, and Baddeck on the Bras d\'Or lakes. Fiddles and lobster at night.',
    sources: [
      REPORT('CCCTS: Maritimes cycling and camping tour, July 2025', 'https://cccts.org/?p=25092'),
      REPORT('Hike Bike Travel: cycling the Cabot Trail', 'https://hikebiketravel.com/cycling-the-cabot-trail-on-cape-breton-island'),
    ],
    approximate: 'The loop, anticlockwise.',
    stops: [
      { q: 'Baddeck, Nova Scotia', name: 'Baddeck', wiki: 'Baddeck, Nova Scotia', text: 'Alexander Graham Bell\'s summer town; leave the car here.' },
      { q: 'Margaree Forks', name: 'Margaree', wiki: 'Margaree River', text: 'Salmon river valley.' },
      { q: 'Chéticamp, Nova Scotia', name: 'Chéticamp', wiki: 'Chéticamp', text: 'An Acadian fishing village, hooked rugs.' },
      { q: 'Pleasant Bay, Nova Scotia', name: 'Pleasant Bay', wiki: 'Cape Breton Highlands National Park', text: 'Over French and MacKenzie mountains; whales offshore.', source: REPORT('Hike Bike Travel', 'https://hikebiketravel.com/cycling-the-cabot-trail-on-cape-breton-island') },
      { q: 'Cape North, Nova Scotia', name: 'Cape North', wiki: 'Cape North, Nova Scotia', text: 'Over North Mountain, the toughest climb.' },
      { q: 'Ingonish, Nova Scotia', name: 'Ingonish', wiki: 'Ingonish, Nova Scotia', text: 'Beaches and the Keltic Lodge.' },
      { q: 'Englishtown, Nova Scotia', name: 'Englishtown', wiki: 'St. Anns Bay', text: 'A small ferry and the Gaelic college.' },
      { q: 'Baddeck, Nova Scotia', name: 'Back in Baddeck', wiki: 'Bras d\'Or Lake', text: 'The loop closed by the lakes.' },
    ],
  },
  {
    id: 'gap-co-canal',
    title: 'Great Allegheny Passage and C&O Canal',
    who: 'Classic route · Pittsburgh to Washington DC traffic-free',
    when: 'April to October',
    vehicle: 'Hybrid, gravel or touring bike, 5–7 days',
    kind: 'bike',
    color: '#334155',
    summary: 'About 335 miles without cars: the Great Allegheny Passage rail trail over the Eastern Continental Divide to Cumberland, then the old C&O canal towpath down the Potomac past lock houses, Paw Paw tunnel and Harpers Ferry to Georgetown. Smooth on the GAP, rougher and muddier on the towpath.',
    sources: [
      REPORT('Softwhere: GAP and C&O trip logistics and gear (October 2025)', 'https://blog.softwhere.org/2025/10/05/gap-co-trip-logistics-gear'),
      REPORT('NPS: bike the C&O Canal towpath', 'https://www.nps.gov/thingstodo/bike-the-c-o-canal-towpath.htm'),
    ],
    approximate: 'Main towns; the line follows the trails.',
    stops: [
      { q: 'Point State Park, Pittsburgh', name: 'Pittsburgh', wiki: 'Point State Park', text: 'Mile 0 at the fountain where three rivers meet.' },
      { q: 'Ohiopyle, Pennsylvania', name: 'Ohiopyle', wiki: 'Ohiopyle State Park', text: 'Waterfalls and rafting on the Youghiogheny.' },
      { q: 'Meyersdale, Pennsylvania', name: 'Meyersdale', wiki: 'Salisbury Viaduct', text: 'The Salisbury viaduct, then the Eastern Continental Divide.' },
      { q: 'Cumberland, Maryland', name: 'Cumberland', wiki: 'Cumberland, Maryland', text: 'The GAP ends; mile 184 of the C&O towpath starts.', source: REPORT('Softwhere (2025)', 'https://blog.softwhere.org/2025/10/05/gap-co-trip-logistics-gear') },
      { q: 'Paw Paw Tunnel', name: 'Paw Paw Tunnel', at: [39.5503, -78.4597], wiki: 'Paw Paw Tunnel', text: 'A 3,118 ft canal tunnel: walk your bike with a light.' },
      { q: 'Hancock, Maryland', name: 'Hancock', wiki: 'Hancock, Maryland', text: 'A paved rail trail runs alongside here.' },
      { q: 'Harpers Ferry, West Virginia', name: 'Harpers Ferry', wiki: 'Harpers Ferry, West Virginia', text: 'Where the Shenandoah meets the Potomac.' },
      { q: 'Great Falls, Maryland', name: 'Great Falls', wiki: 'Great Falls (Potomac River)', text: 'The Potomac\'s wildest rapids.' },
      { q: 'Georgetown, Washington DC', name: 'Georgetown', wiki: 'Georgetown (Washington, D.C.)', text: 'Mile 0 of the towpath in the capital.' },
    ],
  },
  {
    id: 'picos-de-europa-moto',
    title: 'Picos de Europa and Cantabria by motorcycle',
    who: 'Classic route · northern Spain\'s mountain roads',
    when: 'May to October',
    vehicle: 'Motorcycle, 4–6 days',
    kind: 'moto',
    color: '#4d7c0f',
    summary: 'Limestone peaks a few kilometres from the Bay of Biscay: the Desfiladero de la Hermida gorge to Potes, the cable car at Fuente Dé, the San Glorio and Pontón passes, the Sella gorge, Cangas de Onís and the glacial lakes of Covadonga. Cider, cheese and cool green valleys.',
    sources: [
      REPORT('MyRoute: Picos de Europa round trip from Potes (2025)', 'https://www.myrouteapp.com/en/info/route/1557439'),
      REPORT('Wheelworld: from the Picos to the Pyrenees by motorcycle', 'https://www.wheelworldreviews.co.uk/?p=19302'),
    ],
    approximate: 'A common loop; the roads are the router\'s choice.',
    stops: [
      { q: 'Santander, Spain', name: 'Santander', wiki: 'Santander, Spain', text: 'Off the ferry from Britain, or the start.' },
      { q: 'Panes, Asturias', name: 'La Hermida gorge', wiki: 'Desfiladero de La Hermida', text: 'A 21 km gorge between sheer walls.' },
      { q: 'Potes, Spain', name: 'Potes', wiki: 'Potes', text: 'A stone village of bridges and towers.' },
      { q: 'Fuente Dé', name: 'Fuente Dé', wiki: 'Fuente Dé', text: 'A cable car up an 800 m wall.', source: REPORT('Wheelworld', 'https://www.wheelworldreviews.co.uk/?p=19302') },
      { q: 'Puerto de San Glorio', name: 'San Glorio Pass', wiki: 'Puerto de San Glorio', text: 'Up to about 1,600 m, views all round.' },
      { q: 'Riaño, Spain', name: 'Riaño', wiki: 'Riaño', text: 'A reservoir among peaks.' },
      { q: 'Puerto del Pontón', name: 'Pontón Pass', wiki: 'Desfiladero de los Beyos', text: 'Down the Los Beyos gorge to Asturias.' },
      { q: 'Cangas de Onís', name: 'Cangas de Onís', wiki: 'Cangas de Onís', text: 'The Roman bridge, and cider poured from on high.' },
      { q: 'Lagos de Covadonga', name: 'Lakes of Covadonga', wiki: 'Lakes of Covadonga', text: 'Past the cave shrine up to two glacial lakes.' },
    ],
  },
  {
    id: 'thakhek-loop',
    title: 'Thakhek Loop, Laos',
    who: 'Classic route · central Laos by motorbike',
    when: 'November to April (dry season)',
    vehicle: 'Scooter or semi-auto motorbike, 3–4 days',
    kind: 'moto',
    color: '#c2410c',
    summary: 'A loop of 350–450 km from Thakhek through limestone karst: caves with Buddhas and swimming holes, the drowned forest of the Nakai reservoir, the twisty climb past Lak Sao, and Kong Lor, a 7 km cave you cross by boat on an underground river. Basic guesthouses, dusty roads.',
    sources: [
      REPORT('Nomadasaurus: the Thakhek loop', 'https://www.nomadasaurus.com/?p=1136'),
      REPORT('GT-Rider: the Thakhek loop complete round-up', 'https://www.gt-rider.com/se-asia-motorcycling/topic/the-thakhek-loop-complete-roundup'),
    ],
    approximate: 'The usual anticlockwise loop.',
    stops: [
      { q: 'Thakhek, Laos', name: 'Thakhek', wiki: 'Thakhek', text: 'Rent a bike by the Mekong.' },
      { q: 'Tham Xiang Liap', name: 'Karst caves', at: [17.5203, 104.9131], wiki: 'Khammouane Province', text: 'Caves and swimming holes along Route 12.' },
      { q: 'Nakai, Laos', name: 'Nakai', wiki: 'Nam Theun 2 Dam', text: 'A plateau and a reservoir full of dead trees.' },
      { q: 'Lak Sao, Laos', name: 'Lak Sao', wiki: 'Lak Sao', text: 'A frontier town near Vietnam.' },
      { q: 'Na Hin, Laos', name: 'Na Hin', wiki: 'Khammouane Province', text: 'Down the twisting Route 8 with karst views.' },
      { q: 'Kong Lor, Laos', name: 'Kong Lor', wiki: 'Kong Lor cave', text: 'A boat through a 7 km cave on the Hinboun river.', source: REPORT('Nomadasaurus', 'https://www.nomadasaurus.com/?p=1136') },
      { q: 'Thakhek, Laos', name: 'Back in Thakhek', wiki: 'Mekong', text: 'Back on Route 13.' },
    ],
  },
  {
    id: 'nz-south-island-moto',
    title: 'New Zealand\'s South Island by motorcycle',
    who: 'Classic route · the Southern Alps loop',
    when: 'November to April',
    vehicle: 'Motorcycle, 8–12 days',
    kind: 'moto',
    color: '#15803d',
    summary: 'A loop over the Southern Alps\' three great passes: Arthur\'s Pass to the wild West Coast, the pancake rocks of Punakaiki, rainforest and glaciers at Franz Josef and Fox, the Haast Pass to the lakes, Queenstown and the road to Milford Sound, and back past Aoraki/Mount Cook. Rain and floods can close the coast road.',
    sources: [
      REPORT('2025 New Zealand South Island: daily trip log (February 2025)', 'https://cross-country-trips.pages.dev/trips/2025-new-zealand-south-island'),
      REPORT('Adventure Bike Rider: the greatest roads on Middle-earth?', 'https://www.adventurebikerider.com/article/the-greatest-roads-on-middle-earth/'),
    ],
    approximate: 'A common loop; the roads are the router\'s choice.',
    stops: [
      { q: 'Christchurch, New Zealand', name: 'Christchurch', wiki: 'Christchurch', text: 'Bikes collected in the garden city.' },
      { q: 'Arthur\'s Pass', name: 'Arthur\'s Pass', wiki: 'Arthur\'s Pass', text: 'Over the main divide; keas on the bikes.' },
      { q: 'Punakaiki, New Zealand', name: 'Punakaiki', wiki: 'Pancake Rocks', text: 'The Pancake Rocks and blowholes.' },
      { q: 'Hokitika, New Zealand', name: 'Hokitika', wiki: 'Hokitika', text: 'Greenstone carvers on the beach.' },
      { q: 'Franz Josef, New Zealand', name: 'Franz Josef', wiki: 'Franz Josef Glacier', text: 'A glacier pouring down to rainforest.', source: REPORT('2025 trip log', 'https://cross-country-trips.pages.dev/trips/2025-new-zealand-south-island') },
      { q: 'Haast, New Zealand', name: 'Haast', wiki: 'Haast Pass', text: 'Then the Haast Pass to the lakes.' },
      { q: 'Wanaka, New Zealand', name: 'Wanaka', wiki: 'Lake Wānaka', text: 'A lake town, the famous lone tree.' },
      { q: 'Queenstown, New Zealand', name: 'Queenstown', wiki: 'Queenstown, New Zealand', text: 'Over the Crown Range, the highest sealed road.' },
      { q: 'Te Anau, New Zealand', name: 'Te Anau', wiki: 'Milford Road', text: 'The Milford Road through the Homer tunnel.' },
      { q: 'Aoraki/Mount Cook Village', name: 'Aoraki/Mount Cook', wiki: 'Aoraki / Mount Cook', text: 'Along Lake Pukaki to New Zealand\'s highest mountain.' },
      { q: 'Christchurch, New Zealand', name: 'Back in Christchurch', wiki: 'Canterbury Plains', text: 'Across the Canterbury Plains.' },
    ],
  },
  {
    id: 'geres-moto',
    title: 'Gerês by motorcycle: a weekend loop from Porto',
    who: 'Classic route · Portugal\'s only national park',
    when: 'All year (spring and autumn best)',
    vehicle: 'Motorcycle, 2–3 days',
    kind: 'moto',
    color: '#166534',
    summary: 'A weekend from Porto into the Peneda-Gerês National Park: tight mountain roads with hairpins, granite villages with stone granaries at Soajo and Lindoso, the Portela do Homem pass on the Spanish border, the drowned village of Vilarinho das Furnas, waterfalls, wild garranos and long lunches. Narrow roads: ride gently.',
    sources: [
      REPORT('MyRoute: round trip from Gerês (September 2025)', 'https://www.myrouteapp.com/motor-and-car-routes/pt/1763016/Round-trip-from-Geres'),
      REPORT('VisitPortugal: um passeio pelo Gerês', 'https://www.visitportugal.com/pt-pt/content/um-passeio-pelo-geres'),
    ],
    approximate: 'A common loop; the roads are the router\'s choice.',
    stops: [
      { q: 'Porto, Portugal', name: 'Porto', wiki: 'Porto', text: 'Out north on the A3 or the old N14.' },
      { q: 'Braga, Portugal', name: 'Braga', wiki: 'Bom Jesus do Monte', text: 'The baroque stairs of Bom Jesus.' },
      { q: 'Caldas do Gerês', at: [41.7274, -8.1631], name: 'Gerês (vila)', wiki: 'Peneda-Gerês National Park', text: 'The spa village; hairpins straight after leaving town.', source: REPORT('MyRoute (2025)', 'https://www.myrouteapp.com/motor-and-car-routes/pt/1763016/Round-trip-from-Geres') },
      { q: 'Portela do Homem', name: 'Portela do Homem', wiki: 'Peneda-Gerês National Park', text: 'Through the Albergaria forest to the border pass and its waterfall.' },
      { q: 'Lindoso, Portugal', name: 'Lindoso', wiki: 'Lindoso', text: 'A castle and dozens of stone granaries.' },
      { q: 'Soajo, Portugal', name: 'Soajo', wiki: 'Soajo', text: 'More espigueiros on a granite threshing floor.' },
      { q: 'Castro Laboreiro, Portugal', name: 'Castro Laboreiro', wiki: 'Castro Laboreiro', text: 'A high village famous for its sheepdogs.' },
      { q: 'Ponte da Barca, Portugal', name: 'Ponte da Barca', wiki: 'Ponte da Barca', text: 'An old bridge over the Lima, then home.' },
    ],
  },
  {
    id: 'canning-stock-route',
    title: 'Canning Stock Route',
    who: 'Classic route · Australia\'s longest, remotest 4WD track',
    when: 'May to September',
    vehicle: 'Self-sufficient 4x4 convoy, 2–4 weeks',
    kind: '4x4',
    color: '#b45309',
    summary: 'About 1,850 km from Wiluna to Halls Creek across the Little Sandy, Gibson and Great Sandy deserts, following a 1900s cattle droving route with 51 wells: a thousand sand dunes, salt lakes, Aboriginal art at Durba Springs, one fuel stop at Kunawarritji and no help for days. Permits needed.',
    sources: [
      REPORT('ExplorOz: Canning Stock Route 2025 tracklog', 'https://www.exploroz.com/tracklogs/100901/wa+canning-stock-route-2025'),
      REPORT('Canning Stock Route permits: info pack', 'https://permits.canningstockroute.net.au/downloads/infopack.pdf?PC=TMV9WH'),
    ],
    approximate: 'Main points; the track is drawn as straight lines where the routers don\'t know it.',
    stops: [
      { q: 'Wiluna, Western Australia', name: 'Wiluna', wiki: 'Wiluna, Western Australia', text: 'The southern start, last real shop.' },
      { q: 'Durba Springs', name: 'Durba Springs', at: [-23.7578, 122.5153], route: 'line', wiki: 'Canning Stock Route', text: 'A gorge with water, gums and rock art: the loveliest camp.' },
      { q: 'Well 23', name: 'Well 23', at: [-22.6, 123.0], route: 'line', wiki: 'Canning Stock Route', text: 'A restored stone-lined well.' },
      { q: 'Kunawarritji', name: 'Kunawarritji (Well 33)', at: [-22.3356, 124.5008], route: 'line', wiki: 'Kunawarritji', text: 'The one fuel stop, at an Aboriginal community by Well 33.', source: REPORT('Permits info pack', 'https://permits.canningstockroute.net.au/downloads/infopack.pdf?PC=TMV9WH') },
      { q: 'Breaden Pool', name: 'Breaden Pool', at: [-20.3, 126.0], route: 'line', wiki: 'Great Sandy Desert', text: 'Through the Great Sandy Desert\'s dune corridors.' },
      { q: 'Halls Creek, Western Australia', name: 'Halls Creek', route: 'line', wiki: 'Halls Creek, Western Australia', text: 'The northern end in the Kimberley.' },
    ],
  },
  {
    id: 'morocco-sahara-4x4',
    title: 'Morocco\'s Sahara by 4x4: Merzouga to Foum Zguid',
    who: 'Classic route · desert pistes of southern Morocco',
    when: 'October to April',
    vehicle: '4x4 (ideally two), 5–7 days',
    kind: '4x4',
    color: '#dc2626',
    summary: 'From the tall dunes of Erg Chebbi west along the Algerian border on desert pistes, through Zagora and the Draa palm groves to M\'Hamid, then the classic sand crossing past the dunes of Erg Chigaga and over the dry bed of Lac Iriki to Foum Zguid. Soft sand and fech-fech: go with a guide or a second vehicle.',
    sources: [
      REPORT('Horizons Unlimited: piste M\'Hamid to Foum Zguid', 'https://horizonsunlimited.com/hubb/morocco/piste-mhamid-to-form-ziguid-84644'),
      REPORT('Charlie\'s Travels: off-road M\'hamid to Foum Zguid', 'https://charlies-travels.com/en/unique-experience/mhamid-to-foum-zguid/'),
    ],
    approximate: 'Main points; desert pistes are drawn as straight lines.',
    stops: [
      { q: 'Merzouga, Morocco', name: 'Merzouga', wiki: 'Erg Chebbi', text: 'Sunset on the Erg Chebbi dunes.' },
      { q: 'Taouz, Morocco', name: 'Taouz', wiki: 'Taouz', text: 'South to the last village before the border pistes.' },
      { q: 'Zagora, Morocco', name: 'Zagora', wiki: 'Zagora, Morocco', text: 'Along the Draa valley\'s palm groves.' },
      { q: 'M\'Hamid El Ghizlane', name: 'M\'Hamid', wiki: 'M\'Hamid El Ghizlane', text: 'The end of the road: sand from here.' },
      { q: 'Erg Chigaga', name: 'Erg Chigaga', at: [29.8167, -6.0], route: 'line', wiki: 'Erg Chigaga', text: 'Wild, quieter dunes and desert camps.', source: REPORT('Horizons Unlimited', 'https://horizonsunlimited.com/hubb/morocco/piste-mhamid-to-form-ziguid-84644') },
      { q: 'Lac Iriki', name: 'Lac Iriki', at: [29.8833, -6.4667], route: 'line', wiki: 'Iriqui National Park', text: 'A dry lake bed as flat as a runway.' },
      { q: 'Foum Zguid, Morocco', name: 'Foum Zguid', route: 'line', wiki: 'Foum Zguid', text: 'Tarmac again, and a cold drink.' },
    ],
  },
  {
   "id": "ho-chi-minh-road",
   "title": "Ho Chi Minh Road by motorbike",
   "who": "Classic route · along the old Ho Chi Minh Trail, Vietnam",
   "when": "February to April (dry, before the heat); avoid typhoon season, October–November",
   "vehicle": "Motorbike, 10–14 days",
   "kind": "moto",
   "color": "#15803d",
   "summary": "Vietnam's highway along the Truong Son mountains, built over the network of jungle tracks that was the Ho Chi Minh Trail in the Vietnam War: from Hanoi past the caves of Phong Nha, the old battlefield of Khe Sanh, an empty western branch through wild forest near the Laos border, the coffee highlands of Kon Tum and Buon Ma Thuot, and Dalat, to Saigon. Far quieter than Highway 1 on the coast.",
   "sources": [
    {
     "label": "Matador Network: motorcycling the Ho Chi Minh Road",
     "url": "https://matadornetwork.com/read/motorcycle-ho-chi-minh-road-vietnam"
    },
    {
     "label": "Wikipedia: Ho Chi Minh trail",
     "url": "https://en.wikipedia.org/wiki/Ho_Chi_Minh_trail"
    }
   ],
   "approximate": "Main towns on the modern road; the wartime trail itself ran mostly through Laos and Cambodia.",
   "stops": [
    {
     "q": "Hanoi, Vietnam",
     "name": "Hanoi",
     "text": "Bikes bought in the Old Quarter; out south-west.",
     "wiki": "Hanoi"
    },
    {
     "q": "Xuan Mai, Hanoi",
     "name": "Xuan Mai",
     "text": "Where the Ho Chi Minh Road begins.",
     "wiki": "Xuan Mai"
    },
    {
     "q": "Phong Nha, Quang Binh",
     "name": "Phong Nha",
     "text": "Huge caves in the karst, including Son Doong, the world's largest.",
     "wiki": "Phong Nha"
    },
    {
     "q": "Khe Sanh, Quang Tri",
     "name": "Khe Sanh",
     "text": "The old US combat base, scene of a 77-day siege in 1968.",
     "wiki": "Khe Sanh"
    },
    {
     "q": "A Luoi, Hue",
     "name": "A Luoi",
     "text": "Down the western branch through near-empty forest by the Laos border.",
     "wiki": "A Lưới district"
    },
    {
     "q": "Kham Duc, Quang Nam",
     "at": [
      15.4458,
      107.7944
     ],
     "name": "Kham Duc",
     "text": "Mountain passes and jungle, the best riding of the road.",
     "wiki": "Kham Duc"
    },
    {
     "q": "Kon Tum, Vietnam",
     "at": [
      14.3497,
      108.0005
     ],
     "name": "Kon Tum",
     "text": "The Central Highlands and their minority villages.",
     "wiki": "Kon Tum"
    },
    {
     "q": "Buon Ma Thuot, Vietnam",
     "name": "Buon Ma Thuot",
     "text": "Vietnam's coffee capital.",
     "wiki": "Buon Ma Thuot"
    },
    {
     "q": "Da Lat, Vietnam",
     "name": "Dalat",
     "text": "A cool hill station of pine forests.",
     "wiki": "Da Lat"
    },
    {
     "q": "Ho Chi Minh City, Vietnam",
     "at": [
      10.7769,
      106.7009
     ],
     "name": "Saigon",
     "text": "Down to the delta city, end of the road.",
     "wiki": "Ho Chi Minh City"
    }
   ]
  },
  {
   "id": "west-africa-overland",
   "title": "West Africa overland: Morocco to Ghana",
   "who": "Classic overland route",
   "when": "Best November–March (dry season)",
   "vehicle": "Motorcycle, 4x4 or overland truck, 2–3 months",
   "kind": "4x4",
   "color": "#c2410c",
   "summary": "The great West African coast run: down through Morocco and the Western Sahara, the iron-ore train country of Mauritania, Senegal, then the green coast through the Gambia, Guinea-Bissau, Guinea, Sierra Leone, Liberia and Côte d'Ivoire to Accra. The old inland route via Mali and Burkina Faso is today avoided for security reasons; check current advice and visas before going.",
   "sources": [
    {
     "label": "Local Adventures: Fes to Ghana overland (81 days)",
     "url": "https://localadventures.travel/tours/fes-morocco-to-ghana-group-overland-tour-qbisemz"
    },
    {
     "label": "Horizons Unlimited: Ghana to Morocco solo by motorcycle",
     "url": "https://www.horizonsunlimited.com/hubb/route-planning/ghana-to-morocco-moto-solo-88081?nojs=1"
    },
    {
     "label": "Horizons Unlimited: West Africa route thread",
     "url": "https://horizonsunlimited.com/hubb/sub-saharan-africa/west-africa-103429"
    }
   ],
   "approximate": "Usual corridor from overland tours and rider reports; roads approximate.",
   "stops": [
    {
     "q": "Tangier, Morocco",
     "name": "Tangier",
     "text": "Ferry from Spain into Africa.",
     "wiki": "Tangier"
    },
    {
     "q": "Marrakech, Morocco",
     "name": "Marrakech",
     "text": "Over the Atlas.",
     "wiki": "Marrakech"
    },
    {
     "q": "Dakhla, Western Sahara",
     "name": "Dakhla",
     "text": "A thousand kilometres of desert coast; kitesurfers in the lagoon.",
     "at": [
      23.6848,
      -15.958
     ],
     "wiki": "Dakhla"
    },
    {
     "q": "Nouadhibou, Mauritania",
     "name": "Nouadhibou",
     "text": "Through no man's land into Mauritania, near the iron-ore train.",
     "wiki": "Nouadhibou"
    },
    {
     "q": "Nouakchott, Mauritania",
     "name": "Nouakchott",
     "text": "Down the desert to the capital.",
     "wiki": "Nouakchott"
    },
    {
     "q": "Saint-Louis, Senegal",
     "name": "Saint-Louis",
     "wiki": "Saint-Louis, Senegal",
     "text": "Colonial island town at the mouth of the Senegal River."
    },
    {
     "q": "Dakar, Senegal",
     "name": "Dakar",
     "text": "The old rally finish, and visas for the road south.",
     "wiki": "Dakar"
    },
    {
     "q": "Banjul, Gambia",
     "name": "Banjul",
     "text": "The Gambia, by ferry across the river.",
     "wiki": "Banjul"
    },
    {
     "q": "Bissau, Guinea-Bissau",
     "name": "Bissau",
     "text": "Portuguese-speaking Guinea-Bissau.",
     "wiki": "Bissau"
    },
    {
     "q": "Labé, Guinea",
     "name": "Fouta Djallon",
     "text": "The cool highlands of Guinea on rough roads.",
     "wiki": "Labé"
    },
    {
     "q": "Freetown, Sierra Leone",
     "name": "Freetown",
     "text": "Beaches under the mountains.",
     "wiki": "Freetown"
    },
    {
     "q": "Monrovia, Liberia",
     "name": "Monrovia",
     "text": "Along the rainforest coast.",
     "wiki": "Monrovia"
    },
    {
     "q": "Abidjan, Ivory Coast",
     "name": "Abidjan",
     "text": "Côte d'Ivoire's big lagoon city.",
     "wiki": "Abidjan"
    },
    {
     "q": "Accra, Ghana",
     "name": "Accra",
     "text": "End of the road for most overland trucks.",
     "wiki": "Accra"
    }
   ]
  },
  {
   "id": "skeleton-coast-kaokoland",
   "title": "Skeleton Coast & Kaokoland 4x4",
   "who": "Classic 4x4 route",
   "when": "Best May–October",
   "vehicle": "4x4 in a convoy, 10–14 days",
   "kind": "4x4",
   "color": "#92400e",
   "summary": "Namibia's wildest drive: north up the fog-bound Skeleton Coast past shipwrecks and seal colonies, inland through the desert-elephant rivers to Purros, then into Kaokoland, land of the Himba, to Epupa Falls on the Kunene and down the notorious Van Zyl's Pass into the empty Marienfluss valley. Take two vehicles, lots of fuel and water.",
   "sources": [
    {
     "label": "Wikipedia: Skeleton Coast",
     "url": "https://en.wikipedia.org/wiki/Skeleton_Coast"
    },
    {
     "label": "Getaway: how to do the wildest 4x4 trip in Namibia",
     "url": "https://getaway.co.za/?p=15337724"
    },
    {
     "label": "Wikivoyage: Kaokoland",
     "url": "https://en.wikivoyage.org/wiki/Kaokoland"
    },
    {
     "label": "Tracks4Africa: Van Zyl's Pass",
     "url": "https://tracks4africa.co.za/listings/item/w207682/van-zyls-pass/"
    }
   ],
   "approximate": "Usual loop from 4x4 reports; the off-road tracks are drawn as straight lines.",
   "stops": [
    {
     "q": "Swakopmund, Namibia",
     "name": "Swakopmund",
     "text": "Stock up in the German seaside town.",
     "wiki": "Swakopmund"
    },
    {
     "q": "Henties Bay, Namibia",
     "name": "Henties Bay",
     "text": "North on the salt road; the Zeila wreck south of town.",
     "wiki": "Henties Bay"
    },
    {
     "q": "Torra Bay, Namibia",
     "at": [
      -20.312,
      13.238
     ],
     "name": "Torra Bay",
     "text": "Through the Ugab gate into the Skeleton Coast park.",
     "wiki": "Torra Bay"
    },
    {
     "q": "Terrace Bay, Namibia",
     "at": [
      -19.995,
      13.034
     ],
     "name": "Terrace Bay",
     "text": "The northernmost point you can drive; dunes begin beyond.",
     "wiki": "Terrace Bay"
    },
    {
     "q": "Sesfontein, Namibia",
     "name": "Sesfontein",
     "text": "Inland through the Springbokwasser gate to an old fort.",
     "wiki": "Sesfontein"
    },
    {
     "q": "Purros, Namibia",
     "at": [
      -18.737,
      12.944
     ],
     "name": "Purros",
     "route": "line",
     "text": "Along the sandy Hoarusib riverbed, desert elephant country.",
     "wiki": "Purros"
    },
    {
     "q": "Opuwo, Namibia",
     "name": "Opuwo",
     "text": "Kaokoland's only town: last fuel.",
     "wiki": "Opuwo"
    },
    {
     "q": "Epupa Falls, Namibia",
     "at": [
      -16.999,
      13.246
     ],
     "name": "Epupa Falls",
     "text": "Palms and waterfalls on the Kunene, Angola across the river.",
     "wiki": "Epupa Falls"
    },
    {
     "q": "Okangwati, Namibia",
     "at": [
      -17.416,
      13.272
     ],
     "name": "Okangwati",
     "text": "Himba villages.",
     "wiki": "Okangwati"
    },
    {
     "q": "Van Zyl's Pass, Namibia",
     "at": [
      -17.633,
      12.735
     ],
     "name": "Van Zyl's Pass",
     "route": "line",
     "text": "The steep rocky descent, east to west only."
    },
    {
     "q": "Marienfluss, Namibia",
     "at": [
      -17.3,
      12.47
     ],
     "name": "Marienfluss",
     "route": "line",
     "text": "Grass, fairy circles and silence down to the Kunene.",
     "wiki": "Marienfluss"
    }
   ]
  },
  {
   "id": "sani-pass-lesotho",
   "title": "Sani Pass and the Lesotho highlands",
   "who": "Classic 4x4 and motorcycle route",
   "when": "Best March–May and September–November",
   "vehicle": "4x4 or adventure motorcycle, 5–7 days",
   "kind": "4x4",
   "color": "#15803d",
   "summary": "Up the switchbacks of the Sani Pass from South Africa to the \"highest pub in Africa\" at nearly 2,900 m, then across the roof of Lesotho: high passes, Basotho horsemen in blankets, the Katse Dam and Semonkong's huge waterfall, before dropping to Maseru.",
   "sources": [
    {
     "label": "Wikipedia: Sani Pass",
     "url": "https://en.wikipedia.org/wiki/Sani_Pass"
    }
   ],
   "approximate": "Classic loop; roads in Lesotho are approximate.",
   "stops": [
    {
     "q": "Underberg, South Africa",
     "name": "Underberg",
     "text": "Foot of the Drakensberg.",
     "wiki": "Underberg"
    },
    {
     "q": "Sani Top, Lesotho",
     "at": [
      -29.5869,
      29.2878
     ],
     "name": "Sani Top",
     "text": "Up the pass to the border post and the mountain pub.",
     "wiki": "Sani Top"
    },
    {
     "q": "Mokhotlong, Lesotho",
     "name": "Mokhotlong",
     "text": "Across the high plateau.",
     "at": [
      -29.2885,
      29.0644
     ],
     "wiki": "Mokhotlong"
    },
    {
     "q": "Katse Dam, Lesotho",
     "at": [
      -29.336,
      28.506
     ],
     "name": "Katse Dam",
     "text": "The great highland water scheme.",
     "wiki": "Katse Dam"
    },
    {
     "q": "Semonkong, Lesotho",
     "name": "Semonkong",
     "text": "Maletsunyane Falls, almost 200 m drop.",
     "wiki": "Semonkong"
    },
    {
     "q": "Maseru, Lesotho",
     "name": "Maseru",
     "text": "Down to the capital.",
     "wiki": "Maseru"
    }
   ]
  },
  {
   "id": "silk-road-overland",
   "title": "Silk Road overland: Istanbul to Kashgar",
   "who": "Classic overland route",
   "when": "Best May–September",
   "vehicle": "Motorcycle or 4x4, 6–10 weeks",
   "kind": "moto",
   "color": "#b45309",
   "summary": "The ancient caravan road by motorcycle: across Anatolia and Iran, through Turkmenistan to the blue domes of Merv, Bukhara and Samarkand, over the Kyrgyz mountains and the Torugart Pass to Kashgar. Paperwork is the hard part: Iran often needs a guide, Turkmenistan a transit visa and a carnet, and China special permits.",
   "sources": [
    {
     "label": "Wikipedia: Silk Road",
     "url": "https://en.wikipedia.org/wiki/Silk_Road"
    },
    {
     "label": "Adventure Bike Rider: Chasing the Silk Road",
     "url": "https://www.adventurebikerider.com/article/chasing-the-silk-road/"
    },
    {
     "label": "Mad or Nomad: motorcycle guide to Turkmenistan",
     "url": "https://www.madornomad.com/motorcycle-travel-guide-turkmenistan/"
    },
    {
     "label": "Horizons Unlimited: Central Asia in two months",
     "url": "https://www.horizonsunlimited.com/hubb/northern-and-central-asia/central-asia-2-months-101695-print?pp=100"
    }
   ],
   "approximate": "Usual corridor from rider reports; roads approximate.",
   "stops": [
    {
     "q": "Istanbul, Turkey",
     "name": "Istanbul",
     "text": "Where Europe ends.",
     "wiki": "Istanbul"
    },
    {
     "q": "Göreme, Turkey",
     "name": "Cappadocia",
     "text": "Caravanserais and fairy chimneys.",
     "wiki": "Göreme"
    },
    {
     "q": "Erzurum, Turkey",
     "name": "Erzurum",
     "text": "High eastern Anatolia.",
     "wiki": "Erzurum"
    },
    {
     "q": "Tabriz, Iran",
     "name": "Tabriz",
     "text": "Its great covered bazaar was a Silk Road hub.",
     "wiki": "Tabriz"
    },
    {
     "q": "Tehran, Iran",
     "name": "Tehran",
     "text": "Visas for what comes next.",
     "wiki": "Tehran"
    },
    {
     "q": "Mashhad, Iran",
     "name": "Mashhad",
     "text": "Last city before Turkmenistan.",
     "wiki": "Mashhad"
    },
    {
     "q": "Ashgabat, Turkmenistan",
     "name": "Ashgabat",
     "text": "White marble capital.",
     "wiki": "Ashgabat"
    },
    {
     "q": "Mary, Turkmenistan",
     "name": "Merv",
     "wiki": "Merv",
     "text": "Ruins of one of the largest cities of the 12th century."
    },
    {
     "q": "Bukhara, Uzbekistan",
     "name": "Bukhara",
     "text": "Madrasas and minarets.",
     "wiki": "Bukhara"
    },
    {
     "q": "Samarkand, Uzbekistan",
     "name": "Samarkand",
     "wiki": "Registan",
     "text": "The Registan."
    },
    {
     "q": "Tashkent, Uzbekistan",
     "name": "Tashkent",
     "text": "Through the Fergana side.",
     "wiki": "Tashkent"
    },
    {
     "q": "Osh, Kyrgyzstan",
     "name": "Osh",
     "text": "Into the mountains.",
     "at": [
      40.5133,
      72.8161
     ],
     "wiki": "Osh"
    },
    {
     "q": "Naryn, Kyrgyzstan",
     "name": "Naryn",
     "text": "Towards the Chinese border.",
     "at": [
      41.4287,
      75.9911
     ],
     "wiki": "Naryn"
    },
    {
     "q": "Torugart Pass",
     "at": [
      40.565,
      75.39
     ],
     "name": "Torugart Pass",
     "text": "Nearly 3,800 m border crossing.",
     "wiki": "Torugart Pass"
    },
    {
     "q": "Kashgar, Xinjiang",
     "name": "Kashgar",
     "text": "The Sunday market at the end of the road.",
     "wiki": "Kashgar"
    }
   ]
  },
  {
   "id": "viarhona",
   "title": "ViaRhôna: Lake Geneva to the Mediterranean",
   "who": "EuroVelo 17 · classic cycle route",
   "when": "Best April–October",
   "vehicle": "Bicycle, 10–14 days",
   "kind": "bike",
   "color": "#0284c7",
   "summary": "About 800 km down the Rhône from Lake Geneva to the sea, mostly on greenways and quiet roads: Alpine lakes, Lyon, Côtes-du-Rhône vineyards, Roman Orange, the Pont d'Avignon, Arles and the Camargue, ending at Sète. Mostly flat or downhill with the mistral at your back.",
   "sources": [
    {
     "label": "ViaRhôna official site",
     "url": "https://en.viarhona.com/the-route/a-truly-european-cycle-route"
    },
    {
     "label": "France Vélo Tourisme: ViaRhôna",
     "url": "https://en.francevelotourisme.com/itineraire/viarhona"
    },
    {
     "label": "Freewheeling France: the ViaRhôna",
     "url": "https://freewheelingfrance.com/bike-routes-in-france/via-rhona-bike-route.html"
    }
   ],
   "approximate": "Main towns on the route; the path follows cycleways only approximately.",
   "stops": [
    {
     "q": "Saint-Gingolph, France",
     "name": "Saint-Gingolph",
     "text": "Official start on Lake Geneva's French shore.",
     "wiki": "Saint-Gingolph"
    },
    {
     "q": "Thonon-les-Bains, France",
     "name": "Thonon",
     "text": "Along the lake.",
     "wiki": "Thonon-les-Bains"
    },
    {
     "q": "Genève, Switzerland",
     "name": "Geneva",
     "text": "Where the Rhône leaves the lake.",
     "wiki": "Geneva"
    },
    {
     "q": "Seyssel, Haute-Savoie",
     "name": "Seyssel",
     "text": "Into the gorges.",
     "wiki": "Seyssel, Haute-Savoie"
    },
    {
     "q": "Belley, France",
     "name": "Belley",
     "text": "Lakes and marshes of the upper Rhône.",
     "wiki": "Belley"
    },
    {
     "q": "Lyon, France",
     "name": "Lyon",
     "text": "Where the Saône joins; take the train to Givors if the temporary section is bad.",
     "wiki": "Lyon"
    },
    {
     "q": "Vienne, Isère",
     "name": "Vienne",
     "text": "Roman temple and vineyards.",
     "wiki": "Vienne, Isère"
    },
    {
     "q": "Valence, Drôme",
     "name": "Valence",
     "text": "Gateway to Provence.",
     "wiki": "Valence, Drôme"
    },
    {
     "q": "Orange, Vaucluse",
     "name": "Orange",
     "text": "Roman theatre.",
     "wiki": "Orange, Vaucluse"
    },
    {
     "q": "Avignon, France",
     "name": "Avignon",
     "text": "Palace of the Popes and the broken bridge.",
     "wiki": "Avignon"
    },
    {
     "q": "Arles, France",
     "name": "Arles",
     "text": "Van Gogh's town.",
     "wiki": "Arles"
    },
    {
     "q": "Aigues-Mortes, France",
     "name": "Aigues-Mortes",
     "text": "Walled town in the Camargue salt flats.",
     "wiki": "Aigues-Mortes"
    },
    {
     "q": "Sète, France",
     "name": "Sète",
     "text": "The Mediterranean.",
     "wiki": "Sète"
    }
   ]
  },
  {
   "id": "canal-des-deux-mers",
   "title": "Canal des Deux Mers by bike",
   "who": "V80 · classic cycle route",
   "when": "Best April–June and September–October",
   "vehicle": "Bicycle, 10–14 days",
   "kind": "bike",
   "color": "#059669",
   "summary": "Atlantic to Mediterranean across the south of France, about 750 km: from Royan along the Gironde to Bordeaux, then the towpaths of the Garonne Canal and the 17th-century Canal du Midi under plane trees, via Toulouse and Carcassonne to Sète. Flat; ride west to east for the wind.",
   "sources": [
    {
     "label": "France Vélo Tourisme: Canal des 2 Mers by bike",
     "url": "https://en.francevelotourisme.com/cycle-route/canal-des-2-mers-by-bike-atlantic-mediterranean-sea"
    },
    {
     "label": "Freewheeling France: Canal des Deux Mers",
     "url": "https://freewheelingfrance.com/where-to-go/canal-des-deux-mers.html"
    },
    {
     "label": "Wikipedia: Canal du Midi",
     "url": "https://en.wikipedia.org/wiki/Canal_du_Midi"
    }
   ],
   "approximate": "Main towns; the path follows towpaths only approximately.",
   "stops": [
    {
     "q": "Royan, France",
     "name": "Royan",
     "text": "Start at the Atlantic.",
     "wiki": "Royan"
    },
    {
     "q": "Bordeaux, France",
     "name": "Bordeaux",
     "text": "Up the Gironde estuary through wine country.",
     "wiki": "Bordeaux"
    },
    {
     "q": "Langon, Gironde",
     "name": "Langon",
     "text": "Sauternes and the start of the Garonne Canal path.",
     "wiki": "Langon, Gironde"
    },
    {
     "q": "Agen, France",
     "name": "Agen",
     "text": "The canal bridge over the Garonne.",
     "wiki": "Agen"
    },
    {
     "q": "Moissac, France",
     "name": "Moissac",
     "text": "Romanesque cloister.",
     "wiki": "Moissac"
    },
    {
     "q": "Toulouse, France",
     "name": "Toulouse",
     "text": "Pink city; start of the Canal du Midi.",
     "wiki": "Toulouse"
    },
    {
     "q": "Castelnaudary, France",
     "name": "Castelnaudary",
     "text": "Cassoulet capital.",
     "wiki": "Castelnaudary"
    },
    {
     "q": "Carcassonne, France",
     "name": "Carcassonne",
     "text": "The medieval Cité.",
     "wiki": "Carcassonne"
    },
    {
     "q": "Béziers, France",
     "name": "Béziers",
     "text": "The nine locks of Fonseranes.",
     "wiki": "Béziers"
    },
    {
     "q": "Sète, France",
     "name": "Sète",
     "text": "Mediterranean finish.",
     "wiki": "Sète"
    }
   ]
  },
  {
   "id": "ev8-southern-spain",
   "title": "EuroVelo 8 in southern Spain",
   "who": "EuroVelo 8 · Mediterranean Route",
   "when": "Best October–May",
   "vehicle": "Bicycle, 2–3 weeks",
   "kind": "bike",
   "color": "#ea580c",
   "summary": "The start of the long Mediterranean route: from Cádiz past Tarifa and Gibraltar, along the Costa del Sol, inland to Granada and the Alhambra, the desert coast of Almería, Murcia and on to Valencia. In Spain the route is still mostly unsigned and on roads, so plan your own way.",
   "sources": [
    {
     "label": "Wikipedia: EV8 The Mediterranean Route",
     "url": "https://en.wikipedia.org/wiki/EV8_The_Mediterranean_Route"
    }
   ],
   "approximate": "The towns the EuroVelo plan passes; most of it is not yet built, so the way is approximate.",
   "stops": [
    {
     "q": "Cádiz, Spain",
     "name": "Cádiz",
     "text": "Start of EuroVelo 8.",
     "wiki": "Cádiz"
    },
    {
     "q": "Tarifa, Spain",
     "name": "Tarifa",
     "text": "Africa across the strait; the signed section starts here.",
     "wiki": "Tarifa"
    },
    {
     "q": "Algeciras, Spain",
     "name": "Algeciras",
     "text": "Past Gibraltar to Guadiaro.",
     "wiki": "Algeciras"
    },
    {
     "q": "Marbella, Spain",
     "name": "Marbella",
     "text": "Costa del Sol.",
     "wiki": "Marbella"
    },
    {
     "q": "Málaga, Spain",
     "name": "Málaga",
     "text": "Picasso's city.",
     "wiki": "Málaga"
    },
    {
     "q": "Granada, Spain",
     "name": "Granada",
     "wiki": "Alhambra",
     "text": "Inland to the Alhambra."
    },
    {
     "q": "Almería, Spain",
     "name": "Almería",
     "text": "Desert coast and Cabo de Gata.",
     "wiki": "Almería"
    },
    {
     "q": "Cartagena, Spain",
     "name": "Cartagena",
     "text": "Roman and naval port.",
     "wiki": "Cartagena"
    },
    {
     "q": "Alicante, Spain",
     "name": "Alicante",
     "text": "Costa Blanca.",
     "wiki": "Alicante"
    },
    {
     "q": "Valencia, Spain",
     "name": "Valencia",
     "text": "Paella at the end; the route goes on to Barcelona and France.",
     "wiki": "Valencia"
    }
   ]
  },
  {
   "id": "mediterranee-a-velo",
   "title": "La Méditerranée à vélo (EV8 France)",
   "who": "EuroVelo 8 · classic cycle route",
   "when": "Best April–June and September–October",
   "vehicle": "Bicycle, 10–14 days",
   "kind": "bike",
   "color": "#0891b2",
   "summary": "About 800 km across the French Mediterranean, fully signed: over the Pyrenees at Le Perthus, along the lagoons of the Languedoc and the Canal de la Robine, through the Camargue, inland through the Luberon villages and Haute-Provence, then down to Nice and Menton on the Italian border.",
   "sources": [
    {
     "label": "Wikipedia: EV8 The Mediterranean Route",
     "url": "https://en.wikipedia.org/wiki/EV8_The_Mediterranean_Route"
    }
   ],
   "approximate": "The towns the route passes; the path is approximate.",
   "stops": [
    {
     "q": "Le Perthus, France",
     "name": "Le Perthus",
     "text": "In from Spain over the Panissars pass.",
     "wiki": "Le Perthus"
    },
    {
     "q": "Argelès-sur-Mer, France",
     "name": "Argelès",
     "text": "The Catalan coast.",
     "wiki": "Argelès-sur-Mer"
    },
    {
     "q": "Leucate, France",
     "name": "Leucate",
     "text": "Lagoons and kite beaches.",
     "wiki": "Leucate"
    },
    {
     "q": "Narbonne, France",
     "name": "Narbonne",
     "text": "Along the Canal de la Robine.",
     "wiki": "Narbonne"
    },
    {
     "q": "Béziers, France",
     "name": "Béziers",
     "text": "Crossing the Canal du Midi.",
     "wiki": "Béziers"
    },
    {
     "q": "Sète, France",
     "name": "Sète",
     "text": "Between lagoon and sea.",
     "wiki": "Sète"
    },
    {
     "q": "La Grande-Motte, France",
     "name": "La Grande-Motte",
     "text": "Pyramids of the 1960s resort.",
     "wiki": "La Grande-Motte"
    },
    {
     "q": "Cavaillon, France",
     "name": "Cavaillon",
     "text": "Into Provence.",
     "wiki": "Cavaillon"
    },
    {
     "q": "Apt, France",
     "name": "Apt",
     "text": "The Luberon.",
     "wiki": "Apt, Vaucluse"
    },
    {
     "q": "Forcalquier, France",
     "name": "Forcalquier",
     "text": "Haute-Provence hills.",
     "wiki": "Forcalquier"
    },
    {
     "q": "Nice, France",
     "name": "Nice",
     "text": "Down to the Riviera.",
     "wiki": "Nice"
    },
    {
     "q": "Menton, France",
     "name": "Menton",
     "text": "Italy next door.",
     "wiki": "Menton"
    }
   ]
  },
  {
   "id": "route-des-grandes-alpes",
   "title": "Route des Grandes Alpes",
   "who": "Classic road route since 1913",
   "when": "Best late June–September",
   "vehicle": "Motorcycle, car or road bike, 5–10 days",
   "kind": "moto",
   "color": "#7c3aed",
   "summary": "About 720 km from Lake Geneva to the Riviera over every great pass of the French Alps: Colombière, Aravis, Iseran (the highest paved pass in the Alps), Galibier, Izoard, Vars, Bonette and Turini. Opened in 1913; the high cols are clear only from mid-June.",
   "sources": [
    {
     "label": "Wikipedia: Route des Grandes Alpes",
     "url": "https://en.wikipedia.org/wiki/Route_des_Grandes_Alpes"
    }
   ],
   "approximate": "The passes and towns of the official route.",
   "stops": [
    {
     "q": "Thonon-les-Bains, France",
     "name": "Thonon",
     "text": "Start on Lake Geneva.",
     "wiki": "Thonon-les-Bains"
    },
    {
     "q": "Les Gets, France",
     "name": "Les Gets",
     "text": "First climb.",
     "wiki": "Les Gets"
    },
    {
     "q": "Col de la Colombière, France",
     "at": [
      45.9958,
      6.4697
     ],
     "name": "Col de la Colombière",
     "text": "1,613 m.",
     "wiki": "Col de la Colombière"
    },
    {
     "q": "Col des Aravis, France",
     "at": [
      45.8722,
      6.465
     ],
     "name": "Col des Aravis",
     "text": "Mont Blanc view.",
     "wiki": "Col des Aravis"
    },
    {
     "q": "Col des Saisies, France",
     "at": [
      45.7578,
      6.5361
     ],
     "name": "Col des Saisies",
     "text": "Down to Beaufort and its cheese.",
     "wiki": "Col des Saisies"
    },
    {
     "q": "Bourg-Saint-Maurice, France",
     "name": "Bourg-Saint-Maurice",
     "text": "Up the Tarentaise.",
     "wiki": "Bourg-Saint-Maurice"
    },
    {
     "q": "Val-d'Isère, France",
     "name": "Val-d'Isère",
     "text": "Ski town.",
     "wiki": "Val-d'Isère"
    },
    {
     "q": "Col de l'Iseran, France",
     "at": [
      45.417,
      7.0306
     ],
     "name": "Col de l'Iseran",
     "text": "2,764 m: the highest paved pass in the Alps.",
     "wiki": "Col de l'Iseran"
    },
    {
     "q": "Modane, France",
     "name": "Modane",
     "text": "Down the Maurienne.",
     "wiki": "Modane"
    },
    {
     "q": "Col du Galibier, France",
     "at": [
      45.0641,
      6.4078
     ],
     "name": "Col du Galibier",
     "text": "Via the Télégraphe; Tour de France legend.",
     "wiki": "Col du Galibier"
    },
    {
     "q": "Briançon, France",
     "name": "Briançon",
     "text": "Over the Lautaret to the fortified town.",
     "wiki": "Briançon"
    },
    {
     "q": "Col d'Izoard, France",
     "at": [
      44.8203,
      6.735
     ],
     "name": "Col d'Izoard",
     "text": "The lunar Casse Déserte.",
     "wiki": "Col d'Izoard"
    },
    {
     "q": "Col de Vars, France",
     "at": [
      44.5389,
      6.7036
     ],
     "name": "Col de Vars",
     "text": "Towards the Ubaye.",
     "wiki": "Col de Vars"
    },
    {
     "q": "Barcelonnette, France",
     "name": "Barcelonnette",
     "text": "Mexican-style villas of returned emigrants.",
     "wiki": "Barcelonnette"
    },
    {
     "q": "Col de la Bonette, France",
     "at": [
      44.3264,
      6.8072
     ],
     "name": "Col de la Bonette",
     "text": "2,802 m via the Cime loop.",
     "wiki": "Col de la Bonette"
    },
    {
     "q": "Col de Turini, France",
     "at": [
      43.9775,
      7.3911
     ],
     "name": "Col de Turini",
     "text": "Monte Carlo Rally hairpins.",
     "wiki": "Col de Turini"
    },
    {
     "q": "Menton, France",
     "name": "Menton",
     "text": "The sea, end of the road.",
     "wiki": "Menton"
    }
   ]
  },
  {
   "id": "torino-nice-rally",
   "title": "Torino–Nice Rally",
   "who": "Classic bikepacking route",
   "when": "Mass start the first Friday of September; ride July–September",
   "vehicle": "Gravel or mountain bike, 7–10 days",
   "kind": "bike",
   "color": "#dc2626",
   "summary": "About 700 km and 15,500 m of climbing from Turin to Nice, half on high military gravel roads: the Colle delle Finestre, the Strada dell'Assietta ridge above 2,000 m, the Strada dei Cannoni, plus Izoard and Agnel. An unsupported group ride every September; the route is open all summer.",
   "sources": [
    {
     "label": "Café du Cycliste: Tracing the Torino-Nice Rally",
     "url": "https://www.cafeducycliste.com/en/blogs/rouler/tracing-the-torino-nice-rally"
    },
    {
     "label": "bikepacking.com: Torino-Nice 2024 (video)",
     "url": "https://bikepacking.com/plog/torino-nice-rally-2024-josh-ibbett/"
    },
    {
     "label": "Rough Ride Guide: Torino to Nice",
     "url": "https://www.roughrideguide.co.uk/route-details/2874"
    }
   ],
   "approximate": "Main climbs named in reports; the rally line changes each year.",
   "stops": [
    {
     "q": "Torino, Italy",
     "name": "Turin",
     "text": "Start in the city.",
     "wiki": "Turin"
    },
    {
     "q": "Colle delle Finestre, Italy",
     "at": [
      45.0717,
      7.0533
     ],
     "name": "Colle delle Finestre",
     "text": "Giro climb, gravel at the top.",
     "wiki": "Colle delle Finestre"
    },
    {
     "q": "Colle dell'Assietta, Italy",
     "at": [
      45.0739,
      6.9958
     ],
     "name": "Strada dell'Assietta",
     "route": "line",
     "text": "Old military road along a ridge, 2,472 m.",
     "wiki": "Colle dell'Assietta"
    },
    {
     "q": "Sestriere, Italy",
     "name": "Sestriere",
     "text": "Down the ridge.",
     "wiki": "Sestriere"
    },
    {
     "q": "Col d'Izoard, France",
     "at": [
      44.8203,
      6.735
     ],
     "name": "Col d'Izoard",
     "text": "Into France.",
     "wiki": "Col d'Izoard"
    },
    {
     "q": "Col Agnel",
     "at": [
      44.6839,
      6.9792
     ],
     "name": "Col Agnel",
     "text": "Back to Italy at 2,744 m.",
     "wiki": "Col Agnel"
    },
    {
     "q": "Colle di Sampeyre, Italy",
     "at": [
      44.5539,
      7.1158
     ],
     "name": "Colle di Sampeyre",
     "text": "Between the Varaita and Maira valleys.",
     "wiki": "Colle di Sampeyre"
    },
    {
     "q": "Colle Fauniera, Italy",
     "at": [
      44.3844,
      7.1219
     ],
     "name": "Strada dei Cannoni",
     "route": "line",
     "text": "High gravel roads above the valleys.",
     "wiki": "Colle Fauniera"
    },
    {
     "q": "Col de Turini, France",
     "at": [
      43.9775,
      7.3911
     ],
     "name": "Col de Turini",
     "text": "The last big climb.",
     "wiki": "Col de Turini"
    },
    {
     "q": "Nice, France",
     "name": "Nice",
     "text": "Promenade des Anglais.",
     "wiki": "Nice"
    }
   ]
  },
  {
   "id": "montanas-vacias",
   "title": "Montañas Vacías",
   "who": "Classic bikepacking route · by Ernesto Pastor",
   "when": "Best May–June and September–October",
   "vehicle": "Gravel or mountain bike, 8–10 days",
   "kind": "bike",
   "color": "#a855f7",
   "summary": "A loop of about 680 km and 12,500 m of climbing from Teruel through the \"Spanish Lapland\", the emptiest mountains in Europe: Albarracín, the source of the Tagus, the Serranía de Cuenca, the Montes Universales, Javalambre and Gúdar. Gravel forest roads, almost no shops: carry food. Made to bring attention to rural depopulation.",
   "sources": [
    {
     "label": "bikepacking.com: Montañas Vacías",
     "url": "https://bikepacking.com/routes/montanas-vacias/"
    },
    {
     "label": "bikepacking.com: Of Resilience, Hope, and a Slice of Heaven",
     "url": "https://bikepacking.com/plog/of-resilience-hope-and-a-slice-of-heaven"
    }
   ],
   "approximate": "Mountain areas the loop links; the gravel line is approximate.",
   "stops": [
    {
     "q": "Teruel, Spain",
     "name": "Teruel",
     "text": "Mudéjar towers, start and finish.",
     "wiki": "Teruel"
    },
    {
     "q": "Albarracín, Spain",
     "name": "Albarracín",
     "text": "Pink medieval town in the Rodeno pines.",
     "wiki": "Albarracín"
    },
    {
     "q": "Griegos, Spain",
     "name": "Montes Universales",
     "text": "High plateau.",
     "wiki": "Griegos"
    },
    {
     "q": "Nacimiento del Río Tajo",
     "at": [
      40.3317,
      -1.6931
     ],
     "name": "Source of the Tagus",
     "text": "The river that ends in Lisbon starts here."
    },
    {
     "q": "Beteta, Spain",
     "name": "Beteta",
     "text": "Serranía de Cuenca gorges.",
     "wiki": "Beteta"
    },
    {
     "q": "Tragacete, Spain",
     "name": "Tragacete",
     "text": "Source of the Júcar.",
     "wiki": "Tragacete"
    },
    {
     "q": "Camarena de la Sierra, Spain",
     "name": "Javalambre",
     "text": "The Sierra de Javalambre.",
     "wiki": "Camarena de la Sierra"
    },
    {
     "q": "Alcalá de la Selva, Spain",
     "name": "Gúdar",
     "text": "Sierra de Gúdar pinewoods.",
     "wiki": "Alcalá de la Selva"
    },
    {
     "q": "Teruel, Spain",
     "name": "Teruel",
     "text": "Back to the start.",
     "wiki": "Teruel"
    }
   ]
  },
  {
   "id": "transpyr-mtb",
   "title": "Transpyr: Pyrenees coast to coast by MTB",
   "who": "Classic mountain-bike route and race",
   "when": "Race in June; ride June–September",
   "vehicle": "Mountain bike, 7 days",
   "kind": "bike",
   "color": "#16a34a",
   "summary": "Mediterranean to Atlantic along the Spanish side of the Pyrenees, about 750–800 km and 18,000–20,000 m of climbing in seven stages: Costa Brava, Catalan valleys, Aragon's Aínsa and Jaca, Navarre's beech forests and down to the Basque marina at Hondarribia.",
   "sources": [
    {
     "label": "Transpyr: the mission",
     "url": "https://transpyr.com/en/the-mission"
    },
    {
     "label": "Track the Race: Transpyr Gran Raid MTB 2019 stages",
     "url": "https://tracktherace.com/transpyr-gran-raid-mtb-2019"
    },
    {
     "label": "Transpirenaica in MTB",
     "url": "https://travesiapirenaica.com/en/transpirenaica-in-mtb/"
    }
   ],
   "approximate": "Stage towns of the 2019 edition; the trail line is approximate.",
   "stops": [
    {
     "q": "Roses, Spain",
     "name": "Roses",
     "text": "Start at the Mediterranean.",
     "wiki": "Roses, Girona"
    },
    {
     "q": "Camprodon, Spain",
     "name": "Camprodon",
     "text": "Stage 1.",
     "wiki": "Camprodon"
    },
    {
     "q": "La Seu d'Urgell, Spain",
     "name": "La Seu d'Urgell",
     "text": "Near Andorra.",
     "wiki": "La Seu d'Urgell"
    },
    {
     "q": "El Pont de Suert, Spain",
     "name": "El Pont de Suert",
     "text": "Into the high Pyrenees.",
     "wiki": "El Pont de Suert"
    },
    {
     "q": "Aínsa, Spain",
     "name": "Aínsa",
     "text": "Medieval village under Monte Perdido.",
     "wiki": "Aínsa"
    },
    {
     "q": "Jaca, Spain",
     "name": "Jaca",
     "text": "Aragon.",
     "wiki": "Jaca"
    },
    {
     "q": "Burguete, Navarra",
     "name": "Auritz",
     "text": "Navarre beech forests near Roncesvalles.",
     "wiki": "Burguete"
    },
    {
     "q": "Hondarribia, Spain",
     "name": "Hondarribia",
     "text": "Finish at the Atlantic marina.",
     "wiki": "Hondarribia"
    }
   ]
  },
];
