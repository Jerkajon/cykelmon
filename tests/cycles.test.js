import { describe, it, expect } from 'vitest';
import { CYCLES, unlockedCycles, activeCycle, nextCycle } from '../src/data/cycles.js';

describe('cycles — Mario Run thresholds', () => {
  it('trösklar är [0, 12, 24, 36] = 12 nivåer × 3 stjärnor', () => {
    expect(CYCLES.map((c) => c.threshold)).toEqual([0, 12, 24, 36]);
  });

  it('0 stjärnor → bara Standard upplåst', () => {
    expect(unlockedCycles(0).map((c) => c.id)).toEqual(['std']);
  });

  it('11 stjärnor → fortfarande bara Standard', () => {
    expect(unlockedCycles(11).map((c) => c.id)).toEqual(['std']);
  });

  it('12 stjärnor → Röd Racer upplåst', () => {
    expect(unlockedCycles(12).map((c) => c.id)).toEqual(['std', 'red']);
  });

  it('24 stjärnor → Lila Sväv upplåst', () => {
    expect(unlockedCycles(24).map((c) => c.id)).toEqual(['std', 'red', 'purple']);
  });

  it('36 stjärnor (max) → alla 4 cyklar upplåsta', () => {
    expect(unlockedCycles(36).map((c) => c.id)).toEqual(['std', 'red', 'purple', 'gold']);
  });

  it('activeCycle returnerar senaste upplåsta', () => {
    expect(activeCycle(0).id).toBe('std');
    expect(activeCycle(12).id).toBe('red');
    expect(activeCycle(36).id).toBe('gold');
  });

  it('nextCycle returnerar nästa låsta cykel', () => {
    expect(nextCycle(0).id).toBe('red');
    expect(nextCycle(12).id).toBe('purple');
    expect(nextCycle(24).id).toBe('gold');
    expect(nextCycle(36)).toBeNull();
  });
});
