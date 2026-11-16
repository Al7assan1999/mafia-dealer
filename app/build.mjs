// Builds app/assets/app.js: the files listed in tsconfig.json, in that order, types stripped, joined into one
// classic script. They share one global scope (no import/export), exactly like the old single <script>,
// so the "files" order in tsconfig.json matters for code that runs at load time (a const must come before
// top-level code that uses it).
import { readFileSync, writeFileSync } from 'node:fs';
import { transformSync } from 'esbuild';

const dir = new URL('.', import.meta.url);
const files = JSON.parse(readFileSync(new URL('tsconfig.json', dir), 'utf8')).files.filter(f => !f.endsWith('.d.ts'));
const out = files.map(f => `// ---- ${f}\n` + transformSync(readFileSync(new URL(f, dir), 'utf8'), { loader: 'ts', sourcefile: f }).code).join('\n');
writeFileSync(new URL('assets/app.js', dir), out);
console.log(`app/assets/app.js: ${files.length} files, ${Math.round(out.length / 1024)} KB`);
