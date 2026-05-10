export class StarTracker {
  constructor({ randomCount }) {
    this.randomCount = randomCount;
    this.bossPicked = false;
    this.randomPickedCount = 0;
    this.bonked = false;
  }

  recordBossPickup() {
    this.bossPicked = true;
  }

  recordRandomPickup() {
    this.randomPickedCount += 1;
  }

  recordBonk() {
    this.bonked = true;
  }

  computeStars() {
    if (!this.bossPicked) return 0;
    let stars = 1;
    if (this.randomPickedCount >= this.randomCount) stars = 2;
    if (stars === 2 && !this.bonked) stars = 3;
    return stars;
  }
}
