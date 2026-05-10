export function createStorage(backend = globalThis.localStorage) {
  return {
    get(key) {
      try {
        const raw = backend.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        backend.setItem(key, JSON.stringify(value));
      } catch {
        // Tyst fail (privacy mode etc.) — spelet är fortfarande spelbart.
      }
    },
    clear(key) {
      try {
        backend.removeItem(key);
      } catch {
        // Tyst fail.
      }
    },
  };
}

export function memoryBackend() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
}

const LEVELS_KEY = 'pokemoncykelspel.levels';
const TOTAL_STARS_KEY = 'pokemoncykelspel.totalStars';
const UNLOCKED_BIKES_KEY = 'pokemoncykelspel.unlockedBikes';

export function getLevelStars(storage, levelId) {
  const all = storage.get(LEVELS_KEY) || {};
  return all[levelId]?.stars ?? 0;
}

export function setLevelStars(storage, levelId, stars) {
  const all = storage.get(LEVELS_KEY) || {};
  const prev = all[levelId] || { stars: 0, completed: false, shinySeen: false };
  all[levelId] = {
    ...prev,
    stars: Math.max(prev.stars, stars), // never decrease
    completed: stars > 0 || prev.completed,
  };
  storage.set(LEVELS_KEY, all);

  // Update totalStars (sum of best stars per level)
  const total = Object.values(all).reduce((sum, l) => sum + (l.stars || 0), 0);
  storage.set(TOTAL_STARS_KEY, total);
}

export function getAllLevelStars(storage) {
  return storage.get(LEVELS_KEY) || {};
}

export function getTotalStars(storage) {
  return storage.get(TOTAL_STARS_KEY) || 0;
}

export function getUnlockedBikes(storage) {
  return storage.get(UNLOCKED_BIKES_KEY) || ['standard'];
}

export function unlockBike(storage, bikeId) {
  const bikes = getUnlockedBikes(storage);
  if (!bikes.includes(bikeId)) {
    bikes.push(bikeId);
    storage.set(UNLOCKED_BIKES_KEY, bikes);
  }
}
