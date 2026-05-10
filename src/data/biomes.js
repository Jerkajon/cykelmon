import { pokemonByBiome } from './pokemon.js';

export const BIOMES = [
  {
    id: 'forest',
    name: 'Skog',
    bgColor: 0x9bcc70,
    obstacleTypes: ['rock', 'log'],
    get pokemonIds() { return pokemonByBiome('forest').map((p) => p.id); },
  },
  {
    id: 'beach',
    name: 'Strand',
    bgColor: 0xfde68a,
    obstacleTypes: ['puddle', 'shell'],
    get pokemonIds() { return pokemonByBiome('beach').map((p) => p.id); },
  },
  {
    id: 'cave',
    name: 'Grotta',
    bgColor: 0x57534e,
    obstacleTypes: ['stalagmite', 'rock'],
    get pokemonIds() { return pokemonByBiome('cave').map((p) => p.id); },
  },
  {
    id: 'ocean',
    name: 'Hav',
    bgColor: 0x0c4a6e,
    obstacleTypes: ['shell', 'puddle'],
    // Avancerade vatten-pokémon (evolutions + djuphavs-typer).
    pokemonIds: [9, 73, 80, 87, 91, 99, 117, 121],
  },
];

export function biomeById(id) {
  return BIOMES.find((b) => b.id === id);
}
