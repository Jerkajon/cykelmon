// Level-data-format:
// {
//   id: "1-1",                 // Mario Run-stil world-level
//   worldId: "forest",          // matchar BIOMES[].id
//   name: "1-1",                // display
//   length: 4800,               // total horisontell längd i pixlar
//   bossPokemonId: 25,          // boss vid x ~ length-200
//   randomCount: 3,             // antal random pokémon-spots
//   randomSpots: [{x, y}, ...], // x-positioner för random pokémon
//   platforms: [{x, y, width}], // höjd är fixed 24px
//   pits: [{xStart, xEnd}],     // gaps i marken
//   obstacles: [{x, y, type}],  // y='ground' eller numerisk
//   powerUp: {x, y, type} | null
// }

const FOREST_1_1 = {
  id: '1-1',
  worldId: 'forest',
  name: '1-1',
  length: 4800,
  bossPokemonId: 25,
  randomCount: 3,
  randomSpots: [
    { x: 800, y: 400 },
    { x: 1800, y: 350 },
    { x: 3200, y: 380 },
  ],
  platforms: [
    { x: 700, y: 420, width: 256 },
    { x: 1700, y: 380, width: 256 },
    { x: 2400, y: 350, width: 256 },
    { x: 3100, y: 400, width: 256 },
  ],
  pits: [
    { xStart: 1200, xEnd: 1500 },
    { xStart: 2700, xEnd: 2950 },
  ],
  obstacles: [
    { x: 1100, y: 'ground', type: 'rock' },
    { x: 2200, y: 'ground', type: 'log' },
  ],
  powerUp: { x: 1750, y: 320, type: 'shield' },
};

const stubLevel = (id, worldId) => ({
  id,
  worldId,
  name: id,
  length: 4800,
  bossPokemonId: null,
  randomCount: 0,
  randomSpots: [],
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
