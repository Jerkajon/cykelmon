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
