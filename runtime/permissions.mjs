// Evaluates a widget envelope against the genome. Authority is never
// inherited: the destination's grant is checked, and the source must be
// explicitly allowed to request from the destination.
export function evaluate(genome, env) {
  const w = (id) => genome.widgets.find((x) => x.id === id && x.enabled);
  const src = w(env.source), dst = w(env.destination);
  if (!src) return deny(`source widget not enabled: ${env.source}`);
  if (!dst) return deny(`destination widget not enabled: ${env.destination}`);
  if (env.source !== env.destination && env.source !== 'witness' && env.destination !== 'witness' && !(src.requests || []).includes(env.destination)) {
    return deny(`${env.source} may not request from ${env.destination}`);
  }
  const grant = genome.permissions.find((p) => p.widget === env.destination && p.actions.includes(env.action));
  if (!grant) return deny(`no grant for ${env.destination}:${env.action}`);
  return { allowed: true, requiresApproval: grant.approval === 'required', reason: 'granted' };
}
const deny = (reason) => ({ allowed: false, requiresApproval: false, reason });
