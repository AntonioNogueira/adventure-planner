// Famous journeys for the Inspiration map. Routes are reconstructed from public accounts (mostly Wikipedia); the
// roads between named places are our best guess, so each journey says so. Texts are written for this app (not copied).
// Each stop: q = what to look up (or at = [lat, lng] for places a search can't find), name, text, wiki = the Wikipedia
// article whose free-licence photo illustrates it, by = how they got there from the previous stop (default: ride).
// Built into public/inspiration/*.json by build.mjs.

export const JOURNEYS = [
  {
    id: 'long-way-round',
    title: 'Long Way Round',
    who: 'Ewan McGregor & Charley Boorman',
    when: 'April–July 2004',
    vehicle: 'BMW R1150GS Adventure',
    kind: 'moto',
    color: '#d97706',
    media: [{"kind": "book", "title": "Long Way Round", "by": "Ewan McGregor & Charley Boorman"}, {"kind": "series", "title": "Long Way Round", "note": "TV series, 2004"}],
    summary: 'London to New York the long way: east across Europe, the Kazakh and Mongolian steppe, Siberia and the Road of Bones to Magadan, then across Alaska, Canada and the US. About 30,000 km in under four months, filmed as a TV series that inspired a generation of adventure riders.',
    sources: [
      { label: 'Eugene Kaspersky: two attempts at the abandoned Road of Bones (2026)', url: 'https://eugene.kaspersky.com/2026/04/09/two-attempts-at-the-infamous-abandoned-road-of-bones-in-siberia/' },
      { label: 'Adventure Bike Rider: an insider\'s guide to the Road of Bones', url: 'https://www.adventurebikerider.com/an-insiders-guide-to-the-road-of-bones/' },
      { label: 'Wikipedia: Long Way Round', url: 'https://en.wikipedia.org/wiki/Long_Way_Round' },
    ],
    approximate: 'Countries, key places and dates follow public accounts; the exact roads between them are approximate.',
    stops: [
      { q: "Shepherd's Bush, London", name: 'London', date: '14 Apr 2004', wiki: "Shepherd's Bush", text: 'The start, from their workshop in west London: two heavily loaded BMWs, a support crew of two 4x4s, and 19,000 miles ahead.' },
      { q: 'Calais, France', name: 'Calais', by: 'train', wiki: 'Channel Tunnel', text: 'Through the Channel Tunnel by train, one of the few stretches of the trip not ridden.' },
      { q: 'Brussels, Belgium', name: 'Brussels', wiki: 'Grand-Place', text: 'Belgium and Germany pass in a blur of motorway: the easy part, before the real borders begin.' },
      { q: 'Prague, Czech Republic', name: 'Prague', wiki: 'Charles Bridge', text: 'A night in Prague. The Czech exit later cost them a "fine" for a missing stamp in the bikes\' carnet, a first taste of border paperwork.' },
      { q: 'Kutná Hora, Czech Republic', name: 'Kutná Hora', wiki: 'Kutná Hora', text: 'The Church of Bones at Sedlec: a chapel decorated with the bones of tens of thousands of people. A strange, unforgettable stop.' },
      { q: 'Uzhhorod, Ukraine', name: 'Into Ukraine', wiki: 'Uzhhorod', text: 'Across Slovakia and into Ukraine, where roads, signs and border queues change character.' },
      { q: 'Kyiv, Ukraine', name: 'Kyiv', wiki: 'Kyiv', text: 'East across the wide Ukrainian plains towards Russia.' },
      { q: 'Volgograd, Russia', name: 'Volgograd', wiki: 'Mamayev Kurgan', text: 'The old Stalingrad on the Volga, watched over by the giant Motherland Calls statue. Russian visas had been one of the hardest parts of planning.' },
      { q: 'Atyrau, Kazakhstan', at: [47.1067, 51.9139], name: 'Atyrau', wiki: 'Atyrau', text: 'Into Kazakhstan where the Ural river meets the Caspian: the start of thousands of kilometres of steppe, wild camping and broken roads.' },
      { q: 'Almaty, Kazakhstan', name: 'Almaty', wiki: 'Almaty', text: 'Kazakhstan\'s green southern city under the Tian Shan mountains, a rest after the long empty steppe.' },
      { q: 'Semey, Kazakhstan', name: 'Semey', wiki: 'Semey', text: 'North through eastern Kazakhstan towards the Russian Altai.' },
      { q: 'Barnaul, Russia', name: 'Barnaul', wiki: 'Barnaul', text: 'Back into Russia, heading for the Altai mountains and the Mongolian border.' },
      { q: 'Ölgii, Mongolia', name: 'Ölgii', wiki: 'Bayan-Ölgii Province', text: 'Mongolia: no tarmac, few signs, rivers to ford and endless open land. Some of the hardest and most loved days of the trip.' },
      { q: 'Khovd, Mongolia', name: 'Khovd', wiki: 'Khovd (city)', text: 'Sandy tracks and river crossings across western Mongolia. The support truck rolled here; the bikes took a beating too.' },
      { q: 'Ulaanbaatar, Mongolia', name: 'Ulaanbaatar', wiki: 'Ulaanbaatar', text: 'Mongolia\'s capital after weeks of steppe and nights in gers with nomad families.' },
      { q: 'Ulan-Ude, Russia', name: 'Ulan-Ude', wiki: 'Ulan-Ude', text: 'Back into Siberia, near Lake Baikal.' },
      { q: 'Chita, Russia', name: 'Chita', wiki: 'Chita, Zabaykalsky Krai', text: 'East along the Trans-Siberian corridor to where the road ran out.' },
      { q: 'Tynda, Russia', name: 'Tynda', by: 'train', wiki: 'Baikal–Amur Mainline', text: 'The Zilov Gap had no road at all, so bikes and riders took the train for about 930 km.' },
      { q: 'Yakutsk, Russia', name: 'Yakutsk', wiki: 'Yakutsk', text: 'The world\'s coldest big city, and the start of the Kolyma Highway east to the Pacific.' },
      { q: 'Susuman, Russia', name: 'Road of Bones', wiki: 'Kolyma', text: 'The Road of Bones, built by Gulag prisoners. In summer melt the rivers were deep and fast, and some crossings needed a passing truck to carry the bikes.', source: { label: 'Eugene Kaspersky (2026)', url: 'https://eugene.kaspersky.com/2026/04/09/two-attempts-at-the-infamous-abandoned-road-of-bones-in-siberia/' } },
      { q: 'Magadan, Russia', at: [59.5646, 150.8079], name: 'Magadan', wiki: 'Magadan', text: 'The end of the road on the Sea of Okhotsk, with the Mask of Sorrow memorial to the Gulag prisoners. Asia done.' },
      { q: 'Anchorage, Alaska', name: 'Anchorage', by: 'flight', wiki: 'Anchorage, Alaska', text: 'A 4,000 km flight across the Bering Sea from Magadan to Alaska, then back on the bikes.' },
      { q: 'Whitehorse, Yukon', name: 'Whitehorse', wiki: 'Whitehorse', text: 'Down the Alaska Highway into Canada\'s Yukon: big forests, bears, and smooth roads after Siberia.' },
      { q: 'Calgary, Alberta', name: 'Calgary', wiki: 'Calgary', text: 'Out of the Rockies and onto the Canadian prairies.' },
      { q: 'Mount Rushmore, South Dakota', name: 'Mount Rushmore', wiki: 'Mount Rushmore', text: 'Across the border into the US and to the presidents carved into the Black Hills.' },
      { q: 'Chicago, Illinois', name: 'Chicago', wiki: 'Chicago', text: 'The last long days east across the Midwest.' },
      { q: 'New York City', name: 'New York', date: '29 Jul 2004', wiki: 'New York City', text: 'Arrival on schedule, escorted into the city by a crowd of bikers. London to New York, the long way round.' },
    ],
  },
  {
    id: 'long-way-down',
    title: 'Long Way Down',
    who: 'Ewan McGregor & Charley Boorman',
    when: 'May–August 2007',
    vehicle: 'BMW R1200GS Adventure',
    kind: 'moto',
    color: '#b91c1c',
    media: [{"kind": "book", "title": "Long Way Down", "by": "Ewan McGregor & Charley Boorman"}, {"kind": "series", "title": "Long Way Down", "note": "TV series, 2007"}],
    summary: 'From the northern tip of Scotland to Cape Town: down through Europe, across the Mediterranean to North Africa, then the whole length of Africa through eighteen countries, from the Sahara and the Nile to the Rift Valley and the Cape.',
    sources: [
      { label: 'Horizons Unlimited: a classic Cairo to Cape ride tale', url: 'https://horizonsunlimited.com/hubb/ride-tales/a-classic-cairo-to-cape-66602?nojs=1' },
      { label: 'Bikesales: Boorman and McGregor to take the Long Way Down (2007)', url: 'https://www.bikesales.com.au/editorial/details/boorman-and-mcgregor-to-take-the-long-way-down-11949' },
      { label: 'Wikipedia: Long Way Down', url: 'https://en.wikipedia.org/wiki/Long_Way_Down' },
    ],
    approximate: 'Countries, key places and dates follow public accounts; the exact roads between them are approximate.',
    stops: [
      { at: [58.6373, -3.0689], name: "John o' Groats", date: '12 May 2007', wiki: 'Duncansby Head', text: 'The start at the northern tip of mainland Britain, with Cape Town about 24,000 km away.' },
      { q: 'Crieff, Scotland', name: 'Crieff', wiki: 'Crieff', text: 'A night at the McGregor family home in Perthshire on the way south.' },
      { q: 'Silverstone Circuit', name: 'Silverstone', wiki: 'Silverstone Circuit', text: 'Camping in the middle of the famous race circuit.' },
      { q: "Shepherd's Bush, London", name: 'London', wiki: 'London', text: 'Back through London before leaving Britain.' },
      { q: 'Calais, France', name: 'Calais', by: 'train', wiki: 'Channel Tunnel', text: 'Under the Channel by train, then south through France.' },
      { q: 'Palermo, Italy', name: 'Sicily', wiki: 'Palermo', text: 'Down the length of Italy to Sicily, the end of the European leg.' },
      { q: 'Tunis, Tunisia', name: 'Tunis', by: 'ferry', wiki: 'Tunis', text: 'A ferry across the Mediterranean to Africa.' },
      { q: 'Matmata, Tunisia', name: 'Matmata', wiki: 'Hotel Sidi Driss', text: 'The underground Berber homes of Matmata, used as Luke Skywalker\'s home in Star Wars. A treat for the man who played Obi-Wan.' },
      { q: 'Tripoli, Libya', name: 'Tripoli', wiki: 'Red Castle of Tripoli', text: 'Into Libya along the coast. Two of the crew couldn\'t get visas and had to fly round to Egypt.' },
      { q: 'Benghazi, Libya', name: 'Benghazi', wiki: 'Benghazi', text: 'Long, hot desert days along the Gulf of Sidra.' },
      { q: 'Giza, Egypt', name: 'Pyramids of Giza', wiki: 'Giza pyramid complex', text: 'The pyramids, then south along the Nile.' },
      { q: 'Luxor, Egypt', name: 'Luxor', wiki: 'Karnak', text: 'Temples of ancient Thebes on the Nile.' },
      { q: 'Aswan, Egypt', name: 'Aswan', wiki: 'Aswan', text: 'The end of the road south in Egypt: from here the way to Sudan is by boat.' },
      { q: 'Wadi Halfa, Sudan', name: 'Wadi Halfa', by: 'ferry', wiki: 'Lake Nasser', text: 'The ferry down Lake Nasser into Sudan.' },
      { q: 'Khartoum, Sudan', name: 'Khartoum', wiki: 'Khartoum', text: 'Desert tracks and heat to where the Blue and White Nile meet.' },
      { q: 'Gondar, Ethiopia', name: 'Gondar', wiki: 'Gondar', text: 'Up into the Ethiopian highlands: green mountains, castles and crowds of children by the road.' },
      { q: 'Addis Ababa, Ethiopia', name: 'Addis Ababa', wiki: 'Addis Ababa', text: 'Ethiopia\'s capital, high in the mountains.' },
      { q: 'Moyale, Kenya', name: 'Moyale', wiki: 'Moyale, Kenya', text: 'The border into Kenya, and the start of a notorious stretch of rough, rocky road south.' },
      { q: 'Marsabit, Kenya', at: [2.3381, 37.9916], name: 'Marsabit', wiki: 'Marsabit', text: 'Through the remote north of Kenya on dirt and rocks.' },
      { q: 'Nanyuki, Kenya', name: 'The equator', wiki: 'Nanyuki', text: 'Crossing the equator near Mount Kenya: into the southern hemisphere.' },
      { q: 'Kampala, Uganda', name: 'Kampala', wiki: 'Kampala', text: 'West into Uganda and its green hills.' },
      { q: 'Kigali, Rwanda', name: 'Kigali', wiki: 'Kigali', text: 'Rwanda, where they met President Paul Kagame.' },
      { q: 'Arusha, Tanzania', name: 'Arusha', wiki: 'Arusha', text: 'Tanzania, between Kilimanjaro and the great parks of the north.' },
      { q: 'Lilongwe, Malawi', name: 'Malawi', wiki: 'Lake Malawi', text: 'Malawi, where Ewan\'s wife Eve joined the ride.' },
      { q: 'Lusaka, Zambia', name: 'Lusaka', wiki: 'Lusaka', text: 'South-west across Zambia.' },
      { q: 'Livingstone, Zambia', name: 'Victoria Falls', wiki: 'Victoria Falls', text: 'The smoke that thunders, on the Zambezi.' },
      { q: 'Maun, Botswana', name: 'Botswana', wiki: 'Okavango Delta', text: 'The edge of the Okavango Delta and the Kalahari.' },
      { q: 'Windhoek, Namibia', name: 'Namibia', wiki: 'Namib', text: 'Gravel roads through Namibia\'s huge, empty desert landscapes.' },
      { q: 'Cape Agulhas, South Africa', name: 'Cape Agulhas', wiki: 'Cape Agulhas', text: 'The southernmost point of Africa, where the Atlantic and Indian oceans meet.' },
      { q: 'Cape Town, South Africa', name: 'Cape Town', date: '4 Aug 2007', wiki: 'Cape Town', text: 'The finish, escorted into Cape Town by a crowd of local riders.' },
    ],
  },
  {
    id: 'long-way-up',
    title: 'Long Way Up',
    who: 'Ewan McGregor & Charley Boorman',
    when: 'September–December 2019',
    vehicle: 'Harley-Davidson LiveWire (electric)',
    kind: 'moto',
    color: '#0e7490',
    media: [{"kind": "series", "title": "Long Way Up", "note": "TV series, Apple TV+, 2020"}],
    summary: 'From Ushuaia at the tip of South America to Los Angeles on prototype electric motorcycles: Patagonia, the Andes and the Atacama, the salt flats of Bolivia, Peru, Ecuador and Colombia, then up through Central America and Mexico. About 21,000 km, with range anxiety all the way.',
    sources: [
      { label: 'Overland Expo: takeaways from the 13,000-mile all-electric journey', url: 'https://www.overlandexpo.com/compass/rivian-r1t-13000-mile-long-way-up' },
      { label: 'The Vintagent: the Long Way Up LiveWire', url: 'https://thevintagent.com/the-long-way-up-livewire/' },
      { label: 'Wikipedia: Long Way Up (route by episode)', url: 'https://en.wikipedia.org/wiki/Long_Way_Up' },
    ],
    approximate: 'Places follow the published route by episode; the exact roads between them are approximate.',
    stops: [
      { q: 'Ushuaia, Argentina', name: 'Ushuaia', date: 'Sep 2019', wiki: 'Ushuaia', text: 'The start at the end of the world, in winter snow, on two electric Harleys adapted for gravel.' },
      { q: 'Tolhuin, Argentina', name: 'Tolhuin', wiki: 'Tolhuin', text: 'North on Ruta 3 across Tierra del Fuego.' },
      { at: [-53.38, -69.29], name: 'Onaisin', wiki: 'Inútil Bay', text: 'Into Chile and down a gravel road to the king penguins of Inútil Bay. Charging from weak sockets didn\'t work: the first range scare.' },
      { q: 'Porvenir, Chile', name: 'Porvenir', wiki: 'Porvenir, Chile', text: 'The ferry port on Tierra del Fuego.' },
      { q: 'Punta Arenas, Chile', name: 'Punta Arenas', by: 'ferry', wiki: 'Strait of Magellan', text: 'Across the Strait of Magellan to the mainland.' },
      { at: [-50.95, -72.87], name: 'Torres del Paine', wiki: 'Torres del Paine National Park', text: 'Two days among the granite towers of Chilean Patagonia.' },
      { q: 'El Calafate, Argentina', name: 'El Calafate', wiki: 'Perito Moreno Glacier', text: 'Back into Argentina and a rest day at the Perito Moreno glacier.' },
      { q: 'Tres Lagos, Argentina', name: 'Ruta 40', wiki: 'National Route 40 (Argentina)', text: 'North on the legendary Ruta 40 through windswept Patagonian steppe.' },
      { q: 'Perito Moreno, Santa Cruz, Argentina', name: 'Perito Moreno', wiki: 'Perito Moreno, Santa Cruz', text: 'A small town on Ruta 40 before crossing west into Chile.' },
      { q: 'Villa Mañihuales, Chile', name: 'Carretera Austral', wiki: 'Carretera Austral', text: 'The Carretera Austral: gravel through rainforest, fjords and hanging glaciers.' },
      { q: 'Puyuhuapi, Chile', name: 'Puyuhuapi', wiki: 'Puyuhuapi', text: 'A fishing village at the end of a fjord.' },
      { q: 'Chaitén, Chile', name: 'Chaitén', wiki: 'Chaitén', text: 'The town rebuilt after its volcano erupted in 2008; from here a ferry north.' },
      { q: 'Puerto Montt, Chile', name: 'Puerto Montt', by: 'ferry', wiki: 'Puerto Montt', text: 'By ferry to Puerto Montt and back towards the Andes.' },
      { q: 'Villa La Angostura, Argentina', name: 'Villa La Angostura', wiki: 'Nahuel Huapi Lake', text: 'Over the Cardenal Samoré pass to the Argentine lakes.' },
      { q: 'Aluminé, Argentina', name: 'Aluminé', wiki: 'Lanín National Park', text: 'Araucaria forests and gravel roads in Neuquén.' },
      { q: 'Zapala, Argentina', name: 'Zapala', wiki: 'Zapala', text: 'Back onto Ruta 40, heading north along the Andes.' },
      { q: 'Malargüe, Argentina', name: 'Malargüe', wiki: 'Malargüe', text: 'Volcanic landscapes of southern Mendoza.' },
      { q: 'San Juan, Argentina', name: 'San Juan', wiki: 'San Juan, Argentina', text: 'Wine country and desert foothills.' },
      { q: 'Villa Unión, La Rioja, Argentina', name: 'Villa Unión', wiki: 'Talampaya National Park', text: 'Red canyons near Talampaya.' },
      { q: 'Belén, Catamarca, Argentina', name: 'Belén', wiki: 'Belén, Catamarca', text: 'The end of the Andes chapter.' },
      { q: 'San Antonio de los Cobres, Argentina', name: 'San Antonio de los Cobres', wiki: 'San Antonio de los Cobres', text: 'A mining town at almost 3,800 m on the Puna.' },
      { q: 'San Pedro de Atacama, Chile', name: 'San Pedro de Atacama', wiki: 'Atacama Desert', text: 'Over the high Sico pass into the Atacama, the driest desert on earth.' },
      { at: [-22.2, -67.78], name: 'Laguna Colorada', wiki: 'Eduardo Avaroa Andean Fauna National Reserve', text: 'Into Bolivia on high-altitude tracks past flamingo lakes, cold and thin air hard on riders and batteries.' },
      { q: 'Uyuni, Bolivia', name: 'Salar de Uyuni', wiki: 'Salar de Uyuni', text: 'Riding across the world\'s largest salt flat.' },
      { q: 'La Paz, Bolivia', name: 'La Paz', wiki: 'La Paz', text: 'The world\'s highest capital, in a canyon below El Alto.' },
      { q: 'Copacabana, Bolivia', name: 'Lake Titicaca', wiki: 'Lake Titicaca', text: 'Across a strait of Lake Titicaca on a wooden barge.' },
      { q: 'Puno, Peru', at: [-15.8407, -70.0284], name: 'Puno', wiki: 'Puno', text: 'Into Peru on the shore of the lake.' },
      { q: 'Cusco, Peru', name: 'Cusco', wiki: 'Cusco', text: 'The old Inca capital.' },
      { q: 'Ollantaytambo, Peru', name: 'Ollantaytambo', wiki: 'Ollantaytambo', text: 'Inca terraces in the Sacred Valley.' },
      { q: 'Ayacucho, Peru', at: [-13.1604, -74.2257], name: 'Ayacucho', wiki: 'Ayacucho', text: 'Twisting mountain roads across the Peruvian Andes.' },
      { q: 'Ica, Peru', at: [-14.0641, -75.7291], name: 'Ica', wiki: 'Ica, Peru', text: 'Down to the desert coast and its giant dunes.' },
      { q: 'Tumbes, Peru', at: [-3.5708, -80.4596], name: 'Tumbes', wiki: 'Tumbes, Peru', text: 'North along the Pacific to the Ecuador border.' },
      { q: 'Guayaquil, Ecuador', name: 'Guayaquil', wiki: 'Guayaquil', text: 'Mobbed by Star Wars fans in Ecuador\'s biggest city.' },
      { q: 'Montecristi, Ecuador', name: 'Montecristi', wiki: 'Panama hat', text: 'Where "Panama" hats are really woven by hand.' },
      { q: 'Tulcán, Ecuador', at: [0.8116, -77.7172], name: 'Tulcán', wiki: 'Carchi Province', text: 'Near the Colombian border Ewan\'s bike failed; he finished the day riding Claudio\'s bike two-up.' },
      { q: 'Ipiales, Colombia', name: 'Las Lajas', wiki: 'Las Lajas Shrine', text: 'A detour to the Las Lajas shrine, built across a gorge.' },
      { q: 'Pasto, Colombia', name: 'Pasto', wiki: 'Pasto, Colombia', text: 'Weather delays at the airport, with a boat to catch.' },
      { q: 'Buenaventura, Colombia', name: 'Buenaventura', by: 'flight', wiki: 'Buenaventura, Valle del Cauca', text: 'No road through the Darién Gap: a small plane to the Pacific coast…' },
      { q: 'Bahía Solano, Colombia', name: 'Bahía Solano', by: 'boat', wiki: 'Bahía Solano', text: '…then a boat up the jungle coast…' },
      { q: 'Panama City', at: [8.9714, -79.5342], name: 'Panama City', by: 'flight', wiki: 'Panama City', text: '…and flights on to Panama City and Central America.' },
      { q: 'San José, Costa Rica', name: 'San José', wiki: 'San José, Costa Rica', text: 'Up the Pan-American Highway into Costa Rica.' },
      { q: 'Granada, Nicaragua', name: 'Granada', wiki: 'Granada, Nicaragua', text: 'Colonial streets on Lake Nicaragua.' },
      { q: 'San Pedro Sula, Honduras', name: 'San Pedro Sula', wiki: 'San Pedro Sula', text: 'A fast run across Honduras.' },
      { q: 'Panajachel, Guatemala', name: 'Lake Atitlán', wiki: 'Lake Atitlán', text: 'The volcano-ringed lake in the Guatemalan highlands.' },
      { q: 'San Cristóbal de las Casas, Mexico', name: 'San Cristóbal', wiki: 'San Cristóbal de las Casas', text: 'Into Mexico through the mountains of Chiapas.' },
      { q: 'Oaxaca, Mexico', name: 'Oaxaca', wiki: 'Oaxaca City', text: 'Food, mezcal and colour in Oaxaca.' },
      { q: 'Teotihuacan, Mexico', name: 'Teotihuacan', wiki: 'Teotihuacan', text: 'The Pyramid of the Sun.' },
      { q: 'Chihuahua, Mexico', name: 'Chihuahua', wiki: 'Chihuahua (city)', text: 'North across the Mexican plateau.' },
      { q: 'El Paso, Texas', name: 'El Paso', wiki: 'El Paso, Texas', text: 'Across the border into the United States.' },
      { q: 'Palm Springs, California', name: 'Palm Springs', wiki: 'Palm Springs, California', text: 'West along Interstate 10 through the desert.' },
      { q: 'Los Angeles', name: 'Los Angeles', date: 'Dec 2019', wiki: 'Los Angeles', text: 'The finish, about 100 days and 21,000 km after Ushuaia.' },
    ],
  },
  {
    id: 'motorcycle-diaries',
    title: 'The Motorcycle Diaries',
    who: 'Ernesto "Che" Guevara & Alberto Granado',
    when: 'January–July 1952',
    vehicle: '1939 Norton 500 "La Poderosa II"',
    kind: 'moto',
    color: '#4d7c0f',
    media: [{"kind": "book", "title": "The Motorcycle Diaries", "by": "Ernesto Che Guevara"}, {"kind": "film", "title": "The Motorcycle Diaries", "note": "Film by Walter Salles, 2004"}],
    summary: 'Two young Argentines set off from Buenos Aires on an old Norton to see the continent. The bike died in Chile; they carried on by truck, ship, raft and plane through the Andes, the Atacama, Machu Picchu and the Amazon, a trip that changed one of them for ever.',
    sources: [
      { label: 'Motorcycle Classics: the route ridden again on period Norton 500s', url: 'https://www.motorcycleclassics.com/classic-motorcycle-touring/norton-500-zm0z12mazbea/' },
      { label: 'Horizons Unlimited: Chasing Che, the route retraced on a BMW', url: 'https://horizonsunlimited.com/node/377' },
      { label: 'Wikipedia: The Motorcycle Diaries (book)', url: 'https://en.wikipedia.org/wiki/The_Motorcycle_Diaries_(book)' },
    ],
    approximate: 'Places follow the diary and later accounts; the roads of 1952 are drawn on today\'s roads.',
    stops: [
      { q: 'Buenos Aires, Argentina', name: 'Buenos Aires', date: 'Jan 1952', wiki: 'Buenos Aires', text: 'The start on La Poderosa II ("the Mighty One"), a 1939 Norton 500 loaded far beyond reason.' },
      { q: 'Miramar, Buenos Aires', name: 'Miramar', wiki: 'General Alvarado Partido', text: 'A seaside stop to see Ernesto\'s girlfriend Chichina. Two days became eight.' },
      { q: 'Bahía Blanca, Argentina', name: 'Bahía Blanca', wiki: 'Bahía Blanca', text: 'South-west across the pampas, with falls and repairs along the way.' },
      { q: 'Choele Choel, Argentina', name: 'Choele Choel', wiki: 'Choele Choel', text: 'Ernesto fell ill with fever and spent days in hospital here.' },
      { q: 'San Martín de los Andes, Argentina', name: 'San Martín de los Andes', wiki: 'San Martín de los Andes', text: 'Lakes and forests at the foot of the Andes.' },
      { q: 'San Carlos de Bariloche, Argentina', name: 'Bariloche', wiki: 'Nahuel Huapi Lake', text: 'The last Argentine town before crossing the Andes into Chile.' },
      { q: 'Osorno, Chile', name: 'Osorno', by: 'boat', wiki: 'Todos los Santos Lake', text: 'Across the lakes by boat into Chile, mid-February 1952.' },
      { q: 'Temuco, Chile', name: 'Temuco', wiki: 'Temuco', text: 'A local paper wrote them up as leprosy experts; the clipping earned meals for weeks.' },
      { q: 'Los Ángeles, Chile', name: 'Los Ángeles', wiki: 'Los Ángeles, Chile', text: 'The Norton was failing; one breakdown after another.' },
      { q: 'Santiago, Chile', name: 'Santiago', wiki: 'Santiago', text: 'La Poderosa was finally given up. From here on: hitching, trucks and boats.' },
      { q: 'Valparaíso, Chile', name: 'Valparaíso', by: 'truck', wiki: 'Valparaíso', text: 'The port city on its hills, and the poverty in its lower streets.' },
      { q: 'Antofagasta, Chile', name: 'Antofagasta', by: 'boat', wiki: 'Antofagasta', text: 'North as stowaways on a cargo ship, working their passage once discovered.' },
      { q: 'Chuquicamata, Chile', name: 'Chuquicamata', by: 'truck', wiki: 'Calama, Chile', text: 'The vast copper mine in the Atacama, and the miners who worked it.' },
      { q: 'Arica, Chile', name: 'Arica', by: 'truck', wiki: 'Arica', text: 'North through the desert to the Peruvian border.' },
      { q: 'Puno, Peru', at: [-15.8407, -70.0284], name: 'Puno', by: 'truck', wiki: 'Lake Titicaca', text: 'Up onto the altiplano on trucks, beside Lake Titicaca.' },
      { q: 'Cusco, Peru', name: 'Cusco', by: 'truck', wiki: 'Cusco', text: 'The Inca capital and its Spanish churches built on Inca walls.' },
      { q: 'Machu Picchu, Peru', name: 'Machu Picchu', by: 'train', wiki: 'Machu Picchu', text: 'The lost city above the Urubamba: a high point of the journey.' },
      { q: 'Abancay, Peru', name: 'Abancay', by: 'truck', wiki: 'Abancay', text: 'Back across the Andes towards Lima.' },
      { q: 'Lima, Peru', name: 'Lima', by: 'truck', wiki: 'Lima', text: 'Weeks with Dr Hugo Pesce, the leprosy specialist who sent them on to the Amazon.' },
      { q: 'Pucallpa, Peru', name: 'Pucallpa', by: 'truck', wiki: 'Pucallpa', text: 'Over the mountains to the edge of the jungle.' },
      { q: 'Iquitos, Peru', name: 'Iquitos', by: 'boat', wiki: 'Iquitos', text: 'Down the Ucayali by river boat to the Amazon.' },
      { at: [-3.78, -70.67], name: 'San Pablo leper colony', by: 'boat', wiki: 'Amazon River', text: 'Weeks working at the leper colony. On Ernesto\'s 24th birthday he swam the Amazon to the patients\' side.' },
      { q: 'Leticia, Colombia', name: 'Leticia', by: 'boat', wiki: 'Leticia, Amazonas', text: 'Downriver on a raft the patients built for them, the Mambo-Tango.' },
      { q: 'Bogotá, Colombia', name: 'Bogotá', by: 'flight', wiki: 'Bogotá', text: 'A flight to Bogotá, in a tense Colombia.' },
      { q: 'Caracas, Venezuela', name: 'Caracas', date: 'Jul 1952', by: 'truck', wiki: 'Caracas', text: 'By road to Caracas, where the two friends parted.' },
    ],
  },
  {
    id: 'jupiters-travels',
    title: "Jupiter's Travels",
    who: 'Ted Simon',
    when: '1973–1977',
    vehicle: 'Triumph Tiger 100 (500 cc)',
    kind: 'moto',
    color: '#7c3aed',
    media: [{"kind": "book", "title": "Jupiter's Travels", "by": "Ted Simon"}, {"kind": "book", "title": "Dreaming of Jupiter", "by": "Ted Simon", "note": "The same journey again, 27 years later"}],
    summary: 'A journalist rides alone round the world: four years, about 126,000 km and 45 countries, the length of Africa, South and North America, Australia and Asia. The book became the bible of round-the-world motorcycling.',
    sources: [
      { label: 'Adventure Bike Rider: an interview with Ted Simon', url: 'https://www.adventurebikerider.com/an-interview-with-ted-simon/' },
      { label: 'Jupitalia: about Ted Simon', url: 'https://jupitalia.com/about-ted-simon/' },
      { label: "Wikipedia: Jupiter's Travels", url: "https://en.wikipedia.org/wiki/Jupiter%27s_Travels" },
    ],
    approximate: 'Only the main stages are shown, from public accounts of the book; the route between them is approximate.',
    stops: [
      { q: 'London', name: 'London', date: '6 Oct 1973', wiki: 'Triumph Tiger 100', text: 'Ted Simon leaves alone on a Triumph Tiger 100, sponsored by a newspaper, with no clear idea of what lies ahead.' },
      { q: 'Tunis, Tunisia', name: 'Tunisia', by: 'ferry', wiki: 'Tunis', text: 'Across France and Italy and over the sea to Africa.' },
      { q: 'Cairo, Egypt', name: 'Egypt', wiki: 'Cairo', text: 'Along North Africa to the Nile.' },
      { q: 'Khartoum, Sudan', name: 'Sudan', wiki: 'Khartoum', text: 'South through the Sudanese desert.' },
      { q: 'Addis Ababa, Ethiopia', name: 'Ethiopia', wiki: 'Addis Ababa', text: 'The Ethiopian highlands, in a country on the edge of revolution.' },
      { q: 'Nairobi, Kenya', name: 'Kenya', wiki: 'Nairobi', text: 'East Africa, then on south through Tanzania and Zambia.' },
      { q: 'Cape Town, South Africa', name: 'Cape Town', wiki: 'Cape Town', text: 'The end of Africa. Bike and rider take a ship across the South Atlantic.' },
      { q: 'Fortaleza, Brazil', name: 'Brazil', by: 'boat', wiki: 'Fortaleza', text: 'A new continent, and months riding through Brazil.' },
      { q: 'Buenos Aires, Argentina', name: 'Argentina', wiki: 'Buenos Aires', text: 'South to Argentina, then west to the Andes.' },
      { q: 'Santiago, Chile', name: 'Chile', wiki: 'Santiago', text: 'Over the Andes into Chile.' },
      { q: 'La Paz, Bolivia', name: 'Bolivia', wiki: 'La Paz', text: 'North on the altiplano.' },
      { q: 'Lima, Peru', name: 'Peru', wiki: 'Lima', text: 'North through Peru.' },
      { q: 'Bogotá, Colombia', name: 'Colombia', wiki: 'Bogotá', text: 'Up through Ecuador and Colombia.' },
      { q: 'Mexico City', name: 'Mexico', by: 'boat', wiki: 'Mexico City', text: 'Around the Darién Gap by sea, then up through Central America and Mexico.' },
      { q: 'San Francisco', name: 'California', wiki: 'San Francisco', text: 'A long stay in California before crossing the Pacific.' },
      { q: 'Sydney, Australia', name: 'Australia', by: 'boat', wiki: 'Sydney', text: 'By ship to Australia, and a ride across it.' },
      { q: 'Singapore', name: 'Singapore', by: 'boat', wiki: 'Singapore', text: 'On to South-East Asia.' },
      { q: 'Bangkok, Thailand', name: 'Thailand', wiki: 'Bangkok', text: 'North through Malaysia and Thailand.' },
      { q: 'Chennai, India', name: 'India', by: 'boat', wiki: 'Chennai', text: 'Months in India, the part of the journey that changed him most.' },
      { q: 'Delhi, India', name: 'Delhi', wiki: 'Delhi', text: 'North towards the overland route home.' },
      { q: 'Kabul, Afghanistan', name: 'Afghanistan', wiki: 'Kabul', text: 'Through Pakistan and Afghanistan on the old overland trail.' },
      { q: 'Tehran, Iran', name: 'Iran', wiki: 'Tehran', text: 'Across Iran.' },
      { q: 'Istanbul, Turkey', name: 'Istanbul', wiki: 'Istanbul', text: 'Back into Europe.' },
      { q: 'London', name: 'London', date: '1977', wiki: 'London', text: 'Home after four years and 45 countries.' },
    ],
  },
  // ---- Old travels ----
  {
    id: 'marco-polo',
    title: 'The Travels of Marco Polo',
    who: 'Marco Polo, with his father and uncle',
    when: '1271–1295',
    vehicle: 'On foot, horse and camel caravans; home by sea',
    kind: 'other',
    color: '#92400e',
    media: [{"kind": "book", "title": "The Travels of Marco Polo", "by": "Marco Polo"}, {"kind": "free", "title": "The Travels of Marco Polo", "note": "Old translations, free on Project Gutenberg", "url": "https://www.gutenberg.org/ebooks/search/?query=travels+of+marco+polo"}],
    summary: 'A young Venetian sets out with his merchant father and uncle along the Silk Road to the court of Kublai Khan, serves him for years, and returns by sea through Southeast Asia and India. His book opened Asia to European imagination for centuries.',
    sources: [
      { label: 'Britannica: Marco Polo', url: 'https://www.britannica.com/biography/Marco-Polo' },
      { label: 'World History Encyclopedia: Marco Polo', url: 'https://www.worldhistory.org/Marco_Polo/' },
      { label: 'Wikipedia: Marco Polo', url: 'https://en.wikipedia.org/wiki/Marco_Polo' },
    ],
    approximate: 'Historians reconstruct the route from the book; places are approximate and some are debated. Drawn on today\'s roads and sea lanes.',
    stops: [
      { q: 'Venice, Italy', name: 'Venice', date: '1271', wiki: 'Venice', text: 'Seventeen-year-old Marco leaves Venice with his father Niccolò and uncle Maffeo, who had already been to China.' },
      { q: 'Acre, Israel', name: 'Acre', by: 'boat', wiki: 'Acre, Israel', text: 'By ship across the Mediterranean to the crusader port of Acre.' },
      { at: [36.77, 35.79], name: 'Ayas', by: 'boat', wiki: 'Yumurtalık', text: 'Landing at Ayas, a busy trading port, to start overland.' },
      { q: 'Tabriz, Iran', name: 'Tabriz', wiki: 'Tabriz', text: 'A great trading city of Persia, full of merchants from everywhere.' },
      { q: 'Kerman, Iran', name: 'Kerman', wiki: 'Kerman', text: 'South across Persia towards the sea.' },
      { at: [27.07, 56.46], name: 'Hormuz', wiki: 'Hormuz Island', text: 'They hoped to sail from Hormuz, judged the ships unsafe, and turned back overland.' },
      { q: 'Balkh, Afghanistan', name: 'Balkh', wiki: 'Balkh', text: 'The ancient "mother of cities", still in ruins after the Mongol conquest.' },
      { q: 'Ishkashim, Afghanistan', name: 'Badakhshan & the Pamirs', wiki: 'Wakhan Corridor', text: 'Over the high Pamirs, where Marco describes great wild sheep, later named after him.' },
      { q: 'Kashgar, China', name: 'Kashgar', wiki: 'Kashgar', text: 'An oasis town at the western end of the Taklamakan.' },
      { q: 'Hotan, China', name: 'Khotan', wiki: 'Hotan', text: 'Along the southern edge of the desert, famous for jade.' },
      { at: [39.02, 88.17], name: 'Lop desert', wiki: 'Taklamakan Desert', text: 'A month-long desert crossing, with tales of spirit voices luring travellers away.' },
      { q: 'Dunhuang, China', name: 'Dunhuang', wiki: 'Mogao Caves', text: 'Into China proper at the edge of the desert.' },
      { at: [42.36, 116.18], name: 'Shangdu (Xanadu)', date: '1275', wiki: 'Shangdu', text: 'Kublai Khan\'s summer capital, where they are received in 1275 (some scholars say 1274), about three and a half years after leaving Venice.' },
      { q: 'Beijing, China', name: 'Khanbaliq (Beijing)', wiki: 'Khanbaliq', text: 'Years in the Khan\'s service, sent on missions across his empire.' },
      { q: 'Quanzhou, China', at: [24.8755, 118.6724], name: 'Zaiton (Quanzhou)', wiki: 'Quanzhou', text: 'They finally leave, escorting a Mongol princess by sea to Persia.' },
      { q: 'Lhokseumawe, Indonesia', name: 'Sumatra', by: 'boat', wiki: 'Samudera Pasai Sultanate', text: 'Months in Sumatra waiting for the monsoon winds.' },
      { q: 'Colombo, Sri Lanka', name: 'Sri Lanka', by: 'boat', wiki: 'Sri Lanka', text: 'Across the Bay of Bengal, then along the coast of India.' },
      { at: [27.07, 56.46], name: 'Hormuz', by: 'boat', wiki: 'Strait of Hormuz', text: 'Back in Persia by sea, two years after leaving China.' },
      { q: 'Trabzon, Turkey', name: 'Trebizond', wiki: 'Trabzon', text: 'Overland to the Black Sea.' },
      { q: 'Venice, Italy', name: 'Venice', date: '1295', by: 'boat', wiki: 'Grand Canal (Venice)', text: 'Home after 24 years, then captured in a sea war with Genoa, where he dictates his book in prison.' },
    ],
  },
  {
    id: 'a-time-of-gifts',
    title: 'A Time of Gifts: on foot to Constantinople',
    who: 'Patrick Leigh Fermor',
    when: '1933–1935',
    vehicle: 'On foot (and the odd lift)',
    kind: 'walk',
    color: '#9f1239',
    media: [{"kind": "book", "title": "A Time of Gifts", "by": "Patrick Leigh Fermor"}, {"kind": "book", "title": "Between the Woods and the Water", "by": "Patrick Leigh Fermor"}, {"kind": "book", "title": "The Broken Road", "by": "Patrick Leigh Fermor"}],
    summary: 'At eighteen, Patrick Leigh Fermor walks from the Hook of Holland to Constantinople, sleeping in barns, monasteries and castles across a Europe on the eve of war. His books, written decades later, are among the finest travel writing ever.',
    sources: [
      { label: 'Intrepid Times: interview with Nick Hunt, who walked the route again', url: 'https://intrepidtimes.com/2016/08/nick-hunt/' },
      { label: 'Patrick Leigh Fermor Society blog: In Paddy\'s Footsteps', url: 'https://patrickleighfermor.org/category/in-paddys-footsteps/' },
      { label: 'Wikipedia: A Time of Gifts', url: 'https://en.wikipedia.org/wiki/A_Time_of_Gifts' },
    ],
    approximate: 'Main places from his three books; the paths between them are approximate.',
    stops: [
      { q: 'Hook of Holland', name: 'Hook of Holland', date: 'Dec 1933', wiki: 'Hook of Holland', text: 'Landing from London on a rainy December night, with a rucksack and very little money.' },
      { q: 'Rotterdam, Netherlands', name: 'Rotterdam', wiki: 'Rotterdam', text: 'The first steps east through the Dutch winter.' },
      { q: 'Cologne, Germany', name: 'Cologne', wiki: 'Cologne Cathedral', text: 'Up the Rhine, with Christmas and the cathedral in Cologne.' },
      { q: 'Heidelberg, Germany', name: 'Heidelberg', wiki: 'Heidelberg', text: 'New Year in the old university town.' },
      { q: 'Munich, Germany', name: 'Munich', wiki: 'Munich', text: 'A Germany already changing under the new regime.' },
      { q: 'Melk, Austria', name: 'Melk', wiki: 'Melk Abbey', text: 'Down the Danube valley past its great baroque abbeys.' },
      { q: 'Vienna, Austria', name: 'Vienna', wiki: 'Vienna', text: 'Weeks in Vienna, earning a little by sketching portraits.' },
      { q: 'Bratislava, Slovakia', name: 'Bratislava', wiki: 'Bratislava Castle', text: 'Into Czechoslovakia, with a detour to Prague.' },
      { q: 'Esztergom, Hungary', name: 'Esztergom', wiki: 'Esztergom Basilica', text: 'The end of the first book: Easter on the bridge into Hungary.' },
      { q: 'Budapest, Hungary', name: 'Budapest', wiki: 'Budapest', text: 'Hungary, on horseback across the Great Plain, staying with country families.' },
      { q: 'Cluj-Napoca, Romania', name: 'Transylvania', wiki: 'Transylvania', text: 'Summer among the forests and manor houses of Transylvania.' },
      { q: 'Orșova, Romania', name: 'The Iron Gates', wiki: 'Iron Gates', text: 'The Danube gorge, and the island of Ada Kaleh, later drowned by a dam.' },
      { q: 'Plovdiv, Bulgaria', name: 'Bulgaria', wiki: 'Plovdiv', text: 'South through Bulgaria in the autumn.' },
      { q: 'Istanbul, Turkey', name: 'Constantinople', date: 'Jan 1935', wiki: 'Hagia Sophia', text: 'Arrival on New Year\'s Day 1935, more than a year after setting out.' },
    ],
  },
  {
    id: 'thomas-stevens',
    title: 'Around the World on a Bicycle',
    who: 'Thomas Stevens',
    when: '1884–1886',
    vehicle: 'Columbia penny-farthing (high-wheeler)',
    kind: 'bike',
    color: '#475569',
    media: [{"kind": "free", "title": "Around the World on a Bicycle", "by": "Thomas Stevens", "note": "1887, free on Project Gutenberg", "url": "https://www.gutenberg.org/ebooks/search/?query=around+the+world+on+a+bicycle+stevens"}],
    summary: 'The first person to cycle round the world, on a high-wheeled penny-farthing with no gears and solid tyres: across the American West, Europe, Turkey and Persia, then India, China and Japan. The bikepacking pioneer.',
    sources: [
      { label: 'Berkhamsted Local History: Thomas Stevens crosses America by bicycle', url: 'https://berkhamsted-history.org.uk/thomas-stevens-a-berkhamsted-pioneer-crosses-america-by-bicycle/' },
      { label: 'Scroll.in: India through the eyes of the first round-the-world cyclist', url: 'https://scroll.in/global/1023115/a-land-of-colours-india-through-the-eyes-of-the-first-cyclist-to-circumnavigate-the-world' },
      { label: 'Wikipedia: Thomas Stevens (cyclist)', url: 'https://en.wikipedia.org/wiki/Thomas_Stevens_(cyclist)' },
    ],
    approximate: 'Main places from his book; the roads between them are approximate.',
    stops: [
      { q: 'San Francisco', name: 'San Francisco', date: '22 Apr 1884', wiki: 'Penny-farthing', text: 'Off from San Francisco on a 50-inch Columbia high-wheeler, with a change of socks and a revolver.' },
      { q: 'Laramie, Wyoming', name: 'The Rockies', wiki: 'Laramie, Wyoming', text: 'Across the Sierra and the deserts, often pushing the bike along railway tracks.' },
      { q: 'Chicago', name: 'Chicago', wiki: 'Chicago', text: 'Over the plains to the Great Lakes.' },
      { q: 'Boston', name: 'Boston', date: '4 Aug 1884', wiki: 'Boston', text: 'About 3,700 miles and 103 days after San Francisco, much of it pushed on foot: the first crossing of America by bicycle. He then decided to keep going round the world.', source: { label: 'Berkhamsted Local History', url: 'https://berkhamsted-history.org.uk/thomas-stevens-a-berkhamsted-pioneer-crosses-america-by-bicycle/' } },
      { q: 'Liverpool', name: 'Liverpool', by: 'boat', wiki: 'Liverpool', text: 'By steamer to England.' },
      { q: 'Vienna, Austria', name: 'Vienna', wiki: 'Vienna', text: 'Across England, France and Germany to the Danube.' },
      { q: 'Istanbul, Turkey', name: 'Constantinople', wiki: 'Istanbul', text: 'Through the Balkans to the Bosphorus.' },
      { q: 'Ankara, Turkey', name: 'Anatolia', wiki: 'Ankara', text: 'Across Anatolia, where crowds gathered to see the strange machine.' },
      { q: 'Tehran, Iran', name: 'Tehran', wiki: 'Tehran', text: 'Winter in Persia as a guest of the Shah\'s court. Refused passage through Afghanistan, he turned back.' },
      { q: 'Kolkata, India', name: 'India', by: 'boat', wiki: 'Grand Trunk Road', text: 'By sea to India, then riding the Grand Trunk Road.', source: { label: 'Scroll.in', url: 'https://scroll.in/global/1023115/a-land-of-colours-india-through-the-eyes-of-the-first-cyclist-to-circumnavigate-the-world' } },
      { q: 'Hong Kong', name: 'Hong Kong', by: 'boat', wiki: 'Hong Kong', text: 'On to China by ship.' },
      { q: 'Shanghai, China', name: 'China', wiki: 'Shanghai', text: 'A hard, sometimes hostile ride through southern China.' },
      { q: 'Yokohama, Japan', name: 'Yokohama', date: '17 Dec 1886', by: 'boat', wiki: 'Yokohama', text: 'Across Japan to Yokohama, the end of the first ride round the world by bicycle.' },
    ],
  },

  // ---- Bikepacking classics ----
  {
    id: 'tour-divide',
    title: 'Tour Divide (Great Divide Route)',
    who: 'Classic bikepacking route; race since 2008',
    when: 'Since 2008',
    vehicle: 'Mountain or gravel bike',
    kind: 'bike',
    color: '#15803d',
    media: [{"kind": "film", "title": "Ride the Divide", "note": "Documentary, 2010"}],
    summary: 'About 4,400 km of mostly gravel along the Rocky Mountains, from Banff in Canada to the Mexican border, crossing the Continental Divide again and again. The world\'s best-known bikepacking route: the fastest racers now finish in under twelve days; most riders take two months.',
    sources: [
      { label: 'bikepacking.com: Robin Gemperle wins the 2025 Tour Divide', url: 'https://bikepacking.com/news/robin-gemperle-wins-the-2025-tour-divide/' },
      { label: 'Wikipedia: Tour Divide', url: 'https://en.wikipedia.org/wiki/Tour_Divide' },
      { label: 'Wikipedia: Great Divide Mountain Bike Route', url: 'https://en.wikipedia.org/wiki/Great_Divide_Mountain_Bike_Route' },
    ],
    approximate: 'Towns on the route; the line between them follows roads, not the exact gravel tracks (use the official maps to ride it).',
    stops: [
      { q: 'Banff, Alberta', name: 'Banff', wiki: 'Banff, Alberta', text: 'The start in the Canadian Rockies, in June, often with snow still on the passes.' },
      { q: 'Elkford, British Columbia', name: 'Elkford', wiki: 'Elk Valley (British Columbia)', text: 'Remote forest roads in grizzly country.' },
      { q: 'Fernie, British Columbia', name: 'Fernie', wiki: 'Fernie, British Columbia', text: 'A mountain town before the US border.' },
      { q: 'Eureka, Montana', name: 'Eureka', wiki: 'Eureka, Montana', text: 'Into Montana at the Roosville crossing.' },
      { q: 'Whitefish, Montana', name: 'Whitefish', wiki: 'Whitefish, Montana', text: 'Near Glacier National Park.' },
      { q: 'Seeley Lake, Montana', name: 'Seeley Lake', wiki: 'Seeley Lake, Montana', text: 'Lakes and forest tracks south.' },
      { q: 'Helena, Montana', name: 'Helena', wiki: 'Helena, Montana', text: 'Montana\'s capital, after big climbs.' },
      { q: 'Butte, Montana', name: 'Butte', wiki: 'Butte, Montana', text: 'An old mining town on the Divide.' },
      { q: 'Lima, Montana', name: 'Lima', wiki: 'Lima, Montana', text: 'Wide, empty valleys towards Idaho.' },
      { q: 'Island Park, Idaho', name: 'Island Park', wiki: 'Island Park, Idaho', text: 'A short stretch through Idaho.' },
      { q: 'Pinedale, Wyoming', name: 'Pinedale', wiki: 'Pinedale, Wyoming', text: 'Past the Tetons and the Wind River Range.' },
      { q: 'Atlantic City, Wyoming', name: 'Great Divide Basin', wiki: 'Great Divide Basin', text: 'The Great Divide Basin: about 200 km with no water and no shade.' },
      { q: 'Rawlins, Wyoming', name: 'Rawlins', wiki: 'Rawlins, Wyoming', text: 'Out of the basin.' },
      { q: 'Steamboat Springs, Colorado', name: 'Steamboat Springs', wiki: 'Steamboat Springs, Colorado', text: 'Into Colorado\'s high country.' },
      { q: 'Breckenridge, Colorado', name: 'Breckenridge', wiki: 'Boreas Pass', text: 'Boreas Pass at about 3,500 m, one of the highest points.' },
      { q: 'Salida, Colorado', name: 'Salida', wiki: 'Salida, Colorado', text: 'Down the Arkansas valley.' },
      { q: 'Del Norte, Colorado', name: 'Del Norte', wiki: 'Indiana Pass', text: 'Indiana Pass, the route\'s highest point.' },
      { q: 'Abiquiu, New Mexico', name: 'Abiquiu', wiki: 'Abiquiú, New Mexico', text: 'Red rock country of New Mexico.' },
      { q: 'Cuba, New Mexico', name: 'Cuba', wiki: 'Cuba, New Mexico', text: 'Desert and mesas.' },
      { q: 'Pie Town, New Mexico', name: 'Pie Town', wiki: 'Pie Town, New Mexico', text: 'A tiny town famous for pie, a welcome stop for riders.' },
      { q: 'Silver City, New Mexico', name: 'Silver City', wiki: 'Silver City, New Mexico', text: 'The last town of any size.' },
      { at: [31.333, -108.53], name: 'Antelope Wells', wiki: 'Antelope Wells, New Mexico', text: 'The finish at a lonely border post on the Mexican border.' },
    ],
  },
  {
    id: 'transamerica-trail',
    title: 'TransAmerica Bike Trail',
    who: 'Classic touring route (Bikecentennial, 1976)',
    when: 'Since 1976',
    vehicle: 'Touring or road bike',
    kind: 'bike',
    color: '#be123c',
    summary: 'About 6,800 km coast to coast on quiet roads, from the Pacific in Oregon to the Atlantic in Virginia, through the Cascades, Yellowstone, the Rockies, the plains, the Ozarks and Appalachia. Created for America\'s bicentennial, when thousands rode it.',
    sources: [
      { label: 'National Geographic: 50 years of the TransAmerica Bike Trail', url: 'https://www.nationalgeographic.com/travel/article/transamerica-trail-united-states' },
      { label: 'Adventure Cycling: TransAm westbound in segments', url: 'https://www.adventurecycling.org/companion/transam-westbound-in-segments/' },
      { label: 'Wikipedia: TransAmerica Bicycle Trail', url: 'https://en.wikipedia.org/wiki/TransAmerica_Bicycle_Trail' },
    ],
    approximate: 'Towns on the route; the line between them is approximate (use the official maps to ride it).',
    stops: [
      { q: 'Astoria, Oregon', name: 'Astoria', wiki: 'Astoria, Oregon', text: 'Dip your wheel in the Pacific at the mouth of the Columbia River.' },
      { q: 'Sisters, Oregon', name: 'McKenzie Pass', wiki: 'McKenzie Pass', text: 'Over the Cascades through old lava fields.' },
      { q: 'Baker City, Oregon', name: 'Baker City', wiki: 'Baker City, Oregon', text: 'Eastern Oregon\'s dry hills.' },
      { q: 'Missoula, Montana', name: 'Missoula', wiki: 'Missoula, Montana', text: 'Home of Adventure Cycling, where riders stop for a photo.' },
      { q: 'West Yellowstone, Montana', name: 'Yellowstone', wiki: 'Yellowstone National Park', text: 'Geysers and bison in Yellowstone.' },
      { q: 'Jackson, Wyoming', name: 'Grand Tetons', wiki: 'Grand Teton National Park', text: 'Under the Tetons.' },
      { q: 'Rawlins, Wyoming', name: 'Wyoming', wiki: 'Rawlins, Wyoming', text: 'Big skies and long empty roads.' },
      { q: 'Breckenridge, Colorado', name: 'Hoosier Pass', wiki: 'Hoosier Pass', text: 'Hoosier Pass, the highest point of the route.' },
      { q: 'Pueblo, Colorado', name: 'Pueblo', wiki: 'Pueblo, Colorado', text: 'Down onto the plains.' },
      { q: 'Newton, Kansas', name: 'Kansas', wiki: 'Kansas', text: 'Wind, wheat and very straight roads.' },
      { q: 'Ash Grove, Missouri', name: 'The Ozarks', wiki: 'Ozarks', text: 'Short, steep hills in the Missouri Ozarks.' },
      { q: 'Carbondale, Illinois', name: 'Illinois', wiki: 'Carbondale, Illinois', text: 'Across the Mississippi.' },
      { q: 'Berea, Kentucky', name: 'Kentucky', wiki: 'Berea, Kentucky', text: 'Rolling Kentucky farmland, and its famous chasing dogs.' },
      { q: 'Damascus, Virginia', name: 'Appalachians', wiki: 'Damascus, Virginia', text: 'The Appalachians, "Trail Town USA".' },
      { q: 'Charlottesville, Virginia', name: 'Charlottesville', wiki: 'Blue Ridge Parkway', text: 'Over the Blue Ridge.' },
      { q: 'Yorktown, Virginia', name: 'Yorktown', wiki: 'Yorktown, Virginia', text: 'The Atlantic at last, at historic Yorktown.' },
    ],
  },
  {
    id: 'carretera-austral',
    title: 'Carretera Austral',
    who: 'Classic bikepacking and moto route',
    when: 'Best in the southern summer',
    vehicle: 'Touring, gravel or mountain bike; also motorcycles',
    kind: 'bike',
    color: '#0369a1',
    summary: 'About 1,200 km of Chile\'s Route 7 through northern Patagonia: rainforest, fjords, glaciers and turquoise rivers, with ferries and long gravel stretches. A dream ride for cyclists and riders alike.',
    sources: [
      { label: 'CycleBlaze: six weeks on the Carretera Austral (2024)', url: 'https://cycleblaze.com/journals/CarreteraAustral2024' },
      { label: 'bikepacking.com: Touristas, pieces of the Carretera Austral', url: 'https://bikepacking.com/plog/touristas-carretera-austral/' },
      { label: 'Wikipedia: Carretera Austral', url: 'https://en.wikipedia.org/wiki/Carretera_Austral' },
    ],
    approximate: 'Main places on the road; ferry timetables change, so check before you go.',
    stops: [
      { q: 'Puerto Montt, Chile', name: 'Puerto Montt', wiki: 'Puerto Montt', text: 'The start of Route 7 at kilometre zero.' },
      { q: 'Hornopirén, Chile', name: 'Hornopirén', wiki: 'Hornopirén National Park', text: 'Where the road gives way to the sea.' },
      { at: [-42.56, -72.6], name: 'Caleta Gonzalo', by: 'ferry', wiki: 'Pumalín Park', text: 'Ferries through the fjords to Pumalín Park.' },
      { q: 'Chaitén, Chile', name: 'Chaitén', wiki: 'Chaitén (volcano)', text: 'The town rebuilt after the 2008 eruption.' },
      { q: 'La Junta, Chile', name: 'La Junta', wiki: 'La Junta, Chile', text: 'Rivers and rain forest.' },
      { q: 'Puyuhuapi, Chile', name: 'Puyuhuapi', wiki: 'Queulat National Park', text: 'The hanging glacier of Queulat.' },
      { q: 'Coyhaique, Chile', name: 'Coyhaique', route: 'car', wiki: 'Coyhaique', text: 'The only city on the road: supplies and repairs.' },
      { q: 'Villa Cerro Castillo, Chile', at: [-46.1226, -72.1544], name: 'Cerro Castillo', wiki: 'Cerro Castillo National Park', text: 'A castle of rock above the road.' },
      { q: 'Puerto Río Tranquilo, Chile', name: 'Río Tranquilo', wiki: 'Marble Caves', text: 'The marble caves of General Carrera Lake.' },
      { q: 'Cochrane, Chile', name: 'Cochrane', wiki: 'Cochrane, Chile', text: 'Wild, empty valleys of Patagonia.' },
      { q: 'Villa O\'Higgins, Chile', name: 'Villa O\'Higgins', wiki: 'Villa O\'Higgins', text: 'The end of the road. Hardy cyclists continue by boat and on foot into Argentina.', source: { label: 'CycleBlaze (2024)', url: 'https://cycleblaze.com/journals/carreteraaustral2024/day-29-villa-ohiggins-to-argentina' } },
    ],
  },

  // ---- Medium-length classics ----
  {
    id: 'camino-frances',
    title: 'Camino de Santiago (Camino Francés)',
    who: 'Classic pilgrimage route',
    when: 'Walked since the Middle Ages',
    vehicle: 'On foot (or by bike)',
    kind: 'walk',
    color: '#ca8a04',
    summary: 'About 780 km across northern Spain to the cathedral of Santiago de Compostela, following a pilgrimage walked for over a thousand years: the Pyrenees, Rioja, the high Meseta and green Galicia. Usually five weeks on foot, two by bike.',
    sources: [
      { label: 'Follow the Camino: Camino statistics for 2025', url: 'https://followthecamino.com/en/camino-statistics-for-2025-the-year-a-pilgrimage-confirmed-its-global-dimension/' },
      { label: 'American Pilgrims on the Camino: statistics', url: 'https://www.americanpilgrims.org/statistics' },
      { label: 'Wikipedia: French Way', url: 'https://en.wikipedia.org/wiki/French_Way' },
    ],
    approximate: 'Main stages; the walking path is drawn on nearby roads.',
    stops: [
      { q: 'Saint-Jean-Pied-de-Port, France', name: 'Saint-Jean-Pied-de-Port', wiki: 'Saint-Jean-Pied-de-Port', text: 'The traditional start on the French side of the Pyrenees.' },
      { q: 'Roncesvalles, Spain', name: 'Roncesvalles', wiki: 'Roncesvalles', text: 'A hard first day over the Pyrenees.' },
      { q: 'Pamplona, Spain', name: 'Pamplona', wiki: 'Pamplona', text: 'The city of the running of the bulls.' },
      { q: 'Logroño, Spain', name: 'Logroño', wiki: 'Logroño', text: 'Rioja wine country.' },
      { q: 'Burgos, Spain', name: 'Burgos', wiki: 'Burgos Cathedral', text: 'A great Gothic cathedral.' },
      { q: 'Frómista, Spain', name: 'The Meseta', wiki: 'Meseta Central', text: 'Days across the open high plateau: wheat, sky and silence.' },
      { q: 'León, Spain', name: 'León', wiki: 'León Cathedral', text: 'Stained glass in León\'s cathedral.' },
      { q: 'Astorga, Spain', name: 'Astorga', wiki: 'Astorga, Spain', text: 'Towards the mountains of León.' },
      { q: 'Ponferrada, Spain', at: [42.5454, -6.5939], name: 'Ponferrada', wiki: 'Castle of Ponferrada', text: 'A Templar castle.' },
      { q: 'O Cebreiro, Spain', name: 'O Cebreiro', wiki: 'O Cebreiro', text: 'The climb into misty Galicia.' },
      { q: 'Sarria, Spain', name: 'Sarria', wiki: 'Sarria', text: 'The last 100 km, the minimum for the Compostela certificate.' },
      { q: 'Santiago de Compostela, Spain', name: 'Santiago de Compostela', wiki: 'Santiago de Compostela Cathedral', text: 'The cathedral square, and the end of the Way.' },
    ],
  },
  {
    id: 'pamir-highway',
    title: 'Pamir Highway (M41)',
    who: 'Classic overland route',
    when: 'Best from June to September',
    vehicle: 'Adventure motorcycles, bicycles and 4x4s',
    kind: 'moto',
    color: '#7c2d12',
    summary: 'About 1,200 km across the "Roof of the World" from Osh in Kyrgyzstan to Dushanbe in Tajikistan, over passes above 4,600 m, past high lakes and along the Afghan border on the Panj river. One of the great overland roads.',
    sources: [
      { label: 'OPEN Cycle: The Pamir Ballad (2025)', url: 'https://opencycle.com/blog/the-pamir-ballad-an-absurd-and-beautiful-ride' },
      { label: 'bikepacking.com: A Journey Beyond II, bikepacking the Pamir Highway', url: 'https://bikepacking.com/plog/bikepacking-pamir-highway/' },
      { label: 'Wikipedia: Pamir Highway', url: 'https://en.wikipedia.org/wiki/Pamir_Highway' },
    ],
    approximate: 'Main places on the road; the line between them is approximate. Permits (GBAO) are needed.',
    stops: [
      { q: 'Osh, Kyrgyzstan', at: [40.5173, 72.805], name: 'Osh', wiki: 'Osh', text: 'An ancient Silk Road town and the usual start.' },
      { at: [39.73, 73.25], name: 'Sary-Tash', wiki: 'Alay Valley', text: 'The Alay valley with the Pamir wall rising ahead.' },
      { at: [39.02, 73.55], name: 'Karakul', wiki: 'Karakul (Tajikistan)', text: 'Over the Kyzyl-Art pass to a huge lake at almost 4,000 m.' },
      { at: [38.17, 73.96], name: 'Murghab', wiki: 'Murghob', text: 'Over Ak-Baital, at about 4,650 m the highest pass, to a high-plateau town.', source: { label: 'OPEN Cycle (2025)', url: 'https://opencycle.com/blog/the-pamir-ballad-an-absurd-and-beautiful-ride' } },
      { q: 'Khorog, Tajikistan', name: 'Khorog', wiki: 'Khorog', text: 'Down to the Panj river and the Afghan border.' },
      { q: 'Rushan, Tajikistan', name: 'The Panj valley', wiki: 'Panj River', text: 'Afghanistan just across the river, close enough to wave.' },
      { q: 'Qalai Khumb, Tajikistan', at: [38.4541, 70.7886], name: 'Kalai-Khumb', wiki: 'Darvoz District', text: 'Rough road through deep gorges.' },
      { q: 'Dushanbe, Tajikistan', name: 'Dushanbe', wiki: 'Dushanbe', text: 'Tajikistan\'s capital, and the end of the highway.' },
    ],
  },
  {
    id: 'estrada-nacional-2',
    title: 'Estrada Nacional 2 (Portugal)',
    who: 'Classic road trip',
    when: 'Best in spring and autumn',
    vehicle: 'Motorcycle, car or bicycle',
    kind: 'moto',
    color: '#166534',
    summary: 'Portugal\'s longest road, 739 km from Chaves near Spain to Faro on the Algarve, through vineyards of the Douro, the forests of the centre and the open plains of the Alentejo. Known as Portugal\'s Route 66.',
    sources: [
      { label: 'Portugal Resident: EN2 named International Route of the Year (2025)', url: 'https://www.portugalresident.com/portugals-iconic-en2-route-named-international-route-of-the-year-in-spain/' },
      { label: 'Julie Dawn Fox: N2, the ultimate Portugal road trip', url: 'https://juliedawnfox.com/n2-the-ultimate-portugal-road-trip-from-north-to-south/' },
      { label: 'Wikipedia: Estrada Nacional 2', url: 'https://en.wikipedia.org/wiki/Estrada_Nacional_2' },
    ],
    approximate: 'Main towns on the road; the line follows today\'s roads.',
    stops: [
      { q: 'Chaves, Portugal', name: 'Chaves', wiki: 'Chaves, Portugal', text: 'Kilometre zero, by a Roman bridge.' },
      { q: 'Vila Real, Portugal', name: 'Vila Real', wiki: 'Vila Real, Portugal', text: 'Into the hills of Trás-os-Montes.' },
      { q: 'Peso da Régua, Portugal', name: 'Peso da Régua', wiki: 'Douro DOC', text: 'Down to the terraced vineyards of the Douro.' },
      { q: 'Lamego, Portugal', name: 'Lamego', wiki: 'Lamego', text: 'The baroque stairway of Lamego.' },
      { q: 'Viseu, Portugal', name: 'Viseu', wiki: 'Viseu', text: 'A granite city in the Dão wine region.' },
      { q: 'Góis, Portugal', name: 'Góis', wiki: 'Góis', text: 'Winding roads through schist villages and forest.' },
      { q: 'Sertã, Portugal', name: 'Sertã', wiki: 'Sertã', text: 'Near the geographic centre of Portugal.' },
      { q: 'Abrantes, Portugal', name: 'Abrantes', wiki: 'Abrantes', text: 'Across the Tagus.' },
      { q: 'Ponte de Sor, Portugal', name: 'Ponte de Sor', wiki: 'Ponte de Sor', text: 'Cork oaks of the upper Alentejo.' },
      { q: 'Montemor-o-Novo, Portugal', name: 'Montemor-o-Novo', wiki: 'Montemor-o-Novo', text: 'A castle above the plains.' },
      { q: 'Ferreira do Alentejo, Portugal', name: 'Alentejo plains', wiki: 'Alentejo', text: 'Long straight roads through the plains.' },
      { q: 'Castro Verde, Portugal', name: 'Castro Verde', wiki: 'Castro Verde', text: 'Steppe country, home of great bustards.' },
      { q: 'Almodôvar, Portugal', name: 'Serra do Caldeirão', wiki: 'Serra do Caldeirão', text: 'Curves over the Caldeirão hills, a favourite with riders.' },
      { q: 'São Brás de Alportel, Portugal', name: 'São Brás de Alportel', wiki: 'São Brás de Alportel', text: 'Down into the Algarve.' },
      { q: 'Faro, Portugal', name: 'Faro', wiki: 'Faro, Portugal', text: 'Kilometre 739 at Faro, by the sea.' },
    ],
  },
  {
    id: 'capelo-ivens',
    title: 'De Angola à Contra-Costa: Capelo and Ivens',
    who: 'Hermenegildo Capelo & Roberto Ivens',
    when: '1884–1885',
    vehicle: 'On foot, with porters',
    kind: 'walk',
    color: '#166534',
    media: [{"kind": "free", "title": "De Angola à Contra-Costa", "by": "Capelo & Ivens", "note": "1886, digitised copies on the Internet Archive", "url": "https://archive.org/search?query=De+Angola+%C3%A0+Contra-Costa"}],
    summary: 'Two Portuguese naval officers cross Africa from the Atlantic to the Indian Ocean, from Moçâmedes in Angola to Quelimane in Mozambique: about 8,300 km in some 14 months, a third of it through land no European had mapped. The expedition backed Portugal\'s "Pink Map" claim to the lands between its colonies, and their book "De Angola à Contra-Costa" (1886) became a classic of exploration.',
    sources: [
      { label: 'Wikipedia: Hermenegildo Capelo', url: 'https://en.wikipedia.org/wiki/Hermenegildo_Capelo' },
      { label: 'Wikipedia: Roberto Ivens', url: 'https://en.wikipedia.org/wiki/Roberto_Ivens' },
      { label: 'LNEG: Capelo and Ivens geological samples revisited (1884–1885)', url: 'https://repositorio.lneg.pt/bitstreams/9c851bad-5457-4220-be90-77b00c6c0d4c/download' },
    ],
    approximate: 'Only the main known places; the expedition\'s real path wound far more, and the straight lines between places are a rough guide only.',
    stops: [
      { q: 'Moçâmedes, Angola', name: 'Moçâmedes', at: [-15.195, 12.1458], route: 'line', date: '1884', wiki: 'Moçâmedes', text: 'The start on the Angolan coast, after leaving Lisbon in January 1884.' },
      { q: 'Lubango, Angola', name: 'Huíla plateau', at: [-14.9195, 13.4898], route: 'line', wiki: 'Huíla Province', text: 'Up the escarpment to the cool Huíla plateau, where the long journey inland was organised.' },
      { q: 'Humbe, Cunene', name: 'Humbe', at: [-16.68, 14.9], route: 'line', wiki: 'Cunene River', text: 'South-east to the Cunene river, then into country barely known to Europeans.' },
      { q: 'Bunkeya', name: 'Garanganja (Katanga)', at: [-10.3964, 26.9685], route: 'line', wiki: 'Msiri', text: 'The lands of Msiri\'s powerful trading kingdom in Katanga, near the sources of the great rivers they had come to study.' },
      { q: 'Zumbo, Mozambique', name: 'Zumbo', at: [-15.6161, 30.445], route: 'line', wiki: 'Zumbo', text: 'Down to the Zambezi at the old Portuguese trading post of Zumbo.' },
      { q: 'Tete, Mozambique', name: 'Tete', at: [-16.156, 33.586], route: 'line', wiki: 'Tete, Mozambique', text: 'Down the Zambezi to Tete.' },
      { q: 'Quelimane, Mozambique', name: 'Quelimane', at: [-17.8775, 36.8902], route: 'line', date: '21 Jun 1885', wiki: 'Quelimane', text: 'The Indian Ocean coast: Angola to the "other coast", achieved. They were welcomed home in Lisbon by King Luís.' },
    ],
  },
  {
    id: 'livingstone-zambezi',
    title: 'Livingstone across Africa',
    who: 'David Livingstone',
    when: '1853–1856',
    vehicle: 'On foot and by canoe, with Makololo companions',
    kind: 'walk',
    color: '#78350f',
    media: [{"kind": "book", "title": "Missionary Travels and Researches in South Africa", "by": "David Livingstone"}, {"kind": "free", "title": "Missionary Travels and Researches in South Africa", "note": "1857, free on Project Gutenberg", "url": "https://www.gutenberg.org/ebooks/search/?query=missionary+travels+livingstone"}],
    summary: 'The Scottish missionary sets out from the Makololo capital Linyanti to find a route to the coast: west to Luanda on the Atlantic, back again, then east down the Zambezi past the falls he named Victoria to Quelimane on the Indian Ocean. The first documented crossing of southern Africa by a European, told in his bestseller "Missionary Travels".',
    sources: [
      { label: 'History Today: Livingstone reaches the Victoria Falls', url: 'https://www.historytoday.com/archive/david-livingstone-reaches-victoria-falls' },
      { label: 'Princeton University Library: David Livingstone, 1813–1873', url: 'https://static-prod.lib.princeton.edu/visual_materials/maps/websites/africa/livingstone/livingstone.html' },
      { label: 'David Livingstone Birthplace: timeline', url: 'https://www.david-livingstone-birthplace.org/files/learning-topics-timeline-r2.pdf' },
    ],
    approximate: 'Main places and dates from his account; dates differ slightly between sources, and the straight lines are a rough guide.',
    stops: [
      { q: 'Linyanti', name: 'Linyanti', at: [-18.0724, 24.0163], route: 'line', date: 'Nov 1853', wiki: 'Linyanti', text: 'The Makololo capital by the Chobe, where chief Sekeletu gave him men for the journey.' },
      { q: 'Lake Dilolo', name: 'Lake Dilolo', at: [-11.49, 22.03], route: 'line', wiki: 'Lake Dilolo', text: 'Up the Zambezi and across the watershed between the Zambezi and the Congo.' },
      { q: 'Cassange', name: 'Cassange', at: [-9.6, 16.9], route: 'line', wiki: 'Kasanje Kingdom', text: 'The Portuguese trading post on the Kwango, after months of fever.' },
      { q: 'Luanda, Angola', name: 'Luanda', at: [-8.8273, 13.244], route: 'line', date: '31 May 1854', wiki: 'Luanda', text: 'The Atlantic. He refused a passage home, to take his companions back as promised.' },
      { q: 'Linyanti', name: 'Back at Linyanti', at: [-18.0724, 24.0163], route: 'line', date: 'Sep 1855', wiki: 'Chobe River', text: 'More than a year to walk back, retracing the route.' },
      { q: 'Victoria Falls', name: 'Victoria Falls', at: [-17.9243, 25.8572], route: 'line', date: 'Nov 1855', wiki: 'Victoria Falls', text: '"Mosi-oa-Tunya", the smoke that thunders: he named it for his queen.' },
      { q: 'Kafue Zambezi confluence', name: 'Kafue confluence', at: [-15.95, 28.92], route: 'line', wiki: 'Kafue River', text: 'Across the plateau and down to where the Kafue joins the Zambezi.' },
      { q: 'Zumbo, Mozambique', name: 'Zumbo', at: [-15.6161, 30.445], route: 'line', date: 'Jan 1856', wiki: 'Zumbo', text: 'The ruins of an old Portuguese post at the Luangwa confluence.' },
      { q: 'Tete, Mozambique', name: 'Tete', at: [-16.156, 33.586], route: 'line', date: 'Mar 1856', wiki: 'Tete, Mozambique', text: 'Cutting across a loop of the river, he missed the Cahora Bassa rapids, a mistake that later cost him dearly.' },
      { q: 'Quelimane, Mozambique', name: 'Quelimane', at: [-17.8775, 36.8902], route: 'line', date: 'May 1856', wiki: 'Quelimane', text: 'The Indian Ocean, two and a half years after leaving Linyanti.' },
    ],
  },
  {
    id: 'baja-1000-2025',
    title: 'SCORE Baja 1000 (2025)',
    who: 'SCORE International · 58th edition',
    when: 'November 2025',
    vehicle: 'Off-road race: trucks, buggies, motorcycles, quads',
    kind: 'rally',
    color: '#dc2626',
    summary: 'The world\'s most famous off-road race, on Mexico\'s Baja California peninsula since 1967. The 2025 race was an 854-mile counter-clockwise loop from Ensenada south past San Quintín to San Ignacio and back up the Gulf side through San Felipe. The 2026 race starts and finishes in Los Cabos, and the classic Ensenada–La Paz run returns for the 60th anniversary in 2027.',
    sources: [
      { label: '131 Offroad: 2025 Baja 1000 course', url: 'https://131offroad.com/2025/10/04/2025-baja-1000-course' },
      { label: 'SCORE Journal, October 2025', url: 'https://read.uberflip.com/i/1540550-score-journal-oct-2025/25' },
      { label: 'RACER: Menzies and Polvoorde win the 2025 Baja 1000', url: 'https://racer.com/2025/11/16/menzies-polvoorde-storm-to-score-baja-1000-redemption' },
    ],
    approximate: 'Main points and race-mile checkpoints; the course runs on desert tracks, not the roads shown.',
    stops: [
      { q: 'Ensenada, Baja California', name: 'Ensenada', wiki: 'Ensenada, Baja California', text: 'Start and finish, in the city that has hosted the race for decades.' },
      { q: 'San Quintín, Baja California', name: 'San Quintín (RM 212)', at: [30.5614, -115.9381], wiki: 'San Quintín, Baja California', text: 'First physical checkpoint near race mile 212.' },
      { q: 'San Ignacio, Baja California Sur', name: 'San Ignacio (RM 365)', at: [27.2837, -112.8979], wiki: 'San Ignacio, Baja California Sur', text: 'An oasis town of date palms; the southern turn of the loop at race mile 365.' },
      { q: 'San Felipe, Baja California', name: 'San Felipe', wiki: 'San Felipe, Baja California', text: 'North up the Sea of Cortez side.' },
      { q: 'San Matías, Baja California', name: 'San Matías (RM 717)', at: [31.3345, -115.5464], wiki: 'Sierra de San Pedro Mártir', text: 'The pass between the sierras, last checkpoint at race mile 717.' },
      { q: 'Ensenada, Baja California', name: 'Ensenada finish', wiki: 'Baja 1000', text: 'Back to Ensenada after 854 race miles. Christopher Polvoorde and Bryce Menzies won overall in a Trophy Truck; the SLR Honda team of Tyler Lynn, David Kamo and Carter Klein won the bikes in 17 h 55 min.', source: { label: 'Cycle News: 2025 Baja 1000 motorcycle results', url: 'https://www.cyclenews.com/2025/11/article/2025-score-baja-1000-motorcycle-results/' } },
    ],
  },
  {
   "id": "mondo-enduro",
   "title": "Mondo Enduro",
   "who": "Austin Vince, Gerald Vince, Chas Penty and friends",
   "when": "1995–1996",
   "vehicle": "Suzuki DR350s",
   "kind": "moto",
   "color": "#a16207",
   "media": [
    {
     "kind": "series",
     "title": "Mondo Enduro",
     "note": "The expedition film, shown on Discovery"
    },
    {
     "kind": "series",
     "title": "Terra Circa",
     "note": "Austin Vince's 2001 sequel, back to the Zilov Gap"
    }
   ],
   "summary": "A group of friends from a London school staff room go round the world the longest way in the shortest time, on cheap Suzuki DR350s, rough camping on a shoestring: across Central Asia and Siberia through the roadless Zilov Gap to Magadan, from Alaska to Chile, and up Africa from Cape Town home to London. Their film became a cult classic of adventure riding.",
   "sources": [
    {
     "label": "Adventure Motorcycle: riders getting candid with Austin Vince",
     "url": "https://dev.adventuremotorcycle.com/riders/riders-getting-candid-with-austin-vince-new?showall=1"
    },
    {
     "label": "Wikipedia: Mondo Enduro",
     "url": "https://en.wikipedia.org/wiki/Mondo_Enduro"
    },
    {
     "label": "Wikipedia: Austin Vince",
     "url": "https://en.wikipedia.org/wiki/Austin_Vince"
    }
   ],
   "approximate": "Places from the film's chapter list; the roads between them are the router's choice and only approximate.",
   "stops": [
    {
     "q": "Mill Hill, London",
     "name": "London",
     "text": "The start from Mill Hill School, where several of them taught.",
     "wiki": "Mill Hill"
    },
    {
     "q": "Nice, France",
     "name": "Nice",
     "text": "Ferry to France and south to the Riviera.",
     "wiki": "Nice"
    },
    {
     "q": "Pisa, Italy",
     "name": "Pisa",
     "text": "Down Italy past the leaning tower.",
     "wiki": "Pisa"
    },
    {
     "q": "Cassino, Italy",
     "name": "Monte Cassino",
     "text": "The rebuilt abbey on its hill.",
     "wiki": "Cassino"
    },
    {
     "q": "Bari, Italy",
     "name": "Bari",
     "text": "The ferry to Greece.",
     "wiki": "Bari"
    },
    {
     "q": "Igoumenitsa, Greece",
     "name": "Greece",
     "by": "ferry",
     "text": "Across northern Greece.",
     "wiki": "Igoumenitsa"
    },
    {
     "q": "Istanbul, Turkey",
     "name": "Istanbul",
     "text": "Into Asia.",
     "wiki": "Istanbul"
    },
    {
     "q": "Erzurum, Turkey",
     "name": "Eastern Turkey",
     "text": "The high Anatolian plateau towards the Armenian border.",
     "wiki": "Erzurum"
    },
    {
     "q": "Tbilisi, Georgia",
     "name": "Georgia",
     "text": "Into the Caucasus.",
     "wiki": "Tbilisi"
    },
    {
     "q": "Baku, Azerbaijan",
     "name": "Baku",
     "text": "The ferry across the Caspian Sea.",
     "wiki": "Baku"
    },
    {
     "q": "Türkmenbaşy, Turkmenistan",
     "name": "Turkmenistan",
     "by": "ferry",
     "text": "Desert and the old Silk Road.",
     "wiki": "Türkmenbaşy"
    },
    {
     "q": "Bukhara, Uzbekistan",
     "name": "Bukhara",
     "text": "Silk Road cities, then Samarkand.",
     "wiki": "Bukhara"
    },
    {
     "q": "Samarkand, Uzbekistan",
     "name": "Samarkand",
     "text": "The Registan's tiled madrasas.",
     "wiki": "Samarkand"
    },
    {
     "q": "Almaty, Kazakhstan",
     "name": "Kazakhstan",
     "text": "Vast empty steppe; petrol bought from lorries.",
     "wiki": "Almaty"
    },
    {
     "q": "Barnaul, Russia",
     "name": "Barnaul",
     "text": "Into post-Soviet Russia, shops empty.",
     "wiki": "Barnaul"
    },
    {
     "q": "Novosibirsk, Russia",
     "name": "Novosibirsk",
     "text": "East along the half-built highway across Siberia.",
     "wiki": "Novosibirsk"
    },
    {
     "q": "Irkutsk, Russia",
     "name": "Irkutsk",
     "text": "By Lake Baikal; three riders head home here.",
     "wiki": "Irkutsk"
    },
    {
     "q": "Mogocha, Russia",
     "name": "Zilov Gap",
     "text": "The roadless Zilov Gap: bogs, rivers and broken bikes. Austin Vince later called it the best ten days of the whole trip.",
     "wiki": "Mogocha",
     "source": {
      "label": "Adventure Motorcycle: Austin Vince interview",
      "url": "https://dev.adventuremotorcycle.com/riders/riders-getting-candid-with-austin-vince-new?showall=1"
     }
    },
    {
     "q": "Skovorodino, Russia",
     "name": "Skovorodino",
     "by": "train",
     "text": "Exhausted, they took the Trans-Siberian train for the last 100 miles of the gap.",
     "wiki": "Skovorodino"
    },
    {
     "q": "Yakutsk, Russia",
     "name": "Yakutsk",
     "text": "North to the Lena river: no road onwards then.",
     "wiki": "Yakutsk"
    },
    {
     "q": "Khandyga, Russia",
     "name": "Khandyga",
     "by": "boat",
     "text": "A river barge down the Lena to where the road starts again.",
     "wiki": "Khandyga"
    },
    {
     "q": "Magadan, Russia",
     "at": [
      59.5612,
      150.8301
     ],
     "name": "Magadan",
     "text": "The Road of Bones to the Pacific, 111 days after leaving London.",
     "wiki": "Magadan"
    },
    {
     "q": "Anchorage, Alaska",
     "name": "Anchorage",
     "by": "flight",
     "text": "Bikes and riders flown to Alaska: good roads and full shops, a culture shock.",
     "wiki": "Anchorage"
    },
    {
     "q": "Vancouver, Canada",
     "name": "Vancouver",
     "text": "Down the west coast.",
     "wiki": "Vancouver"
    },
    {
     "q": "San Francisco, California",
     "name": "San Francisco",
     "text": "Another rider has to leave, out of money; three carry on.",
     "wiki": "San Francisco, California"
    },
    {
     "q": "Los Angeles, California",
     "name": "Los Angeles",
     "text": "On to the Mexican border.",
     "wiki": "Los Angeles, California"
    },
    {
     "q": "Nogales, Sonora",
     "name": "Nogales",
     "text": "Into Mexico.",
     "wiki": "Nogales"
    },
    {
     "q": "Guatemala City",
     "name": "Guatemala",
     "text": "Through Central America.",
     "wiki": "Guatemala City"
    },
    {
     "q": "San Salvador",
     "name": "El Salvador",
     "text": "The Coatepeque crater lake.",
     "wiki": "San Salvador"
    },
    {
     "q": "Managua, Nicaragua",
     "name": "Nicaragua",
     "text": "South through Nicaragua.",
     "wiki": "Managua"
    },
    {
     "q": "San José, Costa Rica",
     "name": "Costa Rica",
     "text": "Costa Rica.",
     "wiki": "San José"
    },
    {
     "q": "Panama City",
     "at": [
      8.9824,
      -79.5199
     ],
     "name": "Panama",
     "text": "The end of the road north of the Darién Gap.",
     "wiki": "Panama City"
    },
    {
     "q": "Bogotá, Colombia",
     "name": "Bogotá",
     "by": "unknown",
     "text": "Round the Darién Gap into South America.",
     "wiki": "Bogotá"
    },
    {
     "q": "Quito, Ecuador",
     "name": "Quito",
     "text": "Along the Andes.",
     "wiki": "Quito"
    },
    {
     "q": "Trujillo, Peru",
     "name": "Trujillo",
     "text": "Down the Peruvian desert coast.",
     "wiki": "Trujillo"
    },
    {
     "q": "Calama, Chile",
     "name": "Atacama Desert",
     "text": "The driest desert on earth.",
     "wiki": "Calama"
    },
    {
     "q": "Santiago, Chile",
     "name": "Santiago",
     "text": "The end of the Americas leg.",
     "wiki": "Santiago"
    },
    {
     "q": "Cape Town, South Africa",
     "name": "Cape Town",
     "by": "unknown",
     "text": "Across to Africa for the last leg home.",
     "wiki": "Cape Town"
    },
    {
     "q": "Johannesburg, South Africa",
     "name": "Johannesburg",
     "text": "North through South Africa.",
     "wiki": "Johannesburg"
    },
    {
     "q": "Victoria Falls, Zimbabwe",
     "name": "Victoria Falls",
     "text": "Zimbabwe and the falls.",
     "wiki": "Victoria Falls"
    },
    {
     "q": "Lusaka, Zambia",
     "name": "Zambia",
     "text": "Zambia, then Malawi.",
     "wiki": "Lusaka"
    },
    {
     "q": "Lilongwe, Malawi",
     "name": "Malawi",
     "text": "Up the lake country.",
     "wiki": "Lilongwe"
    },
    {
     "q": "Arusha, Tanzania",
     "name": "Tanzania",
     "text": "Tanzania under Kilimanjaro.",
     "wiki": "Arusha"
    },
    {
     "q": "Nairobi, Kenya",
     "name": "Nairobi",
     "text": "Kenya.",
     "wiki": "Nairobi"
    },
    {
     "q": "Addis Ababa, Ethiopia",
     "name": "Ethiopia",
     "text": "Up into the Ethiopian highlands.",
     "wiki": "Addis Ababa"
    },
    {
     "q": "Massawa, Eritrea",
     "name": "Massawa",
     "text": "The Red Sea port and a ferry to Arabia.",
     "wiki": "Massawa"
    },
    {
     "q": "Jeddah, Saudi Arabia",
     "name": "Jeddah",
     "by": "ferry",
     "text": "Across Saudi Arabia.",
     "wiki": "Jeddah"
    },
    {
     "q": "Petra, Jordan",
     "name": "Petra",
     "text": "The rock-cut city in Jordan.",
     "wiki": "Petra"
    },
    {
     "q": "Damascus, Syria",
     "name": "Damascus",
     "text": "Syria.",
     "wiki": "Damascus"
    },
    {
     "q": "Göreme, Turkey",
     "name": "Cappadocia",
     "text": "Fairy chimneys in central Turkey.",
     "wiki": "Göreme"
    },
    {
     "q": "Sofia, Bulgaria",
     "name": "Bulgaria",
     "text": "Into the Balkans.",
     "wiki": "Sofia"
    },
    {
     "q": "Belgrade, Serbia",
     "name": "Serbia",
     "text": "North through Serbia.",
     "wiki": "Belgrade"
    },
    {
     "q": "Budapest, Hungary",
     "name": "Budapest",
     "text": "Central Europe.",
     "wiki": "Budapest"
    },
    {
     "q": "Prague, Czech Republic",
     "name": "Prague",
     "text": "Prague.",
     "wiki": "Prague"
    },
    {
     "q": "Frankfurt, Germany",
     "name": "Frankfurt",
     "text": "Germany, then Belgium and France.",
     "wiki": "Frankfurt"
    },
    {
     "q": "Mill Hill, London",
     "name": "Back in London",
     "text": "Home, round the world the long way.",
     "wiki": "Mill Hill"
    }
   ]
  },
  {
   "id": "lois-on-the-loose",
   "title": "Lois on the Loose",
   "who": "Lois Pryce",
   "when": "2003–2004",
   "vehicle": "Yamaha XT225 (Serow)",
   "kind": "moto",
   "color": "#db2777",
   "media": [
    {
     "kind": "book",
     "title": "Lois on the Loose",
     "by": "Lois Pryce"
    },
    {
     "kind": "book",
     "title": "Red Tape and White Knuckles",
     "by": "Lois Pryce"
    },
    {
     "kind": "book",
     "title": "Revolutionary Ride",
     "by": "Lois Pryce",
     "note": "Her solo rides in Iran, 2013–14"
    }
   ],
   "summary": "Lois Pryce leaves her job at BBC Music and rides alone from Alaska to the tip of South America on a small 225 cc Yamaha: about 20,000 miles in ten months, from the Arctic down the length of the Americas through Mexico, Central America, the Inca lands of Peru and Bolivia to Ushuaia. Her book about it became an adventure-riding favourite.",
   "sources": [
    {
     "label": "Wikipedia: Lois Pryce",
     "url": "https://en.wikipedia.org/wiki/Lois_Pryce"
    },
    {
     "label": "Yamaha: Lois Pryce, Alaska to Panama",
     "url": "https://global.yamaha-motor.com/stories/resonating-worlds/journey/vol12/"
    },
    {
     "label": "Yamaha: Lois Pryce, Colombia to Argentina",
     "url": "https://global.yamaha-motor.com/stories/resonating-worlds/journey/vol13"
    }
   ],
   "approximate": "Only the regions her accounts name; the towns and roads between them are approximate.",
   "stops": [
    {
     "q": "Anchorage, Alaska",
     "name": "Anchorage",
     "text": "The start in Alaska, April 2003, on a bike small enough to pick up when it falls."
    },
    {
     "q": "Whitehorse, Yukon",
     "name": "Yukon",
     "text": "South through Canada."
    },
    {
     "q": "La Paz, Baja California Sur",
     "name": "Baja California",
     "text": "Down the long desert peninsula of Baja."
    },
    {
     "q": "Panama City",
     "at": [8.9824, -79.5199],
     "name": "Panama",
     "text": "Through Central America to the Darién Gap."
    },
    {
     "q": "Bogotá, Colombia",
     "name": "Colombia",
     "by": "unknown",
     "text": "Round the gap into South America."
    },
    {
     "q": "Cusco, Peru",
     "name": "Peru",
     "text": "The old Inca lands of the Andes."
    },
    {
     "q": "La Paz, Bolivia",
     "name": "Bolivia",
     "text": "The high plains of Bolivia."
    },
    {
     "q": "Ushuaia, Argentina",
     "name": "Ushuaia",
     "text": "The end of the road at the bottom of the world, about 20,000 miles from Anchorage."
    }
   ]
  },
  {
   "id": "lois-red-tape",
   "title": "Red Tape and White Knuckles",
   "who": "Lois Pryce",
   "when": "2006",
   "vehicle": "Yamaha XT225",
   "kind": "moto",
   "color": "#be185d",
   "media": [
    {
     "kind": "book",
     "title": "Lois on the Loose",
     "by": "Lois Pryce"
    },
    {
     "kind": "book",
     "title": "Red Tape and White Knuckles",
     "by": "Lois Pryce"
    },
    {
     "kind": "book",
     "title": "Revolutionary Ride",
     "by": "Lois Pryce",
     "note": "Her solo rides in Iran, 2013–14"
    }
   ],
   "summary": "Lois Pryce rides alone from her London home to Cape Town: across the Sahara through Algeria and Niger, down West Africa, through the Congo basin's jungle tracks and the minefields of post-war Angola, about 10,000 miles in four months. The book tells it with humour, and plenty of border bureaucracy.",
   "sources": [
    {
     "label": "Wikipedia: Lois Pryce",
     "url": "https://en.wikipedia.org/wiki/Lois_Pryce"
    },
    {
     "label": "ONE: meet Lois, who rode from London to Cape Town",
     "url": "https://www.one.org/stories/meet-lois-the-woman-who-travelled-from-london-to-cape-town-by-motorbike"
    },
    {
     "label": "Canada Moto Guide: review of Red Tape and White Knuckles",
     "url": "https://canadamotoguide.com/2013/06/13/book-review-red-tape-and-white-knuckles/"
    }
   ],
   "approximate": "The countries named in accounts of the book; the towns and roads are approximate.",
   "stops": [
    {
     "q": "London, UK",
     "name": "London",
     "text": "The start from home."
    },
    {
     "q": "Tunis, Tunisia",
     "name": "Tunisia",
     "by": "ferry",
     "text": "Across the Mediterranean to Africa."
    },
    {
     "q": "Tamanrasset, Algeria",
     "name": "Algeria (Sahara)",
     "text": "South across the Algerian Sahara."
    },
    {
     "q": "Agadez, Niger",
     "name": "Niger",
     "text": "Out of the desert into Niger."
    },
    {
     "q": "Kano, Nigeria",
     "name": "Nigeria",
     "text": "Into Nigeria."
    },
    {
     "q": "Yaoundé, Cameroon",
     "name": "Cameroon",
     "text": "Down into Cameroon."
    },
    {
     "q": "Libreville, Gabon",
     "name": "Gabon",
     "text": "Gabon's forests."
    },
    {
     "q": "Pointe-Noire, Republic of the Congo",
     "name": "Congo",
     "text": "The Congo basin: mud, jungle and checkpoints."
    },
    {
     "q": "Matadi, Democratic Republic of the Congo",
     "name": "DR Congo",
     "text": "Across the Congo river into the DRC."
    },
    {
     "q": "Luanda, Angola",
     "name": "Angola",
     "text": "Post-war Angola, with minefields beside the tracks."
    },
    {
     "q": "Windhoek, Namibia",
     "name": "Namibia",
     "text": "Good roads at last through Namibia."
    },
    {
     "q": "Cape Town, South Africa",
     "name": "Cape Town",
     "text": "The finish, about 10,000 miles from London."
    }
   ]
  },
  {
   "id": "johnsons-rtw",
   "title": "Grant & Susan Johnson: Africa, 1997",
   "who": "Grant & Susan Johnson",
   "when": "1997 (part of their 1987–1998 ride round the world)",
   "vehicle": "BMW R80G/S, two-up",
   "kind": "moto",
   "color": "#0f766e",
   "summary": "A Canadian couple sold everything in 1987 and rode a BMW R80G/S slowly round the world: eleven years, 39 countries, more than 100,000 km, and near the end they founded Horizons Unlimited, now the biggest community of motorcycle travellers. Only places named on their highlights pages are known, so the map shows the one section that reads as a continuous ride: East Africa down to the southern tip of the continent.",
   "sources": [
    {
     "label": "Horizons Unlimited: Grant and Susan Johnson",
     "url": "https://www.horizonsunlimited.com/johnson"
    },
    {
     "label": "Horizons Unlimited: highlights of our 11-year trip",
     "url": "https://www.horizonsunlimited.com/johnson/hilites/"
    },
    {
     "label": "ADVrider: meet Grant Johnson, founder of Horizons Unlimited",
     "url": "https://www.advrider.com/meet-grant-johnson-founder-of-horizons-unlimited/"
    }
   ],
   "approximate": "Places their highlights pages name for Africa; the roads between them are approximate.",
   "stops": [
    {
     "q": "Arusha, Tanzania",
     "name": "Tanzania",
     "date": "1997",
     "text": "East Africa.",
     "wiki": "Arusha"
    },
    {
     "q": "Lilongwe, Malawi",
     "name": "Malawi",
     "text": "South through Malawi.",
     "wiki": "Lilongwe"
    },
    {
     "q": "Windhoek, Namibia",
     "name": "Namibia",
     "text": "Namibia's deserts.",
     "wiki": "Windhoek"
    },
    {
     "q": "Cape Agulhas, South Africa",
     "name": "Cape Agulhas",
     "text": "The southern tip of Africa.",
     "wiki": "Cape Agulhas"
    }
   ]
  },
  {
   "id": "hotchkiss-1915",
   "title": "Effie and Avis Hotchkiss: coast to coast",
   "who": "Effie Hotchkiss & her mother Avis",
   "when": "1915",
   "vehicle": "Harley-Davidson 11-F with sidecar",
   "kind": "moto",
   "color": "#9333ea",
   "summary": "Effie Hotchkiss, 26, a Wall Street worker, rides her new three-speed Harley from Brooklyn to San Francisco with her 56-year-old mother Avis in the sidecar, doing her own repairs, to see the Panama-Pacific Exposition: the first women to cross the United States by motorcycle. At Ocean Beach they poured Atlantic water they had carried into the Pacific.",
   "sources": [
    {
     "label": "Rider Magazine: Effie's great adventure",
     "url": "https://ridermagazine.com/effies-great-adventure-first-women-to-ride-cross-country/"
    },
    {
     "label": "The Vintagent: first women motorcyclists across the USA",
     "url": "https://thevintagent.com/?p=75295"
    },
    {
     "label": "Wikipedia: Avis and Effie Hotchkiss",
     "url": "https://en.wikipedia.org/wiki/Avis_and_Effie_Hotchkiss"
    }
   ],
   "approximate": "Places named in accounts of the ride; the 1915 roads are drawn as today's, only approximately.",
   "stops": [
    {
     "q": "Brooklyn, New York",
     "name": "Brooklyn",
     "date": "2 May 1915",
     "text": "Off with a jar of Atlantic water, tools and a gun.",
     "wiki": "Brooklyn, New York"
    },
    {
     "q": "Albany, New York",
     "name": "Albany",
     "text": "Up the Hudson valley.",
     "wiki": "Albany, New York"
    },
    {
     "q": "Buffalo, New York",
     "name": "Buffalo",
     "text": "West along the Great Lakes, about 150 miles a day.",
     "wiki": "Buffalo, New York"
    },
    {
     "q": "Chicago, Illinois",
     "name": "Chicago",
     "text": "Crowds gather wherever \"the two lady riders\" stop.",
     "wiki": "Chicago, Illinois"
    },
    {
     "q": "Salt Lake City, Utah",
     "name": "Salt Lake City",
     "text": "Photographed in Salt Lake City on the way west.",
     "wiki": "Salt Lake City, Utah"
    },
    {
     "q": "Ocean Beach, San Francisco",
     "name": "San Francisco",
     "date": "Summer 1915",
     "text": "Two to three months after leaving (accounts differ): Atlantic water poured into the Pacific at Ocean Beach. They rode home to Brooklyn by October, about 9,000 miles in all.",
     "wiki": "Ocean Beach, San Francisco"
    }
   ]
  },
  {
   "id": "van-buren-1916",
   "title": "The Van Buren sisters cross America",
   "who": "Augusta & Adeline Van Buren",
   "when": "1916",
   "vehicle": "Two Indian Power Plus motorcycles",
   "kind": "moto",
   "color": "#7c3aed",
   "summary": "Two sisters, each on her own 1,000 cc Indian, ride 5,500 miles in 60 days from Brooklyn to Los Angeles to prove women could serve as military dispatch riders: the first women to cross the US on solo motorcycles. Arrested for wearing men's clothes, they were also the first women to drive up Pikes Peak; the army still turned them down.",
   "sources": [
    {
     "label": "History Today: the first women to cross the US on solo motorcycles",
     "url": "https://www.historytoday.com/archive/months-past/first-women-cross-us-solo-motorcycles"
    },
    {
     "label": "Expedition Portal: the Van Buren sisters' 1916 ride",
     "url": "https://expeditionportal.com/pioneers-of-moto-history-the-van-buren-sisters-1916-ride-across-america/"
    },
    {
     "label": "Wikipedia: Van Buren sisters",
     "url": "https://en.wikipedia.org/wiki/Van_Buren_sisters"
    }
   ],
   "approximate": "Places named in accounts of the ride; the roads are drawn as today's, only approximately.",
   "stops": [
    {
     "q": "Sheepshead Bay, Brooklyn",
     "name": "Sheepshead Bay",
     "date": "4 Jul 1916",
     "text": "The start from the Brooklyn race track on Independence Day.",
     "wiki": "Sheepshead Bay, Brooklyn"
    },
    {
     "q": "Chicago, Illinois",
     "name": "Chicago",
     "text": "West across the Midwest in rain and mud.",
     "wiki": "Chicago, Illinois"
    },
    {
     "q": "Pikes Peak, Colorado",
     "name": "Pikes Peak",
     "text": "The first women to reach the summit by motor vehicle.",
     "wiki": "Pikes Peak"
    },
    {
     "q": "Salt Lake City, Utah",
     "name": "Salt Lake City",
     "text": "Lost in the desert to the west, out of water, saved by a prospector.",
     "wiki": "Salt Lake City, Utah"
    },
    {
     "q": "Los Angeles, California",
     "name": "Los Angeles",
     "date": "8 Sep 1916",
     "text": "5,500 miles in 60 days.",
     "wiki": "Los Angeles, California"
    },
    {
     "q": "Tijuana, Mexico",
     "name": "Tijuana",
     "text": "A last ride over the border to finish.",
     "wiki": "Tijuana"
    }
   ]
  },
  {
   "id": "wallach-blenkiron",
   "title": "London to Cape Town by sidecar: Wallach and Blenkiron",
   "who": "Theresa Wallach & Florence Blenkiron",
   "when": "1934–1935",
   "vehicle": "600 cc Panther with sidecar and trailer",
   "kind": "moto",
   "color": "#b91c1c",
   "media": [
    {
     "kind": "book",
     "title": "The Rugged Road",
     "by": "Theresa Wallach",
     "note": "Her account, published in 2001"
    }
   ],
   "summary": "Two young British engineers and racers ride a Panther with sidecar and trailer from London across the Sahara, reportedly without a compass, and down through Central and East Africa to Cape Town: about 13,500 miles in nearly eight months, through heat, wild animals, breakdowns and politics. Seen off by Lady Astor and five women MPs.",
   "sources": [
    {
     "label": "Wikipedia: Theresa Wallach",
     "url": "https://en.wikipedia.org/wiki/Theresa_Wallach"
    },
    {
     "label": "Historic UK: Florence Blenkiron and Theresa Wallach",
     "url": "https://www.historic-uk.com/CultureUK/Florence-Blenkiron-Theresa-Wallach-Motorcyclists/"
    },
    {
     "label": "National Motor Museum: on a Panther through Africa",
     "url": "https://nationalmotormuseum.org.uk/story-of-motoring/motoring-topics/international-womens-day-and-womens-history-month/on-a-panther-through-africa/"
    }
   ],
   "approximate": "Few places are recorded: El Goléa on New Year's Day 1935, and the towns Blenkiron listed on her sidecar on the way back. The line between them is approximate.",
   "stops": [
    {
     "q": "Aldwych, London",
     "name": "London",
     "date": "11 Dec 1934",
     "text": "Away from Crown House, Aldwych, seen off by Lady Astor."
    },
    {
     "q": "El Goléa, Algeria",
     "name": "El Goléa",
     "date": "1 Jan 1935",
     "text": "New Year in the Sahara, deep in Algeria."
    },
    {
     "q": "Bangassou, Central African Republic",
     "name": "Bangassou",
     "text": "Through the forests of Central Africa."
    },
    {
     "q": "Kampala, Uganda",
     "name": "Kampala",
     "text": "Into East Africa."
    },
    {
     "q": "Kakamega, Kenya",
     "name": "Kakamega",
     "text": "Kenya."
    },
    {
     "q": "Harare, Zimbabwe",
     "name": "Salisbury",
     "text": "Better roads for the last 3,000 miles, through Rhodesia."
    },
    {
     "q": "Bloemfontein, South Africa",
     "name": "Bloemfontein",
     "text": "South Africa."
    },
    {
     "q": "Cape Town, South Africa",
     "name": "Cape Town",
     "date": "29 Jul 1935",
     "text": "Cape Town, nearly eight months after London. Blenkiron rode back alone, home in April 1936."
    }
   ]
  },
  {
   "id": "dautheville-1973",
   "title": "Anne-France Dautheville round the world",
   "who": "Anne-France Dautheville",
   "when": "1973",
   "vehicle": "Kawasaki 125",
   "kind": "moto",
   "color": "#c026d3",
   "media": [
    {
     "kind": "book",
     "title": "Et j'ai suivi le vent",
     "by": "Anne-France Dautheville"
    },
    {
     "kind": "book",
     "title": "Une demoiselle sur une moto",
     "by": "Anne-France Dautheville"
    }
   ],
   "summary": "A French journalist becomes the first woman to ride solo round the world, on a little Kawasaki 125, writing about it to pay her way: from Montreal across Canada and Alaska, then Japan, India and Afghanistan back towards France, about 12,500 miles over three continents. She kept travelling the world by motorcycle until 1981.",
   "sources": [
    {
     "label": "Wikipedia: Anne-France Dautheville",
     "url": "https://en.wikipedia.org/wiki/Anne-France_Dautheville"
    },
    {
     "label": "The Vintagent: Anne-France Dautheville",
     "url": "https://thevintagent.com/?p=76013"
    },
    {
     "label": "Overland Magazine: history of overlanding, the 1970s",
     "url": "https://overlandmag.com/resources/history-2/history-1970s/"
    }
   ],
   "approximate": "Only the countries accounts name; the route between them is approximate and partly unknown.",
   "stops": [
    {
     "q": "Montreal, Quebec",
     "name": "Montreal",
     "date": "Jul 1973",
     "text": "The start on a borrowed 125 cc Kawasaki."
    },
    {
     "q": "Anchorage, Alaska",
     "name": "Alaska",
     "text": "Across Canada to Alaska."
    },
    {
     "q": "Tokyo, Japan",
     "name": "Japan",
     "by": "unknown",
     "text": "Bike and rider flew from Alaska to Tokyo for three weeks in Japan, where a dealer rebuilt the tired engine."
    },
    {
     "q": "New Delhi, India",
     "name": "India",
     "by": "unknown",
     "text": "India."
    },
    {
     "q": "Kabul, Afghanistan",
     "name": "Afghanistan",
     "text": "Afghanistan, on the old overland route."
    },
    {
     "q": "Paris, France",
     "name": "Paris",
     "by": "unknown",
     "text": "Home to France."
    }
   ]
  },
  {
   "id": "elspeth-beard",
   "title": "Elspeth Beard: Lone Rider",
   "who": "Elspeth Beard",
   "when": "1982–1984",
   "vehicle": "BMW R60/6",
   "kind": "moto",
   "color": "#4338ca",
   "media": [
    {
     "kind": "book",
     "title": "Lone Rider",
     "by": "Elspeth Beard"
    }
   ],
   "summary": "An architecture student takes a break from her studies and rides an old BMW round the world alone, about 35,000 miles: North America, Australia, Southeast Asia, India in the turmoil after Indira Gandhi's assassination, Pakistan and back through Turkey. Accidents, theft and forged permits along the way; nobody paid attention when she got home, until her book.",
   "sources": [
    {
     "label": "Wikipedia: Elspeth Beard",
     "url": "https://en.wikipedia.org/wiki/Elspeth_Beard"
    }
   ],
   "approximate": "Places named in accounts of the trip; the roads are approximate.",
   "stops": [
    {
     "q": "New York City",
     "name": "New York",
     "date": "1982",
     "text": "The bike shipped over from Britain; the start."
    },
    {
     "q": "Toronto, Canada",
     "name": "Canada",
     "text": "North into Canada."
    },
    {
     "q": "Mexico City",
     "name": "Mexico",
     "text": "South to Mexico, then back to the US."
    },
    {
     "q": "Los Angeles, California",
     "name": "Los Angeles",
     "text": "The bike shipped on to Australia."
    },
    {
     "q": "Sydney, Australia",
     "name": "Sydney",
     "by": "boat",
     "text": "Out of money: seven months working in a pub."
    },
    {
     "q": "Townsville, Queensland",
     "name": "Townsville",
     "text": "A crash and two weeks in hospital."
    },
    {
     "q": "Darwin, Northern Territory",
     "name": "Darwin",
     "text": "Across the top of Australia."
    },
    {
     "q": "Singapore",
     "name": "Singapore",
     "by": "unknown",
     "text": "Six weeks replacing stolen documents and gear."
    },
    {
     "q": "Bangkok, Thailand",
     "name": "Thailand",
     "text": "Up through Malaysia and Thailand."
    },
    {
     "q": "Amritsar, India",
     "name": "Punjab",
     "by": "unknown",
     "text": "Punjab closed after Indira Gandhi's assassination; she forged a permit to get out."
    },
    {
     "q": "Lahore, Pakistan",
     "name": "Pakistan",
     "text": "Into Pakistan."
    },
    {
     "q": "Istanbul, Turkey",
     "name": "Turkey",
     "text": "West across Iran and Turkey to Europe."
    },
    {
     "q": "London, UK",
     "name": "London",
     "date": "1984",
     "text": "Home after about 35,000 miles: one of the first Englishwomen round the world by motorcycle."
    }
   ]
  },
  {
   "id": "pirsig-zen-1968",
   "title": "Pirsig: Zen and the Art of Motorcycle Maintenance",
   "who": "Robert M. Pirsig and his son Chris",
   "when": "July 1968, 17 days",
   "vehicle": "Honda CB77 Super Hawk",
   "kind": "moto",
   "color": "#0f766e",
   "media": [
    {
     "kind": "book",
     "title": "Zen and the Art of Motorcycle Maintenance",
     "by": "Robert M. Pirsig"
    },
    {
     "kind": "book",
     "title": "Zen and Now",
     "by": "Mark Richardson",
     "note": "Retraces the ride forty years on"
    }
   ],
   "summary": "The most-read motorcycle book ever is really a philosophy book. Pirsig and his 11-year-old son ride from Minnesota across the Dakotas and Montana, where their friends the Sutherlands turn back, then over the Rockies and through Idaho and Oregon to the California coast. Along the way: carburettor jets at altitude, the \"classical\" and \"romantic\" ways of seeing, and the ghost of his former self, Phaedrus. The Honda is now in the Smithsonian.",
   "sources": [
    {
     "label": "Wikipedia: Zen and the Art of Motorcycle Maintenance",
     "url": "https://en.wikipedia.org/wiki/Zen_and_the_Art_of_Motorcycle_Maintenance"
    },
    {
     "label": "Psybertron: the ZMM route in detail",
     "url": "https://www.psybertron.org/zammroutedetails.html"
    },
    {
     "label": "Mark Richardson, Zen and Now (extract with route map)",
     "url": "https://cdn.shopify.com/s/files/1/0542/4573/files/Zen_and_Now_Extract.pdf?4631"
    }
   ],
   "approximate": "Towns from route studies of the book; roads between them are approximate.",
   "stops": [
    {
     "q": "Saint Paul, Minnesota",
     "name": "St Paul",
     "date": "July 1968",
     "wiki": "Honda CB77",
     "text": "Father, son and the Sutherlands on a BMW leave the Twin Cities heading west on back roads."
    },
    {
     "q": "Oakes, North Dakota",
     "name": "Oakes",
     "text": "Flat prairie and thunderstorms on the first day.",
     "wiki": "Oakes, North Dakota"
    },
    {
     "q": "Ellendale, North Dakota",
     "name": "Ellendale",
     "text": "Breakfast stop on day two, the start of the long talks about \"Quality\".",
     "wiki": "Ellendale, North Dakota"
    },
    {
     "q": "Lemmon, South Dakota",
     "name": "Lemmon",
     "text": "Across the open Dakotas.",
     "wiki": "Lemmon, South Dakota"
    },
    {
     "q": "Miles City, Montana",
     "name": "Miles City",
     "text": "The engine runs rich with the altitude: new jets and a valve adjustment, the famous lesson in fixing your own machine.",
     "wiki": "Miles City, Montana"
    },
    {
     "q": "Laurel, Montana",
     "name": "Laurel",
     "text": "Towards the mountains.",
     "wiki": "Laurel, Montana"
    },
    {
     "q": "Bozeman, Montana",
     "name": "Bozeman",
     "wiki": "Montana State University",
     "text": "Where Phaedrus once taught writing at the college. The Sutherlands head home from Montana."
    },
    {
     "q": "Missoula, Montana",
     "name": "Missoula",
     "text": "Father and son continue alone.",
     "wiki": "Missoula, Montana"
    },
    {
     "q": "Lolo Pass, Idaho",
     "at": [
      46.635,
      -114.58
     ],
     "name": "Lolo Pass",
     "text": "A night camped on a logging road at the pass.",
     "wiki": "Lolo Pass, Idaho"
    },
    {
     "q": "Cambridge, Idaho",
     "name": "Cambridge",
     "text": "South through Idaho towards Oregon.",
     "wiki": "Cambridge, Idaho"
    },
    {
     "q": "Bend, Oregon",
     "name": "Bend",
     "text": "Across the high desert of central Oregon.",
     "wiki": "Bend, Oregon"
    },
    {
     "q": "Eureka, California",
     "name": "Eureka",
     "text": "Down to the Pacific coast of northern California.",
     "wiki": "Eureka, California"
    },
    {
     "q": "San Francisco, California",
     "name": "San Francisco",
     "text": "The end of the ride and of the book, on the coast road south to the Bay.",
     "wiki": "San Francisco, California"
    }
   ]
  },
  {
   "id": "steinbeck-charley-1960",
   "title": "Steinbeck: Travels with Charley",
   "who": "John Steinbeck and Charley the poodle",
   "when": "September–December 1960",
   "vehicle": "GMC pickup camper \"Rocinante\"",
   "kind": "car",
   "color": "#9a3412",
   "media": [
    {
     "kind": "book",
     "title": "Travels with Charley: In Search of America",
     "by": "John Steinbeck"
    },
    {
     "kind": "book",
     "title": "Dogging Steinbeck",
     "by": "Bill Steigerwald",
     "note": "Fact-checks the trip"
    }
   ],
   "summary": "At 58, Steinbeck sets out to rediscover the country he writes about: almost 10,000 miles round the edge of the United States in a camper named after Don Quixote's horse, with his wife's poodle. Maine potato fields, the Great Lakes, Montana which he loved, the Pacific Northwest, a farewell to his Salinas Valley, a Texas Thanksgiving and the ugly school protests of New Orleans. Later research showed he was rarely alone and tidied up the story.",
   "sources": [
    {
     "label": "Wikipedia: Travels with Charley",
     "url": "https://en.wikipedia.org/wiki/Travels_with_Charley"
    },
    {
     "label": "Bill Steigerwald, \"Sorry, Charley\" (Reason, 2011)",
     "url": "http://reason.com/archives/2011/04/04/sorry-charley"
    }
   ],
   "approximate": "Places named in the book; the roads are approximate.",
   "stops": [
    {
     "q": "Sag Harbor, New York",
     "name": "Sag Harbor",
     "date": "Sept 1960",
     "wiki": "Rocinante",
     "text": "Delayed two weeks by Hurricane Donna, he leaves his Long Island summer home."
    },
    {
     "q": "Bangor, Maine",
     "name": "Bangor",
     "text": "North through New England, closed summer shops and terse farmers.",
     "wiki": "Bangor, Maine"
    },
    {
     "q": "Deer Isle, Maine",
     "name": "Deer Isle",
     "text": "The best lobster he ever ate, and a cat named George.",
     "wiki": "Deer Isle, Maine"
    },
    {
     "q": "Presque Isle, Maine",
     "name": "Northern Maine",
     "text": "A night with French-Canadian potato pickers, sharing wine.",
     "wiki": "Presque Isle, Maine"
    },
    {
     "q": "Niagara Falls, New York",
     "name": "Niagara Falls",
     "text": "Turned back at the Canadian border: Charley lacks his papers.",
     "wiki": "Niagara Falls, New York"
    },
    {
     "q": "Chicago, Illinois",
     "name": "Chicago",
     "text": "A break with his wife Elaine in a hotel.",
     "wiki": "Chicago, Illinois"
    },
    {
     "q": "Sauk Centre, Minnesota",
     "name": "Sauk Centre",
     "text": "Sinclair Lewis's home town, where nobody remembers him.",
     "wiki": "Sauk Centre, Minnesota"
    },
    {
     "q": "Fargo, North Dakota",
     "name": "North Dakota",
     "text": "Across the plains.",
     "wiki": "Fargo, North Dakota"
    },
    {
     "q": "Missoula, Montana",
     "name": "Montana",
     "text": "The state he fell for, and the Great Divide.",
     "wiki": "Missoula, Montana"
    },
    {
     "q": "Seattle, Washington",
     "name": "Seattle",
     "text": "\"I wonder why progress looks so much like destruction.\"",
     "wiki": "Seattle, Washington"
    },
    {
     "q": "Pacific Grove, California",
     "name": "Monterey",
     "text": "Down the coast through Oregon (a flat tyre in the rain), to his old country. Farewell from Fremont Peak.",
     "wiki": "Pacific Grove, California"
    },
    {
     "q": "Barstow, California",
     "name": "Mojave",
     "text": "Dog food for two coyotes instead of a bullet.",
     "wiki": "Barstow, California"
    },
    {
     "q": "Amarillo, Texas",
     "name": "Amarillo",
     "text": "Thanksgiving on a cattle ranch.",
     "wiki": "Amarillo, Texas"
    },
    {
     "q": "New Orleans, Louisiana",
     "name": "New Orleans",
     "text": "The mothers screaming at a newly integrated school depress him deeply.",
     "wiki": "New Orleans, Louisiana"
    },
    {
     "q": "New York City",
     "name": "New York",
     "date": "Dec 1960",
     "text": "Home; he gets lost in his own city.",
     "wiki": "New York City"
    }
   ]
  },
  {
   "id": "fulton-one-man-caravan",
   "title": "Robert Fulton Jr: One Man Caravan",
   "who": "Robert Edison Fulton Jr",
   "when": "1932–1933, 18 months",
   "vehicle": "Douglas twin motorcycle",
   "kind": "moto",
   "color": "#78350f",
   "media": [
    {
     "kind": "book",
     "title": "One Man Caravan",
     "by": "Robert Edison Fulton Jr",
     "isbn": "1884313051"
    }
   ],
   "summary": "A 23-year-old Harvard architecture graduate rides from London to Tokyo, about 25,000 miles, filming 40,000 feet of the world on the way. A night in a Turkish jail, Iraqi bandits avoided, almost shot at in the Khyber Pass, a guest of Indian rajahs. He later invented the Skyhook rescue system.",
   "sources": [
    {
     "label": "Wikipedia: Robert Edison Fulton Jr.",
     "url": "https://en.wikipedia.org/wiki/Robert_Edison_Fulton_Jr."
    }
   ],
   "approximate": "Only the main places of the book; the roads and the Asian legs are approximate.",
   "stops": [
    {
     "q": "London, UK",
     "name": "London",
     "date": "1932",
     "text": "Off on a borrowed idea: ride round the world and study its buildings.",
     "wiki": "London"
    },
    {
     "q": "Vienna, Austria",
     "name": "Vienna",
     "text": "Where he had studied architecture.",
     "wiki": "Vienna"
    },
    {
     "q": "Istanbul, Turkey",
     "name": "Turkey",
     "text": "A night in a Turkish jail.",
     "wiki": "Istanbul"
    },
    {
     "q": "Baghdad, Iraq",
     "name": "Iraq",
     "text": "Across the desert, dodging bandits.",
     "wiki": "Baghdad"
    },
    {
     "q": "Khyber Pass",
     "at": [
      34.0786,
      71.2096
     ],
     "name": "Khyber Pass",
     "text": "Almost shot at by Pashtun tribesmen.",
     "wiki": "Khyber Pass"
    },
    {
     "q": "Delhi, India",
     "name": "India",
     "text": "Guest of rajahs.",
     "wiki": "Delhi"
    },
    {
     "q": "Tokyo, Japan",
     "name": "Tokyo",
     "by": "unknown",
     "date": "1933",
     "text": "The end, with the film that became his lecture tour.",
     "wiki": "Tokyo"
    }
   ]
  },
  {
   "id": "maillart-fleming-1935",
   "title": "Maillart & Fleming: Peking to Kashmir",
   "who": "Ella Maillart and Peter Fleming",
   "when": "February–September 1935",
   "vehicle": "Train, lorry, horse, camel and on foot",
   "kind": "other",
   "color": "#a16207",
   "media": [
    {
     "kind": "book",
     "title": "Forbidden Journey",
     "by": "Ella Maillart"
    },
    {
     "kind": "book",
     "title": "News from Tartary",
     "by": "Peter Fleming"
    }
   ],
   "summary": "A Swiss sailor-skier and a Times correspondent cross China from Peking to Srinagar, 3,500 miles in seven months, to see what was happening in closed Xinjiang after the Kumul rebellion. Deserts, the Tsaidam marshes, caravans and Himalayan passes; two books of the same journey that read very differently.",
   "sources": [
    {
     "label": "Wikipedia: Ella Maillart",
     "url": "https://en.wikipedia.org/wiki/Ella_Maillart"
    },
    {
     "label": "Wikipedia: News from Tartary",
     "url": "https://en.wikipedia.org/wiki/News_from_Tartary"
    }
   ],
   "approximate": "Main towns of the journey; the tracks across the deserts are drawn as straight lines.",
   "stops": [
    {
     "q": "Beijing, China",
     "name": "Peking",
     "date": "Feb 1935",
     "text": "They set off together, against all advice.",
     "wiki": "Beijing"
    },
    {
     "q": "Lanzhou, China",
     "name": "Lanchow",
     "by": "train",
     "text": "By train and lorry into the northwest.",
     "wiki": "Lanzhou"
    },
    {
     "q": "Xining, China",
     "name": "Sining",
     "text": "Last town before the high plateau.",
     "wiki": "Xining"
    },
    {
     "q": "Golmud, China",
     "name": "Tsaidam",
     "route": "line",
     "by": "unknown",
     "text": "Months with caravans across the Tsaidam basin.",
     "wiki": "Golmud"
    },
    {
     "q": "Qiemo, Xinjiang",
     "name": "Cherchen",
     "route": "line",
     "text": "Into the oases on the southern edge of the Taklamakan.",
     "wiki": "Qiemo"
    },
    {
     "q": "Hotan, Xinjiang",
     "name": "Khotan",
     "route": "line",
     "text": "Oasis to oasis on horseback.",
     "wiki": "Hotan"
    },
    {
     "q": "Kashgar, Xinjiang",
     "name": "Kashgar",
     "text": "Guests of the British consulate.",
     "wiki": "Kashgar"
    },
    {
     "q": "Gilgit, Pakistan",
     "name": "Gilgit",
     "route": "line",
     "text": "Over the passes through Hunza.",
     "wiki": "Gilgit"
    },
    {
     "q": "Srinagar, India",
     "name": "Srinagar",
     "date": "Sept 1935",
     "text": "Kashmir after seven months.",
     "wiki": "Srinagar"
    }
   ]
  },
  {
   "id": "amyr-klink-1984",
   "title": "Amyr Klink: Cem dias entre céu e mar",
   "who": "Amyr Klink",
   "when": "12 June – 19 September 1984",
   "vehicle": "Rowing boat IAT",
   "kind": "other",
   "color": "#0369a1",
   "media": [
    {
     "kind": "book",
     "title": "Cem Dias entre Céu e Mar",
     "by": "Amyr Klink",
     "isbn": "8535906428"
    }
   ],
   "summary": "The first solo row across the South Atlantic: a young Brazilian from São Paulo rows 7,000 km in a hundred days from Namibia to Bahia. His book about it is a Brazilian classic, read in schools, and launched a life of polar and ocean voyages.",
   "sources": [
    {
     "label": "Wikipédia: Amyr Klink",
     "url": "https://pt.wikipedia.org/wiki/Amyr_Klink"
    }
   ],
   "approximate": "Start and finish only; the line across the ocean is straight.",
   "stops": [
    {
     "q": "Lüderitz, Namibia",
     "name": "Lüderitz",
     "date": "12 June 1984",
     "text": "Pushes off alone from the Namibian coast.",
     "wiki": "Lüderitz"
    },
    {
     "q": "Itacimirim, Camaçari",
     "at": [
      -12.62,
      -38.05
     ],
     "name": "Praia da Espera",
     "by": "boat",
     "route": "line",
     "date": "19 Sept 1984",
     "text": "Lands at Praia da Espera near Salvador, the last chapter's title."
    }
   ]
  },
  {
   "id": "saramago-viagem-portugal",
   "title": "Saramago: Viagem a Portugal",
   "who": "José Saramago",
   "when": "October 1979 – July 1980",
   "vehicle": "Car",
   "kind": "car",
   "color": "#4d7c0f",
   "media": [
    {
     "kind": "book",
     "title": "Viagem a Portugal",
     "by": "José Saramago"
    }
   ],
   "summary": "Before the Nobel, Saramago drove the whole of mainland Portugal, region by region, writing about churches, paintings, landscapes and people he met. The book's six parts go from the hard northeast to the Algarve; in 2022 RTP made a series with Fábio Porchat visiting the same places.",
   "sources": [
    {
     "label": "Wikipédia: Viagem a Portugal",
     "url": "https://pt.wikipedia.org/wiki/Viagem_a_Portugal"
    }
   ],
   "approximate": "One town per part of the book; the real itinerary had many more stops.",
   "stops": [
    {
     "q": "Miranda do Douro, Portugal",
     "name": "Miranda do Douro",
     "date": "Oct 1979",
     "text": "\"From northeast to northwest, hard and golden\": in through Trás-os-Montes.",
     "wiki": "Miranda do Douro"
    },
    {
     "q": "Bragança, Portugal",
     "name": "Bragança",
     "text": "The northeast.",
     "wiki": "Bragança"
    },
    {
     "q": "Braga, Portugal",
     "name": "Braga",
     "text": "Over to the green Minho.",
     "wiki": "Braga"
    },
    {
     "q": "Aveiro, Portugal",
     "name": "Aveiro",
     "text": "\"Low lands, neighbours of the sea\".",
     "wiki": "Aveiro"
    },
    {
     "q": "Guarda, Portugal",
     "name": "Guarda",
     "text": "\"Gentle Beiras of stone, patience\".",
     "wiki": "Guarda"
    },
    {
     "q": "Coimbra, Portugal",
     "name": "Coimbra",
     "text": "\"Between Mondego and Sado, stop everywhere\".",
     "wiki": "Coimbra"
    },
    {
     "q": "Lisboa, Portugal",
     "name": "Lisboa",
     "text": "The capital and the Tagus.",
     "wiki": "Lisbon"
    },
    {
     "q": "Évora, Portugal",
     "name": "Évora",
     "text": "\"The great and burning land of Alentejo\".",
     "wiki": "Évora"
    },
    {
     "q": "Faro, Portugal",
     "name": "Algarve",
     "date": "July 1980",
     "text": "\"Of Algarve and sun, dry bread and soft bread\".",
     "wiki": "Faro"
    }
   ]
  },
  {
   "id": "kerouac-on-the-road",
   "title": "Kerouac: On the Road, first trip",
   "who": "Jack Kerouac (Sal Paradise)",
   "when": "July 1947",
   "vehicle": "Buses and hitch-hiking",
   "kind": "other",
   "color": "#334155",
   "media": [
    {
     "kind": "book",
     "title": "On the Road",
     "by": "Jack Kerouac"
    }
   ],
   "summary": "The founding text of the road trip. Part one of the novel follows Kerouac's own first crossing of America with $50: buses and hitched rides to Denver and Dean Moriarty, on to San Francisco, cotton fields in California, then back east. Later parts add New Orleans and a car to Mexico City.",
   "sources": [
    {
     "label": "Wikipedia: On the Road",
     "url": "https://en.wikipedia.org/wiki/On_the_Road"
    }
   ],
   "approximate": "Places from the novel's first part; the roads are approximate.",
   "stops": [
    {
     "q": "Paterson, New Jersey",
     "name": "Paterson",
     "date": "July 1947",
     "text": "Leaves his aunt's house with fifty dollars.",
     "wiki": "Paterson, New Jersey"
    },
    {
     "q": "Chicago, Illinois",
     "name": "Chicago",
     "by": "bus",
     "text": "Bebop in the Loop.",
     "wiki": "Chicago, Illinois"
    },
    {
     "q": "Des Moines, Iowa",
     "name": "Des Moines",
     "by": "unknown",
     "text": "Hitching west across Iowa.",
     "wiki": "Des Moines, Iowa"
    },
    {
     "q": "Cheyenne, Wyoming",
     "name": "Cheyenne",
     "by": "unknown",
     "text": "Rodeo week.",
     "wiki": "Cheyenne, Wyoming"
    },
    {
     "q": "Denver, Colorado",
     "name": "Denver",
     "by": "unknown",
     "text": "Dean, Carlo and the parties, and a trip to Central City.",
     "wiki": "Denver, Colorado"
    },
    {
     "q": "San Francisco, California",
     "name": "San Francisco",
     "by": "bus",
     "text": "A job as a night watchman.",
     "wiki": "San Francisco, California"
    },
    {
     "q": "Los Angeles, California",
     "name": "Los Angeles",
     "by": "bus",
     "text": "With Terry.",
     "wiki": "Los Angeles, California"
    },
    {
     "q": "Bakersfield, California",
     "name": "San Joaquin Valley",
     "by": "bus",
     "text": "Picking cotton, and finding he is not made for it.",
     "wiki": "Bakersfield, California"
    },
    {
     "q": "Pittsburgh, Pennsylvania",
     "name": "Pittsburgh",
     "by": "bus",
     "text": "A bus back east.",
     "wiki": "Pittsburgh, Pennsylvania"
    },
    {
     "q": "Times Square, New York",
     "name": "New York",
     "by": "unknown",
     "text": "Hitched to Times Square, broke.",
     "wiki": "Times Square, New York"
    }
   ]
  },
  {
   "id": "tiffany-coates",
   "title": "Tiffany Coates and Thelma: Cape Town to Cairo",
   "who": "Tiffany Coates (with Becky Lincoln, then Maggie)",
   "when": "About 2000 (part of a ride that began in 1997)",
   "vehicle": "BMW R80GS \"Thelma\" (1992)",
   "kind": "moto",
   "color": "#ca8a04",
   "summary": "Two friends with no riding experience and £2,500 between them bought a second-hand BMW R80GS in 1997 to ride to India; nine months turned into years. After Australia, Becky went home to university and Tiffany shipped Thelma to Cape Town, where her friend Maggie flew in to ride up Africa with her: the classic Cape to Cairo, with detours. That section is mapped here. Later she rode the length of the Americas and across northern Asia to Mongolia, more than 200,000 miles on the same bike; today she leads motorcycle tours and is a Churchill Fellow.",
   "sources": [
    {
     "label": "Overland Expo: Community Spotlight, Tiffany Coates",
     "url": "https://www.overlandexpo.com/compass/communitycoates"
    },
    {
     "label": "Exploring Overland: Tiffany Coates' R80GS, Thelma",
     "url": "https://exploringoverland.com/overland-tech-travel/2012/3/2/no-poseur-machine-tiffany-coates-r80gs-thelma.html"
    },
    {
     "label": "Team Motorcycle: interview",
     "url": "https://www.teammotorcycle.com/blog/tiffany-coates-motorcycle-interview"
    },
    {
     "label": "Churchill Fellowship: Tiffany Coates",
     "url": "https://www.churchillfellowship.org/ideas-experts/fellows-directory/tiffany-coates/"
    }
   ],
   "approximate": "Only the start, the region and the end named in interviews; the road between them is the usual Cape to Cairo route, not hers.",
   "stops": [
    {
     "q": "Cape Town, South Africa",
     "name": "Cape Town",
     "wiki": "Cape Town",
     "text": "Thelma shipped to Africa; Maggie flies in from Ireland to join.",
     "date": "c. 2000"
    },
    {
     "q": "Nairobi, Kenya",
     "name": "East Africa",
     "wiki": "Nairobi",
     "text": "North up the classic Cape to Cairo route, with diversions."
    },
    {
     "q": "Cairo, Egypt",
     "name": "Cairo",
     "wiki": "Cairo",
     "text": "The top of Africa."
    }
   ]
  },
];
