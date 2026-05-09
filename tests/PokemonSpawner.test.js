import { describe, it, expect } from 'vitest';
import { PokemonSpawner } from '../src/systems/PokemonSpawner.js';

describe('PokemonSpawner', () => {
  const baseState = { timeSinceLastObstacleSpawn: 1000, bikeAirborne: false };

  it('spawnar inte direkt vid spelstart', () => {
    const s = new PokemonSpawner({
      pokemonIds: [25],
      minIntervalMs: 2000,
      spawnWindowMs: 0,
      shinyChance: 0,
      rng: () => 0,
    });
    expect(s.tick(500, baseState)).toBeNull();
  });

  it('spawnar efter min-intervall om mellanrummen är OK', () => {
    const s = new PokemonSpawner({
      pokemonIds: [25],
      minIntervalMs: 2000,
      spawnWindowMs: 0,
      shinyChance: 0,
      rng: () => 0,
    });
    s.tick(1000, baseState);
    const ev = s.tick(1100, baseState);
    expect(ev).not.toBeNull();
    expect(ev.pokemonId).toBe(25);
    expect(ev.shiny).toBe(false);
  });

  it('spawnar inte om hinder kom nyligen (mellanrum för smalt)', () => {
    const s = new PokemonSpawner({
      pokemonIds: [25],
      minIntervalMs: 1000,
      spawnWindowMs: 0,
      shinyChance: 0,
      rng: () => 0,
    });
    const ev = s.tick(1500, { timeSinceLastObstacleSpawn: 100, bikeAirborne: false });
    expect(ev).toBeNull();
  });

  it('rullar shiny när rng < shinyChance', () => {
    const s = new PokemonSpawner({
      pokemonIds: [25],
      minIntervalMs: 100,
      spawnWindowMs: 0,
      shinyChance: 0.5,
      rng: () => 0.1, // < 0.5 → shiny
    });
    const ev = s.tick(200, baseState);
    expect(ev.shiny).toBe(true);
  });

  it('rullar inte shiny när rng > shinyChance', () => {
    const s = new PokemonSpawner({
      pokemonIds: [25],
      minIntervalMs: 100,
      spawnWindowMs: 0,
      shinyChance: 0.5,
      rng: () => 0.9,
    });
    const ev = s.tick(200, baseState);
    expect(ev.shiny).toBe(false);
  });

  it('väljer slumpvis bland pokemonIds', () => {
    const s = new PokemonSpawner({
      pokemonIds: [1, 25, 7],
      minIntervalMs: 100,
      spawnWindowMs: 0,
      shinyChance: 0,
      rng: () => 0.99, // sista index
    });
    const ev = s.tick(200, baseState);
    expect(ev.pokemonId).toBe(7);
  });

  it('setPokemonIds byter listan utan att återställa timer', () => {
    const s = new PokemonSpawner({
      pokemonIds: [1],
      minIntervalMs: 1000,
      spawnWindowMs: 0,
      shinyChance: 0,
      rng: () => 0,
    });
    s.tick(500, baseState);
    s.setPokemonIds([25]);
    const ev = s.tick(600, baseState);
    expect(ev.pokemonId).toBe(25);
  });
});
