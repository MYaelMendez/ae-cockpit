import { mkdirSync, writeFileSync, cpSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertValid } from '../genome/genome.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const COPY = ['index.html', 'cockpit', 'shaders', 'registry', 'protocols', 'runtime', 'genome', 'tools', 'tests', 'genomes', 'docs', 'LICENSE', '.github'];

// Writes a deployable cockpit template. Context (widgets, registry, runtime)
// is copied; authority (approvals, witness records) starts empty.
export function exportTemplate(genome, outDir) {
  assertValid(genome);
  if (!genome.integrity) throw new Error('genome must be signed before export');
  mkdirSync(outDir, { recursive: true });
  for (const p of COPY) if (existsSync(join(root, p))) cpSync(join(root, p), join(outDir, p), { recursive: true });
  const w = (f, c) => { mkdirSync(dirname(join(outDir, f)), { recursive: true }); writeFileSync(join(outDir, f), c); };
  w('genome.json', JSON.stringify(genome, null, 2) + '\n');
  w('.ae/environment.json', JSON.stringify({
    schema_version: '0.3.0', name: genome.name, principal: genome.principal.id, status: 'prototype',
    invocation: genome.environment.invocation, widget_registry: 'registry/widgets.json', genome: 'genome.json',
    authority: 'explicit-human-approval', approval_policy: genome.witness.approval_policy,
    permissions: genome.permissions, enabled_widgets: genome.widgets.filter((x) => x.enabled).map((x) => x.id),
    connected_providers: [], notes: 'Generated from genome. Public profile does not convey credentials or authorization.'
  }, null, 2) + '\n');
  w('.witness/.gitkeep', '');
  w('README.md', `# ${genome.name}\n\n${genome.use_case}\n\nPrincipal: \`${genome.principal.id}\`\nGenerated from ZYGOTÆ genome \`genome.json\` (sha256 \`${genome.integrity.digest}\`).\n\n## Deploy\n\n1. Create \`${genome.deployment.owner}/${genome.deployment.repo}\` (${genome.deployment.visibility}) and push these files to \`main\`.\n2. Settings → Pages → Source: **GitHub Actions**.\n3. The workflow validates \`genome.json\` before publishing.\n\nThis cockpit does not inherit the template's approvals or witness records.\n`);
  return outDir;
}
