#!/usr/bin/env node
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// Gen 1 dex-IDs som matchar src/data/pokemon.js (uppdatera om du ändrar listan).
const POKEMON_IDS = [
  // Skog
  1, 10, 11, 12, 13, 14, 15, 16, 17, 21, 25, 29, 32, 35, 39, 43, 44, 46, 47, 48, 69, 70, 102, 133,
  // Strand
  7, 8, 9, 54, 55, 60, 61, 72, 73, 79, 80, 86, 87, 90, 91, 98, 99, 116, 117, 118, 119, 120, 121, 129,
  // Grotta
  19, 20, 27, 28, 41, 42, 50, 51, 56, 57, 66, 67, 74, 75, 88, 89, 92, 93, 95, 100, 104, 105, 109, 110,
];

const SPRITE_URL = (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const OUT_DIR = 'assets/pokemon';

async function fetchOne(id) {
  const path = `${OUT_DIR}/${id}.png`;
  if (existsSync(path)) {
    console.log(`  ${id} → cached`);
    return;
  }
  const res = await fetch(SPRITE_URL(id));
  if (!res.ok) {
    console.error(`  ${id} → FAIL ${res.status}`);
    return;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(path, buf);
  console.log(`  ${id} → saved (${buf.length} bytes)`);
}

async function main() {
  if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true });
  console.log(`Fetching ${POKEMON_IDS.length} sprites…`);
  for (const id of POKEMON_IDS) {
    await fetchOne(id);
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
