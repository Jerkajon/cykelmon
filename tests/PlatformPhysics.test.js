import { describe, it, expect } from 'vitest';
import { PlatformPhysics } from '../src/systems/PlatformPhysics.js';

const SAMPLE_LEVEL = {
  platforms: [
    { x: 700, y: 420, width: 256 },
    { x: 1700, y: 380, width: 256 },
  ],
  pits: [
    { xStart: 1200, xEnd: 1500 },
  ],
  obstacles: [
    { x: 1100, y: 'ground', type: 'rock' },
  ],
};

describe('PlatformPhysics', () => {
  describe('shouldAutoVault', () => {
    it('triggar auto-vault när cyklist är ~80px från obstacle på marken', () => {
      const p = new PlatformPhysics(SAMPLE_LEVEL);
      // cyklist på x=1020, hinder på x=1100 → distance=80
      expect(p.shouldAutoVault(1020, 'ground')).toBe(true);
    });

    it('triggar inte auto-vault om för långt bort', () => {
      const p = new PlatformPhysics(SAMPLE_LEVEL);
      expect(p.shouldAutoVault(900, 'ground')).toBe(false);
    });

    it('triggar inte auto-vault om cyklist redan är förbi hindret', () => {
      const p = new PlatformPhysics(SAMPLE_LEVEL);
      expect(p.shouldAutoVault(1150, 'ground')).toBe(false);
    });

    it('triggar inte auto-vault om cyklist är på en plattform', () => {
      const p = new PlatformPhysics(SAMPLE_LEVEL);
      // Hinder på marken är inte i vägen om cyklist är på plattform
      expect(p.shouldAutoVault(1020, 420)).toBe(false);
    });
  });

  describe('isOverPit', () => {
    it('true när x är inom pit', () => {
      const p = new PlatformPhysics(SAMPLE_LEVEL);
      expect(p.isOverPit(1300)).toBe(true);
    });

    it('false när x är utanför pit', () => {
      const p = new PlatformPhysics(SAMPLE_LEVEL);
      expect(p.isOverPit(1100)).toBe(false);
      expect(p.isOverPit(1600)).toBe(false);
    });
  });

  describe('platformAt', () => {
    it('returnerar plattform när cyklist är över den', () => {
      const p = new PlatformPhysics(SAMPLE_LEVEL);
      const plat = p.platformAt(800);
      expect(plat).not.toBeNull();
      expect(plat.x).toBe(700);
    });

    it('returnerar null när cyklist inte är över någon plattform', () => {
      const p = new PlatformPhysics(SAMPLE_LEVEL);
      expect(p.platformAt(500)).toBeNull();
    });

    it('hanterar plattform-bredd korrekt (x within [start, start+width])', () => {
      const p = new PlatformPhysics(SAMPLE_LEVEL);
      expect(p.platformAt(956)).not.toBeNull(); // 700+256=956 inclusive
      expect(p.platformAt(957)).toBeNull();
    });
  });

  describe('lastSafePlatformBefore', () => {
    it('returnerar närmaste plattform till vänster om x', () => {
      const p = new PlatformPhysics(SAMPLE_LEVEL);
      const last = p.lastSafePlatformBefore(1300);
      expect(last.x).toBe(700);
    });

    it('returnerar null om ingen plattform finns före x', () => {
      const p = new PlatformPhysics(SAMPLE_LEVEL);
      expect(p.lastSafePlatformBefore(500)).toBeNull();
    });
  });
});
