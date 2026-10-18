import { createHash, randomUUID } from 'node:crypto';
import { createEnvelope } from './envelope.mjs';
import { evaluate } from './permissions.mjs';
import { Witness } from './witness.mjs';

// Simulated widgets: no provider connections.
export const simulated = {
  orchard: { read_activity: () => ({ items: [{ id: 'o-1', note: 'Harvested 3 listings' }, { id: 'o-2', note: 'Reinvested 1 trade' }] }) },
  email: { draft: (p) => ({ draft: `Summary: ${p.items.map((i) => i.note).join('; ')}`, sent: false }) }
};

export function plan(genome, intent, correlationId = randomUUID()) {
  if (!/summarize orchard activity/i.test(intent)) throw new Error(`unsupported intent: ${intent}`);
  const steps = [
    { id: 's1', after: [], envelope: createEnvelope({ intent, source: 'email', destination: 'orchard', action: 'read_activity', correlationId }) },
    { id: 's2', after: ['s1'], envelope: createEnvelope({ intent, source: 'email', destination: 'email', action: 'draft', correlationId }) }
  ];
  const decisions = steps.map((s) => ({ step: s.id, ...evaluate(genome, s.envelope) }));
  const p = { correlationId, intent, steps, decisions };
  p.hash = createHash('sha256').update(JSON.stringify({ correlationId, intent, steps })).digest('hex');
  return p;
}

// Principal approval binds to a specific plan hash and correlation ID.
export function approve(genome, p, principalId, now = new Date()) {
  if (principalId !== genome.principal.id) throw new Error('approver is not the genome principal');
  return { principal: principalId, correlationId: p.correlationId, planHash: p.hash, approvedAt: now.toISOString() };
}

export function execute(genome, p, approval, { witness = new Witness(), widgets = simulated } = {}) {
  const base = { correlationId: p.correlationId, intent: p.intent };
  witness.record({ ...base, status: 'proposed', plan: p.steps.map((s) => `${s.envelope.source}->${s.envelope.destination}:${s.envelope.action}`) });
  const valid = approval && approval.correlationId === p.correlationId && approval.planHash === p.hash && approval.principal === genome.principal.id;
  if (!valid) { witness.record({ ...base, status: 'failed', result: 'missing or mismatched approval' }); return { ok: false, witness }; }
  witness.record({ ...base, status: 'approved', principal: approval.principal, approvedAt: approval.approvedAt });
  const results = {};
  for (const s of p.steps) {
    if (s.after.some((d) => !(d in results))) break;
    const d = evaluate(genome, s.envelope);
    if (!d.allowed) { witness.record({ ...base, status: 'failed', step: s.id, result: d.reason }); return { ok: false, witness, results }; }
    const input = s.after.length ? results[s.after[0]] : s.envelope.payload;
    try {
      results[s.id] = widgets[s.envelope.destination][s.envelope.action](input);
    } catch (e) { witness.record({ ...base, status: 'failed', step: s.id, result: e.message }); return { ok: false, witness, results }; }
    witness.record({ ...base, status: 'executed', step: s.id, principal: approval.principal, result: Object.keys(results[s.id]) });
  }
  return { ok: true, witness, results };
}
