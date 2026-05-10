export class LevelLoader {
  constructor(levelData) {
    this.data = levelData;
    this.id = levelData.id;
    this.length = levelData.length;
  }

  bossPosition() {
    return {
      x: this.length - 200,
      y: 'ground',
      pokemonId: this.data.bossPokemonId,
    };
  }

  platforms() {
    return this.data.platforms;
  }

  pits() {
    return this.data.pits;
  }

  isInPit(x) {
    return this.data.pits.some((p) => x >= p.xStart && x < p.xEnd);
  }

  randomSpots() {
    return this.data.randomSpots;
  }

  powerUp() {
    return this.data.powerUp || null;
  }

  obstacles() {
    return this.data.obstacles;
  }
}
