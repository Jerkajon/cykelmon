export class ObstacleSpawner {
  constructor({ obstacleTypes, minIntervalMs = 1000, spawnWindowMs = 0, rng = Math.random }) {
    this.obstacleTypes = obstacleTypes;
    this.minIntervalMs = minIntervalMs;
    this.spawnWindowMs = spawnWindowMs;
    this.rng = rng;
    this.timeSinceSpawn = 0;
    this.nextSpawnAt = this.rollNextSpawnAt();
  }

  rollNextSpawnAt() {
    return this.minIntervalMs + this.rng() * this.spawnWindowMs;
  }

  setObstacleTypes(types) {
    this.obstacleTypes = types;
  }

  tick(deltaMs, state) {
    this.timeSinceSpawn += deltaMs;
    if (state.bikeAirborne) return null;
    if (this.timeSinceSpawn < this.nextSpawnAt) return null;

    this.timeSinceSpawn = 0;
    this.nextSpawnAt = this.rollNextSpawnAt();
    const idx = Math.floor(this.rng() * this.obstacleTypes.length);
    const safeIdx = Math.min(idx, this.obstacleTypes.length - 1);
    return { type: this.obstacleTypes[safeIdx] };
  }
}
