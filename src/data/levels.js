// Level-data-format:
// {
//   id: "1-1",                 // Mario Run-stil world-level
//   worldId: "forest",          // matchar BIOMES[].id
//   name: "1-1",                // display
//   length: 4800,               // total horisontell längd i pixlar
//   bossPokemonId: 25,          // boss vid x ~ length-200
//   randomCount: 3,             // antal random pokémon-spots
//   randomSpots: [{x, y}, ...], // x-positioner för random pokémon
//   airPokemon: [{x, y, id}],   // luft-pokémon (coin-block-stil), hopp för att fånga
//   platforms: [{x, y, width, bouncy?}], // bouncy=true → studsa cyklisten högt vid landning
//   pits: [{xStart, xEnd}],     // gaps i marken
//   obstacles: [{x, y, type}],  // y='ground' eller numerisk
//   powerUp: {x, y, type} | null
// }

const FOREST_1_1 = {
  id: '1-1',
  worldId: 'forest',
  name: '1-1',
  length: 7200,
  bossPokemonId: 25,
  randomCount: 6,
  randomSpots: [
    { x: 600, y: 400 },
    { x: 1500, y: 380 },
    { x: 2900, y: 380 },
    { x: 4400, y: 400 },
    { x: 5500, y: 380 },
    { x: 6500, y: 380 },
  ],
  // 16 luft-pokémon utspridda — coin-block-stil reward-loop
  airPokemon: [
    { x: 850, y: 320, id: 10 },
    { x: 1000, y: 280, id: 13 },
    { x: 1150, y: 320, id: 16 },
    { x: 1700, y: 280, id: 10 },
    { x: 1950, y: 240, id: 13 },   // hög, bouncy-plattform 3 hjälper
    { x: 2100, y: 240, id: 16 },
    { x: 2700, y: 250, id: 10 },
    { x: 3000, y: 280, id: 13 },
    { x: 3400, y: 320, id: 16 },
    { x: 4050, y: 200, id: 10 },   // mega-hög, kräver bouncy-plattform 6
    { x: 4150, y: 200, id: 13 },
    { x: 4900, y: 300, id: 16 },
    { x: 5200, y: 380, id: 10 },   // marknivå mellan plattformar
    { x: 5900, y: 340, id: 13 },
    { x: 6300, y: 320, id: 16 },
    { x: 6700, y: 360, id: 10 },
  ],
  // 8 plattformar, varierande höjder, 2 bouncy
  platforms: [
    { x: 700, y: 420, width: 256 },
    { x: 1300, y: 380, width: 200 },
    { x: 1900, y: 420, width: 256, bouncy: true },
    { x: 2600, y: 350, width: 200 },
    { x: 3300, y: 400, width: 256 },
    { x: 4000, y: 320, width: 200, bouncy: true },  // hög + bouncy → mega-launch
    { x: 4800, y: 380, width: 256 },
    { x: 5800, y: 420, width: 320 },                // bred "vila" före slutspurten
  ],
  pits: [
    { xStart: 1100, xEnd: 1250 },
    { xStart: 2400, xEnd: 2550 },
    { xStart: 3700, xEnd: 3850 },
    { xStart: 5300, xEnd: 5500 },
  ],
  obstacles: [
    { x: 950, y: 'ground', type: 'log' },     // tidigt "lärande"-hinder
    { x: 3100, y: 'ground', type: 'log' },    // mid-level
    { x: 6300, y: 'ground', type: 'rock' },   // före boss för spänning
  ],
  powerUp: { x: 2050, y: 360, type: 'shield' },
};

// Skog 1-2: "Bouncy Mastery" — 4 bouncy-plattformar i stegrande höjd, höga luft-pokémon
// kräver hold-to-jump. Få normal-plattformar, fokus på vertikal rörelse.
const FOREST_1_2 = {
  id: '1-2',
  worldId: 'forest',
  name: '1-2',
  length: 7200,
  bossPokemonId: 1,  // Bulbasaur
  randomCount: 5,
  randomSpots: [
    { x: 400, y: 400 },
    { x: 1700, y: 380 },
    { x: 3300, y: 380 },
    { x: 4900, y: 380 },
    { x: 6400, y: 380 },
  ],
  // Höga pokémon ovanför bouncy-plattformer — kräver mega-launch (hold + bouncy)
  airPokemon: [
    { x: 700, y: 320, id: 10 },
    { x: 850, y: 260, id: 13 },    // över bouncy 1
    { x: 1000, y: 200, id: 16 },   // mega-höjd
    { x: 1900, y: 320, id: 1 },
    { x: 2100, y: 220, id: 4 },    // hög, bouncy 2
    { x: 2300, y: 160, id: 16 },   // ULTRA-hög
    { x: 2900, y: 300, id: 10 },
    { x: 3500, y: 200, id: 13 },   // över bouncy 3
    { x: 3650, y: 140, id: 16 },   // ULTRA-hög
    { x: 4400, y: 320, id: 1 },
    { x: 5100, y: 200, id: 4 },    // över bouncy 4
    { x: 5250, y: 140, id: 16 },
    { x: 5800, y: 350, id: 10 },
    { x: 6100, y: 300, id: 13 },
    { x: 6500, y: 280, id: 16 },
  ],
  // 7 plattformar, 4 bouncy (mer än 1-1) — bouncy ladder upp i höjd
  platforms: [
    { x: 600, y: 420, width: 256, bouncy: true },   // intro-bouncy
    { x: 1300, y: 380, width: 200 },                // vila
    { x: 1900, y: 380, width: 256, bouncy: true },  // hög-bouncy
    { x: 2700, y: 350, width: 200 },                // vila
    { x: 3300, y: 350, width: 256, bouncy: true },  // ännu högre
    { x: 4200, y: 380, width: 200 },                // vila
    { x: 5000, y: 320, width: 256, bouncy: true },  // mega-höjd
    { x: 5800, y: 400, width: 320 },                // bred vila före boss
  ],
  pits: [
    { xStart: 1100, xEnd: 1280 },
    { xStart: 2400, xEnd: 2580 },
    { xStart: 4500, xEnd: 4680 },
    { xStart: 6300, xEnd: 6450 },
  ],
  obstacles: [
    { x: 4700, y: 'ground', type: 'log' },  // ett mid-level hinder
  ],
  powerUp: { x: 3650, y: 280, type: 'shield' },
};

// Skog 1-3: "Long Jumps" — wider pits, glesare plattformar, måste kombo-bouncy.
// Slutboss: Charizard (gigantisk visuell impact).
const FOREST_1_3 = {
  id: '1-3',
  worldId: 'forest',
  name: '1-3',
  length: 7200,
  bossPokemonId: 6,  // Charizard
  randomCount: 5,
  randomSpots: [
    { x: 500, y: 400 },
    { x: 1700, y: 380 },
    { x: 3500, y: 380 },
    { x: 5200, y: 380 },
    { x: 6500, y: 380 },
  ],
  airPokemon: [
    { x: 800, y: 340, id: 1 },
    { x: 1100, y: 280, id: 4 },     // över första pit
    { x: 1400, y: 340, id: 16 },
    { x: 2200, y: 280, id: 13 },    // över pit 2
    { x: 2500, y: 240, id: 1 },     // bouncy-zon
    { x: 2900, y: 320, id: 10 },
    { x: 3700, y: 280, id: 16 },    // över pit 3
    { x: 4100, y: 240, id: 4 },     // bouncy 2
    { x: 4500, y: 320, id: 1 },
    { x: 5300, y: 280, id: 13 },    // över pit 4
    { x: 5800, y: 340, id: 16 },
    { x: 6300, y: 320, id: 1 },
  ],
  // 7 plattformar, glesare placering. 2 bouncy strategiskt placerade vid breda pits
  platforms: [
    { x: 700, y: 420, width: 256 },
    { x: 1500, y: 400, width: 200 },
    { x: 2200, y: 380, width: 200, bouncy: true },  // bouncy före wide pit
    { x: 3000, y: 400, width: 200 },
    { x: 4000, y: 380, width: 200, bouncy: true },  // bouncy 2
    { x: 4900, y: 400, width: 256 },
    { x: 6000, y: 420, width: 320 },                // bred vila före slutboss
  ],
  // Wider pits — testar lateral räckvidd. Bouncy-plattformer placerade strategiskt
  pits: [
    { xStart: 1050, xEnd: 1300 },   // 250px (normal hopp + hold)
    { xStart: 2050, xEnd: 2330 },   // 280px (bouncy-launch krävs)
    { xStart: 3500, xEnd: 3850 },   // 350px (bouncy-launch krävs)
    { xStart: 5200, xEnd: 5500 },   // 300px
  ],
  obstacles: [
    { x: 3300, y: 'ground', type: 'log' },
    { x: 6500, y: 'ground', type: 'rock' },  // strax före boss för spänning
  ],
  powerUp: { x: 4100, y: 320, type: 'shield' },
};

const stubLevel = (id, worldId) => ({
  id,
  worldId,
  name: id,
  length: 4800,
  bossPokemonId: null,
  randomCount: 0,
  randomSpots: [],
  airPokemon: [],
  platforms: [],
  pits: [],
  obstacles: [],
  powerUp: null,
});

export const LEVELS = [
  FOREST_1_1,
  FOREST_1_2,
  FOREST_1_3,
  stubLevel('2-1', 'beach'),
  stubLevel('2-2', 'beach'),
  stubLevel('2-3', 'beach'),
  stubLevel('3-1', 'cave'),
  stubLevel('3-2', 'cave'),
  stubLevel('3-3', 'cave'),
  stubLevel('4-1', 'ocean'),
  stubLevel('4-2', 'ocean'),
  stubLevel('4-3', 'ocean'),
];

export function levelById(id) {
  return LEVELS.find((l) => l.id === id);
}

export function levelsByWorld(worldId) {
  return LEVELS.filter((l) => l.worldId === worldId);
}
