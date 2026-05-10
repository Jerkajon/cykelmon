export const CYCLES = [
  { id: 'std',      name: 'Standard',      threshold: 0,  tint: 0xffffff, glow: 0 },
  { id: 'red',      name: 'Röd Racer',     threshold: 10, tint: 0xff5555, glow: 0 },
  { id: 'purple',   name: 'Lila Sväv',     threshold: 30, tint: 0xa855f7, glow: 0 },
  { id: 'gold',     name: 'Guld-cykel',    threshold: 60, tint: 0xfde047, glow: 1 },
];

export function unlockedCycles(lifetimeCount) {
  return CYCLES.filter((c) => lifetimeCount >= c.threshold);
}

export function activeCycle(lifetimeCount) {
  const list = unlockedCycles(lifetimeCount);
  return list[list.length - 1];
}

export function nextCycle(lifetimeCount) {
  return CYCLES.find((c) => lifetimeCount < c.threshold) || null;
}
