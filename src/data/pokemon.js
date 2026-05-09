// Gen 1 Pokémon, indelade i biomer. Dex-ID matchar PokéAPI.
export const POKEMON = [
  // === SKOG ===
  { id: 1,   name: 'Bulbasaur',  biome: 'forest' },
  { id: 10,  name: 'Caterpie',   biome: 'forest' },
  { id: 16,  name: 'Pidgey',     biome: 'forest' },
  { id: 43,  name: 'Oddish',     biome: 'forest' },
  { id: 25,  name: 'Pikachu',    biome: 'forest' },
  { id: 133, name: 'Eevee',      biome: 'forest' },
  { id: 69,  name: 'Bellsprout', biome: 'forest' },
  { id: 29,  name: 'Nidoran-F',  biome: 'forest' },

  // === STRAND ===
  { id: 7,   name: 'Squirtle',   biome: 'beach' },
  { id: 98,  name: 'Krabby',     biome: 'beach' },
  { id: 54,  name: 'Psyduck',    biome: 'beach' },
  { id: 120, name: 'Staryu',     biome: 'beach' },
  { id: 79,  name: 'Slowpoke',   biome: 'beach' },
  { id: 72,  name: 'Tentacool',  biome: 'beach' },
  { id: 116, name: 'Horsea',     biome: 'beach' },
  { id: 118, name: 'Goldeen',    biome: 'beach' },

  // === GROTTA ===
  { id: 74,  name: 'Geodude',    biome: 'cave' },
  { id: 41,  name: 'Zubat',      biome: 'cave' },
  { id: 95,  name: 'Onix',       biome: 'cave' },
  { id: 50,  name: 'Diglett',    biome: 'cave' },
  { id: 66,  name: 'Machop',     biome: 'cave' },
  { id: 27,  name: 'Sandshrew',  biome: 'cave' },
  { id: 104, name: 'Cubone',     biome: 'cave' },
  { id: 92,  name: 'Gastly',     biome: 'cave' },
];

export function pokemonByBiome(biomeId) {
  return POKEMON.filter((p) => p.biome === biomeId);
}

export function pokemonById(id) {
  return POKEMON.find((p) => p.id === id);
}
