import { describe, it, expect } from 'vitest';
import { ObstacleSpawner } from '../src/systems/ObstacleSpawner.js';

describe('ObstacleSpawner', () => {
  const baseState = { bikeAirborne: false };
  const types = ['rock'];

  it('spawnar inte under första sekunden', () => {
    const s = new ObstacleSpawner({ obstacleTypes: types, minIntervalMs: 1000, rng: () => 0.5 });
    expect(s.tick(500, baseState)).toBeNull();
  });

  it('spawnar efter minIntervalMs', () => {
    const s = new ObstacleSpawner({ obstacleTypes: types, minIntervalMs: 1000, rng: () => 0.5 });
    s.tick(500, baseState);
    const ev = s.tick(600, baseState);
    expect(ev).not.toBeNull();
    expect(ev.type).toBe('rock');
  });

  it('spawnar inte medan cykeln är i luften', () => {
    const s = new ObstacleSpawner({ obstacleTypes: types, minIntervalMs: 500, rng: () => 0.5 });
    s.tick(500, { bikeAirborne: false });
    const ev = s.tick(600, { bikeAirborne: true });
    expect(ev).toBeNull();
  });

  it('återställer timer efter spawn', () => {
    const s = new ObstacleSpawner({ obstacleTypes: types, minIntervalMs: 1000, rng: () => 0.5 });
    s.tick(1100, baseState); // spawn
    const ev = s.tick(500, baseState);
    expect(ev).toBeNull();
  });

  it('väljer slumpvis bland flera typer', () => {
    const s = new ObstacleSpawner({
      obstacleTypes: ['rock', 'log', 'puddle'],
      minIntervalMs: 100,
      rng: () => 0.99, // sista index
    });
    s.tick(200, baseState);
    expect(s.tick(200, baseState).type).toBe('puddle');
  });

  it('hanterar olika spawn-fönster (variabilitet utöver min)', () => {
    // Med spawnWindowMs=500 och rng=0 ska spawn ske vid minInterval exakt.
    const s = new ObstacleSpawner({
      obstacleTypes: ['rock'],
      minIntervalMs: 1000,
      spawnWindowMs: 500,
      rng: () => 0,
    });
    s.tick(999, baseState);
    expect(s.tick(2, baseState)).not.toBeNull();
  });
});
