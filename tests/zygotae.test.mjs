import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validate, sign } from '../genome/genome.mjs';
import { buildGenome } from '../genome/onboarding.mjs';
import { exportTemplate } from '../tools/export.mjs';
import { evaluate } from '../runtime/permissions.mjs';
import { plan, approve, execute } from '../runtime/orchestrator.mjs';

const load = (f) => JSON.parse(readFileSync(new URL(`../genomes/${f}`, import.meta.url), 'utf8'));
const op = () => load('individual-operator.json');

test('example genomes are valid', () => {
  for (const f of readdirSync(new URL('../genomes', import.meta.url))) assert.deepEqual(validate(load(f)).errors, []);
});

test('tampering and authority propagation are rejected', () => {
  const g = op(); g.name = 'x';
  assert.ok(validate(g).errors.some((e) => /digest/.test(e)));
  const h = sign({ ...op(), governance: { context_may_propagate: true, authority_may_propagate: true } });
  assert.ok(validate(h).errors.some((e) => /authority_may_propagate/.test(e)));
});

test('onboarding produces a valid signed genome and exports a template without witness history', () => {
  const g = buildGenome({ principal: 'me', target: 'me/cockpit', widgets: 'email,orchard', grants: 'orchard:read_activity,email:draft+send' });
  assert.equal(validate(g).valid, true);
  assert.equal(g.permissions.find((p) => p.widget === 'email').approval, 'required');
  const out = exportTemplate(g, mkdtempSync(join(tmpdir(), 'cp-')));
  assert.ok(existsSync(join(out, 'genome.json')) && existsSync(join(out, '.witness/.gitkeep')));
  assert.equal(readdirSync(join(out, '.witness')).length, 1);
});

test('permission evaluator denies ungranted and unrelated cross-widget calls', () => {
  const g = op();
  const env = (source, destination, action) => ({ source, destination, action });
  assert.equal(evaluate(g, env('email', 'orchard', 'read_activity')).allowed, true);
  assert.equal(evaluate(g, env('email', 'orchard', 'delete')).allowed, false);
  assert.equal(evaluate(g, env('orchard', 'email', 'draft')).allowed, false);
  assert.equal(evaluate(g, env('email', 'github', 'read')).allowed, false);
});

test('orchestration: approved plan executes, drafts, never sends, and records receipts', () => {
  const g = op(); const p = plan(g, 'summarize Orchard activity');
  const r = execute(g, p, approve(g, p, g.principal.id));
  assert.equal(r.ok, true);
  assert.equal(r.results.s2.sent, false);
  assert.deepEqual(r.witness.receipts.map((x) => x.status), ['proposed', 'approved', 'executed', 'executed']);
  assert.equal(r.witness.verify(), true);
});

test('execution fails without matching principal approval', () => {
  const g = op(); const p = plan(g, 'summarize Orchard activity');
  assert.throws(() => approve(g, p, 'intruder'));
  const other = plan(g, 'summarize Orchard activity');
  const r = execute(g, p, approve(g, other, g.principal.id));
  assert.equal(r.ok, false);
  assert.equal(r.witness.receipts.at(-1).status, 'failed');
});
