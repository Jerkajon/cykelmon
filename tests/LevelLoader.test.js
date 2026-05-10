import { describe, it, expect } from 'vitest';
import { LevelLoader } from '../src/systems/LevelLoader.js';

const SAMPLE_LEVEL = {
  id: '1-1',
  worldId: 'forest',
  name: '1-1',
  length: 4800,
  bossPokemonId: 25,
  randomCount: 2,
  randomSpots: [
    { x: 800, y: 400 },
    { x: 1800, y: 350 },
  ],
  platforms: [
    { x: 700, y: 420, width: 256 },
    { x: 1700, y: 380, width: 256 },
  ],
  pits: [
    { xStart: 1200, xEnd: 1500 },
  ],
  obstacles: [
    { x: 1100, y: 'ground', type: 'rock' },
  ],
  powerUp: { x: 1750, y: 320, type: 'shield' },
};

describe('LevelLoader', () => {
  it('exponerar level-id och längd', () => {
    const loader = new LevelLoader(SAMPLE_LEVEL);
    expect(loader.id).toBe('1-1');
    expect(loader.length).toBe(4800);
  });

  it('returnerar boss-position vid nivåns slut', () => {
    const loader = new LevelLoader(SAMPLE_LEVEL);
    const boss = loader.bossPosition();
    expect(boss.x).toBe(4600); // length - 200
    expect(boss.pokemonId).toBe(25);
  });

  it('returnerar alla plattformar', () => {
    const loader = new LevelLoader(SAMPLE_LEVEL);
    expect(loader.platforms()).toHaveLength(2);
    expect(loader.platforms()[0].x).toBe(700);
  });

  it('returnerar alla pits', () => {
    const loader = new LevelLoader(SAMPLE_LEVEL);
    expect(loader.pits()).toHaveLength(1);
    expect(loader.pits()[0].xStart).toBe(1200);
  });

  it('isInPit returnerar true om x är inom ett pit', () => {
    const loader = new LevelLoader(SAMPLE_LEVEL);
    expect(loader.isInPit(1300)).toBe(true);
    expect(loader.isInPit(1100)).toBe(false);
    expect(loader.isInPit(1500)).toBe(false); // exclusive end
  });

  it('returnerar random-pokémon-spots', () => {
    const loader = new LevelLoader(SAMPLE_LEVEL);
    expect(loader.randomSpots()).toHaveLength(2);
  });

  it('returnerar power-up eller null', () => {
    const loader = new LevelLoader(SAMPLE_LEVEL);
    expect(loader.powerUp().type).toBe('shield');

    const noPowerLevel = { ...SAMPLE_LEVEL, powerUp: null };
    expect(new LevelLoader(noPowerLevel).powerUp()).toBeNull();
  });

  it('returnerar alla obstacles', () => {
    const loader = new LevelLoader(SAMPLE_LEVEL);
    expect(loader.obstacles()).toHaveLength(1);
    expect(loader.obstacles()[0].type).toBe('rock');
  });
});
