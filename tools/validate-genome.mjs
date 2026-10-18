import { readFileSync } from 'node:fs';
import { validate } from '../genome/genome.mjs';

const files = process.argv.slice(2);
if (!files.length) { console.error('usage: validate-genome.mjs <genome.json>...'); process.exit(2); }
let bad = 0;
for (const f of files) {
  const r = validate(JSON.parse(readFileSync(f, 'utf8')));
  console.log(`${r.valid ? 'OK  ' : 'FAIL'} ${f}`);
  r.errors.forEach((e) => console.log(`  - ${e}`));
  if (!r.valid) bad++;
}
process.exit(bad ? 1 : 0);
