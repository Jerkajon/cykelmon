export class BiomeManager {
  constructor({ biomes, rotationMs = 30000, rng = Math.random, onSwitch = () => {} }) {
    this.biomes = biomes;
    this.rotationMs = rotationMs;
    this.rng = rng;
    this.onSwitch = onSwitch;
    this.timeInBiome = 0;
    const startIdx = Math.min(Math.floor(this.rng() * this.biomes.length), this.biomes.length - 1);
    this.currentIdx = startIdx;
  }

  current() {
    return this.biomes[this.currentIdx];
  }

  tick(deltaMs) {
    this.timeInBiome += deltaMs;
    if (this.timeInBiome < this.rotationMs) return;
    this.switch();
  }

  switch() {
    if (this.biomes.length <= 1) {
      this.timeInBiome = 0;
      return;
    }
    let nextIdx = Math.min(Math.floor(this.rng() * this.biomes.length), this.biomes.length - 1);
    if (nextIdx === this.currentIdx) {
      nextIdx = (nextIdx + 1) % this.biomes.length;
    }
    this.currentIdx = nextIdx;
    this.timeInBiome = 0;
    this.onSwitch(this.current());
  }
}
