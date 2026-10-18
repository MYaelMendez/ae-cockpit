import { readFileSync } from 'node:fs';
import { plan, approve, execute } from '../runtime/orchestrator.mjs';

const genome = JSON.parse(readFileSync(process.argv[2] || 'genomes/individual-operator.json', 'utf8'));
const p = plan(genome, 'summarize Orchard activity');
console.log('PLAN', JSON.stringify(p.decisions, null, 2));
const a = approve(genome, p, genome.principal.id);
const r = execute(genome, p, a);
console.log(JSON.stringify(r.witness.receipts, null, 2));
console.log('draft (not sent):', r.results.s2?.draft);
