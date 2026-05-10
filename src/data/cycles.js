// Trösklar = totala stjärnor över alla nivåer. 12 nivåer × 3 stjärnor = 36 max.
export const CYCLES = [
  { id: 'std',      name: 'Standard',      threshold: 0,  tint: 0xffffff, glow: 0 },
  { id: 'red',      name: 'Röd Racer',     threshold: 12, tint: 0xff5555, glow: 0 },
  { id: 'purple',   name: 'Lila Sväv',     threshold: 24, tint: 0xa855f7, glow: 0 },
  { id: 'gold',     name: 'Guld-cykel',    threshold: 36, tint: 0xfde047, glow: 1 },
];

export function unlockedCycles(totalStars) {
  return CYCLES.filter((c) => totalStars >= c.threshold);
}

export function activeCycle(totalStars) {
  const list = unlockedCycles(totalStars);
  return list[list.length - 1];
}

export function nextCycle(totalStars) {
  return CYCLES.find((c) => totalStars < c.threshold) || null;
}
