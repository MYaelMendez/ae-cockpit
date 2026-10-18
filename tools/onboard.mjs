import { createInterface } from 'node:readline/promises';
import { readFileSync, writeFileSync } from 'node:fs';
import { interview, buildGenome } from '../genome/onboarding.mjs';
import { exportTemplate } from './export.mjs';

// usage: node tools/onboard.mjs [--answers answers.json] [--out genome.json] [--export dir]
const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined; };
let answers;
if (arg('--answers')) answers = JSON.parse(readFileSync(arg('--answers'), 'utf8'));
else {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  answers = await interview(async (q) => rl.question(`${q.prompt}${q.default ? ` [${q.default}]` : ''} `));
  rl.close();
}
const genome = buildGenome(answers);
const out = arg('--out') || 'genome.json';
writeFileSync(out, JSON.stringify(genome, null, 2) + '\n');
console.log(`Signed genome written to ${out}`);
if (arg('--export')) console.log(`Template exported to ${exportTemplate(genome, arg('--export'))}`);
