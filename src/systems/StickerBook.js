const CURRENT_VERSION = 1;

function emptyState() {
  return { version: CURRENT_VERSION, pokemon: {} };
}

function migrate(raw) {
  if (!raw || typeof raw !== 'object') return emptyState();
  if (!raw.pokemon || typeof raw.pokemon !== 'object') return emptyState();

  // v0: { pokemon: { id: { seen: bool, shiny?: bool } } } utan version-fält
  // v1: samma shape men med version-fält
  return {
    version: CURRENT_VERSION,
    pokemon: raw.pokemon,
  };
}

export class StickerBook {
  constructor({ storage, key }) {
    this.storage = storage;
    this.key = key;
    this.state = migrate(storage.get(key));
  }

  markSeen({ id, shiny }) {
    const existing = this.state.pokemon[id] || { seen: false, shiny: false, firstSeenAt: null };
    const next = {
      seen: true,
      shiny: existing.shiny || !!shiny,
      firstSeenAt: existing.firstSeenAt || Date.now(),
    };
    this.state.pokemon[id] = next;
    this.persist();
  }

  isSeen(id) {
    return !!(this.state.pokemon[id] && this.state.pokemon[id].seen);
  }

  isShinySeen(id) {
    return !!(this.state.pokemon[id] && this.state.pokemon[id].shiny);
  }

  getSeenIds() {
    return Object.keys(this.state.pokemon)
      .filter((id) => this.state.pokemon[id].seen)
      .map((id) => Number(id));
  }

  getShinyIds() {
    return Object.keys(this.state.pokemon)
      .filter((id) => this.state.pokemon[id].shiny)
      .map((id) => Number(id));
  }

  clearAll() {
    this.state = emptyState();
    this.storage.clear(this.key);
  }

  persist() {
    this.storage.set(this.key, this.state);
  }
}
