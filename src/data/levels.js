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
  stubLevel('1-2', 'forest'),
  stubLevel('1-3', 'forest'),
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
