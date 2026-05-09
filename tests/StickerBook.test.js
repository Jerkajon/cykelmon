import { describe, it, expect, beforeEach } from 'vitest';
import { StickerBook } from '../src/systems/StickerBook.js';
import { createStorage, memoryBackend } from '../src/utils/storage.js';

const STORAGE_KEY = 'pokemoncykelspel.stickers';

describe('StickerBook', () => {
  let storage;
  let book;

  beforeEach(() => {
    storage = createStorage(memoryBackend());
    book = new StickerBook({ storage, key: STORAGE_KEY });
  });

  it('är tom från början', () => {
    expect(book.isSeen(25)).toBe(false);
    expect(book.isShinySeen(25)).toBe(false);
    expect(book.getSeenIds()).toEqual([]);
  });

  it('markerar Pokémon som sedd', () => {
    book.markSeen({ id: 25, shiny: false });
    expect(book.isSeen(25)).toBe(true);
    expect(book.isShinySeen(25)).toBe(false);
  });

  it('markerar shiny separat utan att glömma normal', () => {
    book.markSeen({ id: 25, shiny: false });
    book.markSeen({ id: 25, shiny: true });
    expect(book.isSeen(25)).toBe(true);
    expect(book.isShinySeen(25)).toBe(true);
  });

  it('persisterar till storage', () => {
    book.markSeen({ id: 1, shiny: false });
    const reloaded = new StickerBook({ storage, key: STORAGE_KEY });
    expect(reloaded.isSeen(1)).toBe(true);
  });

  it('returnerar lista över sedda IDs', () => {
    book.markSeen({ id: 25, shiny: false });
    book.markSeen({ id: 1, shiny: true });
    expect(book.getSeenIds().sort((a, b) => a - b)).toEqual([1, 25]);
  });

  it('returnerar lista över shiny IDs', () => {
    book.markSeen({ id: 25, shiny: false });
    book.markSeen({ id: 1, shiny: true });
    expect(book.getShinyIds()).toEqual([1]);
  });

  it('hanterar korrupt JSON i storage gracefully', () => {
    const backend = memoryBackend();
    backend.setItem(STORAGE_KEY, '{not valid json');
    const s = createStorage(backend);
    const fresh = new StickerBook({ storage: s, key: STORAGE_KEY });
    expect(fresh.isSeen(25)).toBe(false);
    fresh.markSeen({ id: 25, shiny: false });
    expect(fresh.isSeen(25)).toBe(true);
  });

  it('migrerar gammal schema-version (v0 → v1) tyst', () => {
    const backend = memoryBackend();
    backend.setItem(STORAGE_KEY, JSON.stringify({ pokemon: { 25: { seen: true } } })); // ingen version
    const s = createStorage(backend);
    const fresh = new StickerBook({ storage: s, key: STORAGE_KEY });
    expect(fresh.isSeen(25)).toBe(true);
  });

  it('clearAll nollar boken', () => {
    book.markSeen({ id: 25, shiny: false });
    book.clearAll();
    expect(book.isSeen(25)).toBe(false);
  });
});
