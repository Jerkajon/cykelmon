import { describe, it, expect } from 'vitest';
import { StarTracker } from './StarTracker.js';

describe('StarTracker', () => {
  it('startar med 0 stjärnor', () => {
    const t = new StarTracker({ randomCount: 3 });
    expect(t.computeStars()).toBe(0);
  });

  it('ger 1 stjärna när boss plockad', () => {
    const t = new StarTracker({ randomCount: 3 });
    t.recordBossPickup();
    expect(t.computeStars()).toBe(1);
  });

  it('ger 2 stjärnor när boss + alla random plockade men bonk', () => {
    const t = new StarTracker({ randomCount: 3 });
    t.recordBossPickup();
    t.recordRandomPickup();
    t.recordRandomPickup();
    t.recordRandomPickup();
    t.recordBonk();
    expect(t.computeStars()).toBe(2);
  });

  it('ger 3 stjärnor när boss + alla random + ingen bonk', () => {
    const t = new StarTracker({ randomCount: 3 });
    t.recordBossPickup();
    t.recordRandomPickup();
    t.recordRandomPickup();
    t.recordRandomPickup();
    expect(t.computeStars()).toBe(3);
  });

  it('reducerar stjärnor till 2 om bonk skedde efter alla pickups', () => {
    const t = new StarTracker({ randomCount: 2 });
    t.recordBossPickup();
    t.recordRandomPickup();
    t.recordRandomPickup();
    t.recordBonk();
    expect(t.computeStars()).toBe(2);
  });

  it('reducerar till 1 stjärna om missing random + ingen bonk', () => {
    const t = new StarTracker({ randomCount: 3 });
    t.recordBossPickup();
    t.recordRandomPickup();
    t.recordRandomPickup();
    expect(t.computeStars()).toBe(1);
  });

  it('ger fortfarande 0 om boss inte plockad även med alla random', () => {
    const t = new StarTracker({ randomCount: 3 });
    t.recordRandomPickup();
    t.recordRandomPickup();
    t.recordRandomPickup();
    expect(t.computeStars()).toBe(0);
  });

  it('flera bonkar räknas inte mer än en (no-bonk är binär)', () => {
    const t = new StarTracker({ randomCount: 1 });
    t.recordBossPickup();
    t.recordRandomPickup();
    t.recordBonk();
    t.recordBonk();
    expect(t.computeStars()).toBe(2);
  });
});
