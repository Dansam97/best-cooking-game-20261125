// Sizzle & Serve — the hand-in program (Node 22, standard library only).
//
// The game itself is the static site in game/: an index.html and its ES
// modules, no build step, no network. This program delivers it: it copies
// game/ and screenshots/ into the output directory and writes dossier.json
// there with the kit's vendored library, so the dossier the judge reads is
// built from exactly the files handed in.
//
// In the grader the output directory is /output; anywhere else,
// MAKEFUN_OUTPUT_DIR names it instead:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's own limits, passed to the dossier builder so an entry the
// scorer would refuse (too many game files, an oversized screenshot, a path
// too long) is refused here instead of being handed in broken.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, DOSSIER_LIMITS));
