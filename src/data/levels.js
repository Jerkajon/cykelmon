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
  // Pits — bredare än 1-1 men säkert nåbara. Erik:s son (3-åring) fastnade
  // på 230px-pits, så minskar ytterligare + fixade pit-detection-bug i GameScene.
  pits: [
    { xStart: 1100, xEnd: 1240 },   // 140px
    { xStart: 2100, xEnd: 2260 },   // 160px
    { xStart: 3600, xEnd: 3780 },   // 180px (största, bouncy-plattform 4 nära)
    { xStart: 5250, xEnd: 5420 },   // 170px
  ],
  obstacles: [
    { x: 3300, y: 'ground', type: 'log' },
    { x: 6500, y: 'ground', type: 'rock' },  // strax före boss för spänning
  ],
  powerUp: { x: 4100, y: 320, type: 'shield' },
};

// =========================================================================
// STRAND (Beach) — fler pits (vattenhål), färre obstacles, tätare plattformar
// =========================================================================

const BEACH_2_1 = {
  id: '2-1', worldId: 'beach', name: '2-1', length: 7200,
  bossPokemonId: 7,  // Squirtle
  randomCount: 6,
  randomSpots: [
    { x: 500, y: 400 }, { x: 1700, y: 380 }, { x: 2900, y: 380 },
    { x: 4300, y: 400 }, { x: 5400, y: 380 }, { x: 6400, y: 380 },
  ],
  airPokemon: [
    { x: 800, y: 320, id: 54 }, { x: 1100, y: 280, id: 90 },
    { x: 1500, y: 300, id: 72 }, { x: 2100, y: 260, id: 118 },
    { x: 2400, y: 280, id: 86 }, { x: 2900, y: 320, id: 60 },
    { x: 3500, y: 280, id: 116 }, { x: 3900, y: 240, id: 90 },
    { x: 4500, y: 320, id: 120 }, { x: 5100, y: 280, id: 60 },
    { x: 5800, y: 300, id: 72 }, { x: 6300, y: 280, id: 118 },
  ],
  platforms: [
    { x: 600, y: 420, width: 256 },
    { x: 1300, y: 400, width: 200 },
    { x: 2000, y: 380, width: 200, bouncy: true },
    { x: 2700, y: 400, width: 256 },
    { x: 3500, y: 380, width: 200 },
    { x: 4200, y: 380, width: 200, bouncy: true },
    { x: 5000, y: 400, width: 256 },
    { x: 5800, y: 420, width: 320 },
  ],
  // Fler vattenhål-pits (5 st), kortare avstånd → tätare hopp-rytm
  pits: [
    { xStart: 1050, xEnd: 1280 }, { xStart: 1750, xEnd: 1980 },
    { xStart: 3200, xEnd: 3450 }, { xStart: 4500, xEnd: 4750 },
    { xStart: 5550, xEnd: 5780 },
  ],
  obstacles: [{ x: 4000, y: 'ground', type: 'shell' }],
  powerUp: { x: 2200, y: 320, type: 'shield' },
};

const BEACH_2_2 = {
  id: '2-2', worldId: 'beach', name: '2-2', length: 7200,
  bossPokemonId: 79,  // Slowpoke
  randomCount: 5,
  randomSpots: [
    { x: 600, y: 400 }, { x: 1900, y: 380 }, { x: 3400, y: 380 },
    { x: 4900, y: 380 }, { x: 6300, y: 380 },
  ],
  airPokemon: [
    { x: 800, y: 280, id: 90 }, { x: 1000, y: 220, id: 116 },
    { x: 1300, y: 280, id: 120 }, { x: 1900, y: 240, id: 60 },
    { x: 2300, y: 200, id: 118 }, { x: 2700, y: 240, id: 86 },
    { x: 3300, y: 220, id: 72 }, { x: 3900, y: 180, id: 116 },
    { x: 4500, y: 280, id: 90 }, { x: 5100, y: 220, id: 120 },
    { x: 5700, y: 240, id: 60 }, { x: 6200, y: 280, id: 86 },
  ],
  // 4 bouncy stegrande höjd — beach-version av "Bouncy Mastery"
  platforms: [
    { x: 600, y: 420, width: 256, bouncy: true },
    { x: 1300, y: 380, width: 200 },
    { x: 1900, y: 360, width: 200, bouncy: true },
    { x: 2600, y: 380, width: 200 },
    { x: 3300, y: 340, width: 200, bouncy: true },
    { x: 4100, y: 400, width: 200 },
    { x: 4900, y: 320, width: 256, bouncy: true },
    { x: 5800, y: 400, width: 320 },
  ],
  pits: [
    { xStart: 1100, xEnd: 1280 }, { xStart: 2400, xEnd: 2580 },
    { xStart: 4400, xEnd: 4880 },  // 480px bred — kräver bouncy + hold
    { xStart: 6300, xEnd: 6480 },
  ],
  obstacles: [{ x: 3800, y: 'ground', type: 'shell' }],
  powerUp: { x: 3450, y: 280, type: 'magnet' },
};

const BEACH_2_3 = {
  id: '2-3', worldId: 'beach', name: '2-3', length: 7200,
  bossPokemonId: 9,  // Blastoise — slutboss för Strand
  randomCount: 6,
  randomSpots: [
    { x: 500, y: 400 }, { x: 1500, y: 380 }, { x: 2700, y: 380 },
    { x: 4200, y: 380 }, { x: 5400, y: 400 }, { x: 6400, y: 380 },
  ],
  airPokemon: [
    { x: 800, y: 320, id: 54 }, { x: 1200, y: 260, id: 86 },
    { x: 1700, y: 280, id: 118 }, { x: 2200, y: 240, id: 90 },
    { x: 2700, y: 320, id: 116 }, { x: 3300, y: 240, id: 120 },
    { x: 3700, y: 200, id: 72 }, { x: 4300, y: 280, id: 60 },
    { x: 4900, y: 240, id: 118 }, { x: 5500, y: 280, id: 90 },
    { x: 6000, y: 320, id: 86 }, { x: 6500, y: 280, id: 116 },
  ],
  platforms: [
    { x: 700, y: 420, width: 256 },
    { x: 1500, y: 400, width: 200, bouncy: true },
    { x: 2300, y: 380, width: 200 },
    { x: 3100, y: 360, width: 200, bouncy: true },
    { x: 3900, y: 380, width: 200 },
    { x: 4700, y: 360, width: 200, bouncy: true },
    { x: 5500, y: 400, width: 256 },
    { x: 6100, y: 420, width: 256 },
  ],
  pits: [
    { xStart: 1100, xEnd: 1380 }, { xStart: 2050, xEnd: 2280 },
    { xStart: 3500, xEnd: 3780 }, { xStart: 4400, xEnd: 4680 },
    { xStart: 5350, xEnd: 5480 },
  ],
  obstacles: [
    { x: 1900, y: 'ground', type: 'shell' },
    { x: 6500, y: 'ground', type: 'shell' },
  ],
  powerUp: { x: 3250, y: 300, type: 'shield' },
};

// =========================================================================
// GROTTA (Cave) — stalagmite-fokus, fler obstacles, claustrofobic
// =========================================================================

const CAVE_3_1 = {
  id: '3-1', worldId: 'cave', name: '3-1', length: 7200,
  bossPokemonId: 50,  // Diglett
  randomCount: 5,
  randomSpots: [
    { x: 500, y: 400 }, { x: 1700, y: 380 }, { x: 3100, y: 380 },
    { x: 4500, y: 400 }, { x: 6000, y: 380 },
  ],
  airPokemon: [
    { x: 850, y: 340, id: 41 }, { x: 1300, y: 320, id: 19 },
    { x: 1800, y: 280, id: 27 }, { x: 2400, y: 320, id: 41 },
    { x: 2900, y: 280, id: 50 }, { x: 3500, y: 320, id: 19 },
    { x: 4100, y: 280, id: 27 }, { x: 4700, y: 300, id: 41 },
    { x: 5400, y: 320, id: 50 }, { x: 6100, y: 300, id: 19 },
  ],
  // Färre plattformar, mer ground-rörelse + stalagmite-hinder
  platforms: [
    { x: 700, y: 420, width: 256 },
    { x: 1500, y: 400, width: 256 },
    { x: 2400, y: 380, width: 200, bouncy: true },
    { x: 3300, y: 400, width: 256 },
    { x: 4200, y: 400, width: 200 },
    { x: 5100, y: 380, width: 256, bouncy: true },
    { x: 5900, y: 400, width: 320 },
  ],
  pits: [
    { xStart: 1200, xEnd: 1400 }, { xStart: 3900, xEnd: 4100 },
    { xStart: 5750, xEnd: 5880 },
  ],
  // Fler stalagmiter — cave-tema, lärande att auto-vault eller hold-jump
  obstacles: [
    { x: 1100, y: 'ground', type: 'stalagmite' },
    { x: 2100, y: 'ground', type: 'stalagmite' },
    { x: 3100, y: 'ground', type: 'rock' },
    { x: 4500, y: 'ground', type: 'stalagmite' },
    { x: 6500, y: 'ground', type: 'stalagmite' },
  ],
  powerUp: { x: 2550, y: 320, type: 'shield' },
};

const CAVE_3_2 = {
  id: '3-2', worldId: 'cave', name: '3-2', length: 7200,
  bossPokemonId: 42,  // Golbat
  randomCount: 5,
  randomSpots: [
    { x: 600, y: 400 }, { x: 1900, y: 380 }, { x: 3300, y: 380 },
    { x: 4700, y: 400 }, { x: 6200, y: 380 },
  ],
  airPokemon: [
    { x: 900, y: 280, id: 41 }, { x: 1300, y: 220, id: 42 },
    { x: 1700, y: 260, id: 19 }, { x: 2200, y: 280, id: 27 },
    { x: 2700, y: 220, id: 50 }, { x: 3300, y: 280, id: 41 },
    { x: 3900, y: 240, id: 42 }, { x: 4500, y: 280, id: 19 },
    { x: 5200, y: 220, id: 27 }, { x: 5800, y: 260, id: 50 },
    { x: 6400, y: 300, id: 41 },
  ],
  platforms: [
    { x: 700, y: 420, width: 256 },
    { x: 1500, y: 400, width: 200, bouncy: true },
    { x: 2300, y: 380, width: 200 },
    { x: 3100, y: 360, width: 200, bouncy: true },
    { x: 3900, y: 380, width: 200 },
    { x: 4700, y: 360, width: 200, bouncy: true },
    { x: 5500, y: 400, width: 256 },
    { x: 6100, y: 420, width: 256 },
  ],
  pits: [
    { xStart: 1100, xEnd: 1280 }, { xStart: 2900, xEnd: 3080 },
    { xStart: 4500, xEnd: 4680 }, { xStart: 5300, xEnd: 5480 },
  ],
  // Stalagmite-tunnel: hinder mellan varje plattform
  obstacles: [
    { x: 1900, y: 'ground', type: 'stalagmite' },
    { x: 2700, y: 'ground', type: 'rock' },
    { x: 3500, y: 'ground', type: 'stalagmite' },
    { x: 4300, y: 'ground', type: 'stalagmite' },
    { x: 5900, y: 'ground', type: 'rock' },
  ],
  powerUp: { x: 3250, y: 280, type: 'magnet' },
};

const CAVE_3_3 = {
  id: '3-3', worldId: 'cave', name: '3-3', length: 7200,
  bossPokemonId: 142,  // Aerodactyl — episk slutboss
  randomCount: 5,
  randomSpots: [
    { x: 500, y: 400 }, { x: 1800, y: 380 }, { x: 3200, y: 380 },
    { x: 4600, y: 400 }, { x: 6000, y: 380 },
  ],
  airPokemon: [
    { x: 800, y: 300, id: 50 }, { x: 1200, y: 240, id: 42 },
    { x: 1700, y: 280, id: 27 }, { x: 2300, y: 220, id: 41 },
    { x: 2800, y: 280, id: 19 }, { x: 3400, y: 200, id: 42 },
    { x: 3900, y: 260, id: 50 }, { x: 4500, y: 240, id: 27 },
    { x: 5100, y: 200, id: 41 }, { x: 5700, y: 260, id: 42 },
    { x: 6300, y: 280, id: 19 },
  ],
  platforms: [
    { x: 600, y: 420, width: 256, bouncy: true },
    { x: 1300, y: 380, width: 200 },
    { x: 2100, y: 350, width: 200, bouncy: true },
    { x: 2900, y: 380, width: 200 },
    { x: 3700, y: 320, width: 200, bouncy: true },
    { x: 4500, y: 380, width: 200 },
    { x: 5300, y: 340, width: 200, bouncy: true },
    { x: 6100, y: 400, width: 256 },
  ],
  pits: [
    { xStart: 1050, xEnd: 1280 }, { xStart: 1850, xEnd: 2080 },
    { xStart: 3300, xEnd: 3680 }, { xStart: 4900, xEnd: 5280 },
    { xStart: 6050, xEnd: 6080 },
  ],
  obstacles: [
    { x: 2700, y: 'ground', type: 'stalagmite' },
    { x: 4300, y: 'ground', type: 'rock' },
    { x: 5900, y: 'ground', type: 'stalagmite' },
  ],
  powerUp: { x: 3850, y: 260, type: 'shield' },
};

// =========================================================================
// HAV (Ocean) — extreme bouncy, plattformar över breda vattenhål, få mark
// =========================================================================

const OCEAN_4_1 = {
  id: '4-1', worldId: 'ocean', name: '4-1', length: 7200,
  bossPokemonId: 134,  // Vaporeon
  randomCount: 4,
  randomSpots: [
    { x: 400, y: 400 }, { x: 2900, y: 380 },
    { x: 4900, y: 380 }, { x: 6500, y: 380 },
  ],
  airPokemon: [
    { x: 700, y: 280, id: 138 }, { x: 1100, y: 220, id: 130 },
    { x: 1500, y: 260, id: 147 }, { x: 2000, y: 200, id: 134 },
    { x: 2500, y: 240, id: 138 }, { x: 3100, y: 200, id: 131 },
    { x: 3600, y: 240, id: 147 }, { x: 4100, y: 200, id: 130 },
    { x: 4700, y: 240, id: 138 }, { x: 5300, y: 200, id: 134 },
    { x: 5800, y: 260, id: 147 }, { x: 6300, y: 240, id: 130 },
  ],
  // Mest bouncy-plattformer — extreme launch-känsla
  platforms: [
    { x: 600, y: 420, width: 200, bouncy: true },
    { x: 1300, y: 380, width: 200, bouncy: true },
    { x: 2000, y: 360, width: 200 },
    { x: 2700, y: 380, width: 200, bouncy: true },
    { x: 3400, y: 360, width: 200, bouncy: true },
    { x: 4100, y: 380, width: 200 },
    { x: 4800, y: 360, width: 200, bouncy: true },
    { x: 5500, y: 380, width: 200, bouncy: true },
    { x: 6300, y: 400, width: 256 },
  ],
  // Många wide pits — hopp över vatten
  pits: [
    { xStart: 1050, xEnd: 1280 }, { xStart: 1750, xEnd: 1980 },
    { xStart: 2450, xEnd: 2680 }, { xStart: 3150, xEnd: 3380 },
    { xStart: 3850, xEnd: 4080 }, { xStart: 4550, xEnd: 4780 },
    { xStart: 5250, xEnd: 5480 }, { xStart: 5950, xEnd: 6280 },
  ],
  obstacles: [],  // Inga obstacles — ren bouncy-platforming
  powerUp: { x: 3500, y: 280, type: 'shield' },
};

const OCEAN_4_2 = {
  id: '4-2', worldId: 'ocean', name: '4-2', length: 7200,
  bossPokemonId: 131,  // Lapras
  randomCount: 4,
  randomSpots: [
    { x: 500, y: 400 }, { x: 3000, y: 380 },
    { x: 5000, y: 380 }, { x: 6400, y: 380 },
  ],
  airPokemon: [
    { x: 800, y: 240, id: 130 }, { x: 1200, y: 180, id: 134 },
    { x: 1600, y: 220, id: 138 }, { x: 2100, y: 160, id: 147 },
    { x: 2600, y: 200, id: 131 }, { x: 3100, y: 160, id: 130 },
    { x: 3700, y: 220, id: 134 }, { x: 4200, y: 180, id: 138 },
    { x: 4800, y: 220, id: 147 }, { x: 5300, y: 160, id: 131 },
    { x: 5900, y: 200, id: 130 }, { x: 6400, y: 240, id: 134 },
  ],
  // 5 bouncy stegrande mega-höjd — wave-hopping kedja
  platforms: [
    { x: 600, y: 420, width: 200, bouncy: true },
    { x: 1300, y: 380, width: 200, bouncy: true },
    { x: 2100, y: 340, width: 200, bouncy: true },
    { x: 2900, y: 320, width: 200, bouncy: true },
    { x: 3700, y: 300, width: 200, bouncy: true },
    { x: 4500, y: 340, width: 200 },
    { x: 5300, y: 320, width: 200, bouncy: true },
    { x: 6100, y: 400, width: 320 },
  ],
  pits: [
    { xStart: 1100, xEnd: 1280 }, { xStart: 1850, xEnd: 2080 },
    { xStart: 2650, xEnd: 2880 }, { xStart: 3450, xEnd: 3680 },
    { xStart: 4250, xEnd: 4480 }, { xStart: 5050, xEnd: 5280 },
    { xStart: 5850, xEnd: 6080 },
  ],
  obstacles: [],
  powerUp: { x: 4600, y: 280, type: 'magnet' },
};

const OCEAN_4_3 = {
  id: '4-3', worldId: 'ocean', name: '4-3', length: 7200,
  bossPokemonId: 151,  // Mew — final boss för hela spelet
  randomCount: 5,
  randomSpots: [
    { x: 500, y: 400 }, { x: 2000, y: 380 }, { x: 3500, y: 380 },
    { x: 5000, y: 380 }, { x: 6300, y: 380 },
  ],
  airPokemon: [
    { x: 800, y: 280, id: 134 }, { x: 1200, y: 220, id: 138 },
    { x: 1600, y: 180, id: 147 }, { x: 2100, y: 240, id: 131 },
    { x: 2600, y: 180, id: 130 }, { x: 3100, y: 220, id: 134 },
    { x: 3600, y: 160, id: 147 }, { x: 4100, y: 200, id: 138 },
    { x: 4600, y: 160, id: 131 }, { x: 5100, y: 220, id: 130 },
    { x: 5600, y: 180, id: 134 }, { x: 6100, y: 240, id: 147 },
  ],
  platforms: [
    { x: 600, y: 420, width: 256 },
    { x: 1500, y: 380, width: 200, bouncy: true },
    { x: 2300, y: 340, width: 200, bouncy: true },
    { x: 3100, y: 300, width: 200, bouncy: true },
    { x: 3900, y: 280, width: 200, bouncy: true },
    { x: 4700, y: 320, width: 200, bouncy: true },
    { x: 5500, y: 360, width: 200, bouncy: true },
    { x: 6300, y: 420, width: 256 },
  ],
  pits: [
    { xStart: 1100, xEnd: 1480 },  // Ultra-wide 380px
    { xStart: 2050, xEnd: 2280 },
    { xStart: 2850, xEnd: 3080 },
    { xStart: 3650, xEnd: 3880 },
    { xStart: 4450, xEnd: 4680 },
    { xStart: 5250, xEnd: 5480 },
    { xStart: 6050, xEnd: 6280 },
  ],
  obstacles: [],
  powerUp: { x: 4000, y: 240, type: 'shield' },
};

const stubLevel = (id, worldId) => ({
  id, worldId, name: id, length: 4800,
  bossPokemonId: null, randomCount: 0,
  randomSpots: [], airPokemon: [], platforms: [], pits: [], obstacles: [],
  powerUp: null,
});

export const LEVELS = [
  FOREST_1_1, FOREST_1_2, FOREST_1_3,
  BEACH_2_1, BEACH_2_2, BEACH_2_3,
  CAVE_3_1, CAVE_3_2, CAVE_3_3,
  OCEAN_4_1, OCEAN_4_2, OCEAN_4_3,
];

export function levelById(id) {
  return LEVELS.find((l) => l.id === id);
}

export function levelsByWorld(worldId) {
  return LEVELS.filter((l) => l.worldId === worldId);
}
