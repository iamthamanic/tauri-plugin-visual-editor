import * as esbuild from 'esbuild';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const outFile = join(root, '../../crates/plugin/guest/guest-runtime.iife.js');

mkdirSync(dirname(outFile), { recursive: true });

await esbuild.build({
  entryPoints: [join(root, 'src/guest-runtime.ts')],
  bundle: true,
  format: 'iife',
  outfile: outFile,
  platform: 'browser',
  target: 'es2022',
  logLevel: 'info',
});

console.log(`bundled guest runtime -> ${outFile}`);
