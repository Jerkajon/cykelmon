import { describe, it, expect, beforeEach } from 'vitest';
import {
  createStorage,
  memoryBackend,
  getLevelStars,
  setLevelStars,
  getTotalStars,
  getUnlockedBikes,
  unlockBike,
} from '../src/utils/storage.js';

describe('storage helpers — level-stars', () => {
  let storage;

  beforeEach(() => {
    storage = createStorage(memoryBackend());
  });

  it('getLevelStars returnerar 0 för okänd nivå', () => {
    expect(getLevelStars(storage, '1-1')).toBe(0);
  });

  it('setLevelStars persisterar och returneras av getLevelStars', () => {
    setLevelStars(storage, '1-1', 2);
    expect(getLevelStars(storage, '1-1')).toBe(2);
  });

  it('setLevelStars sänker inte från högre stjärn-värde', () => {
    setLevelStars(storage, '1-1', 3);
    setLevelStars(storage, '1-1', 1);
    expect(getLevelStars(storage, '1-1')).toBe(3);
  });

  it('totalStars summerar över alla nivåer', () => {
    setLevelStars(storage, '1-1', 2);
    setLevelStars(storage, '1-2', 3);
    expect(getTotalStars(storage)).toBe(5);
  });

  it('getUnlockedBikes returnerar standard som default', () => {
    expect(getUnlockedBikes(storage)).toEqual(['standard']);
  });

  it('unlockBike lägger till ny cykel utan duplicering', () => {
    unlockBike(storage, 'redRacer');
    unlockBike(storage, 'redRacer');
    expect(getUnlockedBikes(storage)).toEqual(['standard', 'redRacer']);
  });
});
