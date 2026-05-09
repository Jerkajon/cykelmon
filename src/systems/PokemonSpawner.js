const MIN_GAP_AFTER_OBSTACLE_MS = 600;

export class PokemonSpawner {
  constructor({ pokemonIds, minIntervalMs = 2000, spawnWindowMs = 1000, shinyChance = 1 / 50, rng = Math.random }) {
    this.pokemonIds = pokemonIds;
    this.minIntervalMs = minIntervalMs;
    this.spawnWindowMs = spawnWindowMs;
    this.shinyChance = shinyChance;
    this.rng = rng;
    this.timeSinceSpawn = 0;
    this.nextSpawnAt = this.rollNextSpawnAt();
  }

  rollNextSpawnAt() {
    return this.minIntervalMs + this.rng() * this.spawnWindowMs;
  }

  setPokemonIds(ids) {
    this.pokemonIds = ids;
  }

  tick(deltaMs, state) {
    this.timeSinceSpawn += deltaMs;
    if (this.timeSinceSpawn < this.nextSpawnAt) return null;
    if (state.timeSinceLastObstacleSpawn !== undefined && state.timeSinceLastObstacleSpawn < MIN_GAP_AFTER_OBSTACLE_MS) {
      return null;
    }

    this.timeSinceSpawn = 0;
    this.nextSpawnAt = this.rollNextSpawnAt();

    const idx = Math.min(Math.floor(this.rng() * this.pokemonIds.length), this.pokemonIds.length - 1);
    const pokemonId = this.pokemonIds[idx];
    const shiny = this.rng() < this.shinyChance;
    return { pokemonId, shiny };
  }
}
