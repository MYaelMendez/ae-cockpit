import { sign, assertValid, KNOWN_WIDGETS } from './genome.mjs';

export const QUESTIONS = [
  { key: 'use_case', prompt: 'Primary use case — what will this cockpit do?', default: 'general' },
  { key: 'name', prompt: 'Cockpit name?', default: 'My æ Cockpit' },
  { key: 'principal', prompt: 'Principal (human owner) id, e.g. GitHub handle?', required: true },
  { key: 'widgets', prompt: `Widgets needed (comma separated: ${Object.keys(KNOWN_WIDGETS).join(', ')})?`, default: 'email,orchard,witness' },
  { key: 'grants', prompt: 'Permission grants as widget:action+action, comma separated (e.g. orchard:read_activity,email:draft)?', default: '' },
  { key: 'approval', prompt: 'Approval policy: every-action, consequential, or plan-level?', default: 'every-action' },
  { key: 'target', prompt: 'Publication target as owner/repo?', required: true },
  { key: 'visibility', prompt: 'Visibility: public or private?', default: 'private' }
];

const list = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);

// Pure transformation of answers into a signed genome. Consequential actions
// (send, publish, spend, sign, write) always require approval.
export function buildGenome(a, { now = new Date() } = {}) {
  const ids = list(a.widgets);
  if (!ids.includes('witness')) ids.push('witness');
  const [owner, repo] = String(a.target || '').split('/');
  const consequential = ['send', 'publish', 'spend', 'sign', 'write'];
  const permissions = list(a.grants).map((g) => {
    const [widget, acts = ''] = g.split(':');
    const actions = acts.split('+').filter(Boolean);
    return { widget, actions, approval: actions.some((x) => consequential.includes(x)) || a.approval === 'every-action' ? 'required' : 'none' };
  });
  if (!permissions.some((p) => p.widget === 'witness')) permissions.push({ widget: 'witness', actions: ['record'], approval: 'none' });
  const genome = {
    schema: 'zygotae.genome.v1',
    version: '0.3.0',
    name: a.name || 'My æ Cockpit',
    use_case: a.use_case || 'general',
    principal: { id: a.principal, name: a.principal_name || a.principal },
    widgets: ids.map((id) => ({
      id, enabled: true, capability: KNOWN_WIDGETS[id],
      requests: id === 'email' && ids.includes('orchard') ? ['orchard'] : [],
      receipts: ['plan', 'approval', 'execution']
    })),
    permissions,
    environment: { invocation: '$@ae', aliases: ['$ae', '$æ'], routing: { default: ids[0] } },
    witness: { directory: '.witness', approval_policy: a.approval || 'every-action' },
    deployment: { template: 'MYaelMendez/ae-cockpit', owner, repo, visibility: a.visibility || 'private', pages: true },
    governance: { context_may_propagate: true, authority_may_propagate: false }
  };
  return sign(assertValid(genome), a.principal, now);
}

export async function interview(ask) {
  const answers = {};
  for (const q of QUESTIONS) {
    const v = (await ask(q))?.trim();
    answers[q.key] = v || q.default;
  }
  return answers;
}
