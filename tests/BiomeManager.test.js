import { describe, it, expect } from 'vitest';
import { BiomeManager } from '../src/systems/BiomeManager.js';
import { BIOMES } from '../src/data/biomes.js';

describe('BiomeManager', () => {
  it('börjar med ett deterministiskt biom när rng styrs', () => {
    const m = new BiomeManager({ biomes: BIOMES, rotationMs: 30000, rng: () => 0 });
    expect(m.current().id).toBe(BIOMES[0].id);
  });

  it('roterar efter rotationMs', () => {
    const m = new BiomeManager({ biomes: BIOMES, rotationMs: 30000, rng: () => 0.5 });
    const first = m.current();
    m.tick(30001);
    expect(m.current().id).not.toBe(first.id);
  });

  it('roterar inte före rotationMs', () => {
    const m = new BiomeManager({ biomes: BIOMES, rotationMs: 30000, rng: () => 0.5 });
    const first = m.current();
    m.tick(29999);
    expect(m.current().id).toBe(first.id);
  });

  it('väljer aldrig samma biom direkt efter (om alternativ finns)', () => {
    let calls = 0;
    const m = new BiomeManager({
      biomes: BIOMES,
      rotationMs: 100,
      rng: () => {
        // Första anrop ger biom 0, sen försöker vi tvinga 0 igen — manager ska hoppa.
        calls += 1;
        return 0;
      },
    });
    const first = m.current();
    m.tick(101);
    expect(m.current().id).not.toBe(first.id);
  });

  it('emitterar callback vid byte', () => {
    let switched = null;
    const m = new BiomeManager({
      biomes: BIOMES,
      rotationMs: 100,
      rng: () => 0.5,
      onSwitch: (b) => { switched = b; },
    });
    m.tick(101);
    expect(switched).not.toBeNull();
    expect(switched.id).toBeDefined();
  });
});
