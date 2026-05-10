#!/usr/bin/env node
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// Alla Gen 1 dex-IDs (1-151) som matchar src/data/pokemon.js.
const POKEMON_IDS = Array.from({ length: 151 }, (_, i) => i + 1);

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
