import { createHash } from 'node:crypto';

export const KNOWN_WIDGETS = {
  email: 'mail', search: 'search', github: 'repository',
  drive: 'execution', orchard: 'commerce', witness: 'evidence'
};

export function canonicalize(v) {
  if (Array.isArray(v)) return `[${v.map(canonicalize).join(',')}]`;
  if (v && typeof v === 'object') {
    return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonicalize(v[k])}`).join(',')}}`;
  }
  return JSON.stringify(v);
}

export function digest(genome) {
  const { integrity, ...body } = genome;
  return createHash('sha256').update(canonicalize(body)).digest('hex');
}

// Integrity attestation: a content digest bound to the principal. It detects
// tampering; it is not a cryptographic identity proof.
export function sign(genome, principalId = genome.principal?.id, now = new Date()) {
  const g = { ...genome };
  delete g.integrity;
  return { ...g, integrity: { algorithm: 'sha256', digest: digest(g), attested_by: principalId, attested_at: now.toISOString() } };
}

export function validate(genome) {
  const errors = [];
  const err = (m) => errors.push(m);
  if (!genome || typeof genome !== 'object') return { valid: false, errors: ['genome must be an object'] };
  if (genome.schema !== 'zygotae.genome.v1') err('schema must be zygotae.genome.v1');
  if (!/^\d+\.\d+\.\d+$/.test(genome.version || '')) err('version must be semver');
  for (const k of ['name', 'use_case']) if (!genome[k] || typeof genome[k] !== 'string') err(`${k} is required`);
  if (!genome.principal?.id) err('principal.id is required');

  const widgets = Array.isArray(genome.widgets) ? genome.widgets : (err('widgets must be an array'), []);
  const ids = new Set();
  for (const w of widgets) {
    if (!(w.id in KNOWN_WIDGETS)) err(`unknown widget: ${w.id}`);
    else if (KNOWN_WIDGETS[w.id] !== w.capability) err(`widget ${w.id} capability must be ${KNOWN_WIDGETS[w.id]}`);
    if (ids.has(w.id)) err(`duplicate widget: ${w.id}`);
    ids.add(w.id);
    if (typeof w.enabled !== 'boolean') err(`widget ${w.id} enabled must be boolean`);
  }
  const enabled = new Set(widgets.filter((w) => w.enabled).map((w) => w.id));
  if (!enabled.size) err('at least one widget must be enabled');
  for (const w of widgets) for (const r of w.requests || []) {
    if (!enabled.has(r)) err(`widget ${w.id} requests data from non-enabled widget ${r}`);
  }

  const perms = Array.isArray(genome.permissions) ? genome.permissions : (err('permissions must be an array'), []);
  for (const p of perms) {
    if (!enabled.has(p.widget)) err(`permission references non-enabled widget: ${p.widget}`);
    if (!Array.isArray(p.actions) || !p.actions.length) err(`permission for ${p.widget} needs actions`);
    if (!['none', 'required'].includes(p.approval)) err(`permission for ${p.widget} approval must be none|required`);
  }

  if (!genome.environment?.invocation) err('environment.invocation is required');
  const dflt = genome.environment?.routing?.default;
  if (!dflt) err('environment.routing.default is required');
  else if (!enabled.has(dflt)) err('environment.routing.default must be an enabled widget');

  if (!genome.witness?.directory || /^\/|\.\./.test(genome.witness.directory)) err('witness.directory must be a relative path inside the repository');
  if (!['every-action', 'consequential', 'plan-level'].includes(genome.witness?.approval_policy)) err('witness.approval_policy invalid');
  if (genome.witness?.approval_policy && enabled.size && !enabled.has('witness')) err('witness widget must be enabled');

  const d = genome.deployment || {};
  for (const k of ['template', 'owner', 'repo']) if (!d[k] || typeof d[k] !== 'string') err(`deployment.${k} is required`);
  if (!/^[A-Za-z0-9_.-]*$/.test(d.repo || '') ) err('deployment.repo has invalid characters');
  if (!['public', 'private'].includes(d.visibility)) err('deployment.visibility must be public|private');
  if (typeof d.pages !== 'boolean') err('deployment.pages must be boolean');

  if (genome.governance?.context_may_propagate !== true) err('governance.context_may_propagate must be true');
  if (genome.governance?.authority_may_propagate !== false) err('governance.authority_may_propagate must be false');

  if (genome.integrity && genome.integrity.digest !== digest(genome)) err('integrity digest mismatch');
  return { valid: errors.length === 0, errors };
}

export function assertValid(genome) {
  const r = validate(genome);
  if (!r.valid) throw new Error(`Invalid genome:\n- ${r.errors.join('\n- ')}`);
  return genome;
}
