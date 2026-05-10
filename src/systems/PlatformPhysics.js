const AUTO_VAULT_TRIGGER_DISTANCE = 80;

export class PlatformPhysics {
  constructor({ platforms, pits, obstacles }) {
    this.platforms = platforms;
    this.pits = pits;
    this.obstacles = obstacles;
  }

  shouldAutoVault(bikeX, bikeY) {
    if (bikeY !== 'ground') return false;
    return this.obstacles.some((o) => {
      if (o.y !== 'ground') return false;
      const distance = o.x - bikeX;
      return distance > 0 && distance <= AUTO_VAULT_TRIGGER_DISTANCE;
    });
  }

  isOverPit(x) {
    return this.pits.some((p) => x >= p.xStart && x < p.xEnd);
  }

  platformAt(x) {
    return this.platforms.find((p) => x >= p.x && x <= p.x + p.width) || null;
  }

  lastSafePlatformBefore(x) {
    const candidates = this.platforms.filter((p) => p.x + p.width < x);
    if (candidates.length === 0) return null;
    return candidates.reduce((latest, p) => (p.x > latest.x ? p : latest));
  }
}
