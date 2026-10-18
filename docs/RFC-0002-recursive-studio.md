# RFC-0002: Recursive æ Studio · Agentic Environments

Status: Proposed. Branch: design/recursive-studio-v1. Scope: Studio itself, not only generated child environments.

## Thesis

æ Studio must be able to generate a versioned, forkable Studio instance and propose improvements to its own source through a governed, inspectable development cycle. **Context may propagate; authority does not.** Self-improvement means proposals and human-reviewed commits, never silent self-modification.

## Genesis and recursive lifecycle

```text
HUMAN://ROOT
  -> $æ 🦩Z (interview)
  -> GENOME (editable, versioned, validated)
  -> TEMPLATE (ae-cockpit, including studio profile)
  -> CANDIDATE (isolated branch/repository)
  -> EVALUATE (schema, unit, integration, accessibility, security)
  -> WITNESS (diff, tests, lineage, approvals)
  -> HUMAN REVIEW
  -> PR -> HUMAN MERGE/DEPLOY
  -> STUDIO' (new version, can initiate next proposal)
```

### New Studio-specific capabilities

- **Studio-as-template:** a self-contained `studio` profile can regenerate an æ Studio from a committed template and locked version.
- **Recursive diff planner:** takes a human task, base commit SHA, constraints, and capability inventory; emits *proposed* changed files, tests, and migration notes.
- **Genome compiler:** deterministic `genome.yaml` + JSON Schema -> validated and previewable repository tree. Refuse invalid genomes.
- **Capability registry:** discovery metadata separated from actual credential binding and runtime execution.
- **Witness receipts:** append-only logical events recording source revision, inputs hashes, tool invocation identifiers, proposed diff, checks, human decision, and child lineage; redact secrets.
- **Constrained evaluator:** propose -> isolated branch -> tests -> PR; never approve its own privilege increase.
- **Mobile control plane:** 9:16 design canvas, responsive HTML for accessible onboarding, reduced-motion static fallback, keyboard use, localization.

## Architecture

```text
packages/
  genome/            schema, migrations, validators
  compiler/          templates, deterministic output, diff
  registry/          capability declarations, binding states
  runtime/           phased task plan, permission evaluation
  witness/           lineage, decision receipts
  studio-recursion/  inspect, propose, isolate, evaluate, request review
profiles/
  studio.genome.yaml
  startabusiness.genome.yaml
templates/
  cockpit/
  studio/
cockpit/
  genesis/           interview state machine, autosave/export (opt-in)
protocols/
  authority.schema.json
  receipt.schema.json
tests/
  fixtures/
  security/
docs/
  RFC-0002-recursive-studio.md
```

These paths are *planned*, not assertions about existing files.

## Minimum genome schema

Required: `schema_version`, `principal`, `purpose`, `identity`, `brand`, `capabilities`, `authority`, `template`, `lineage`. Explicitly distinguish `requested_capabilities` from `authorized_bindings` (empty by default). `principal` identifies who may approve; merely writing their name into YAML does not authenticate them.

```yaml
schema_version: "zygotae.genesis.v1"
invocation: "$æ 🦩Z"
principal:
  kind: human
  authentication: required_for_consequential_actions
purpose: "Build and improve human-controlled agentic environments"
identity:
  name: "æ Studio"
brand:
  theme: gold-dark
  viewport: responsive-mobile-first
template:
  source: "MYaelMendez/ae-cockpit"
  profile: studio
  version: pinned-commit-required-before-generation
capabilities:
  requested: [genome.validate, template.generate, diff.propose, checks.run, github.pr.request]
  authorized_bindings: []
authority:
  approval_required: [repo.create, branch.push, pr.create, merge, deploy, publish, spend, secrets.read, permission.change]
  context_may_propagate: true
  authority_may_propagate: false
lineage:
  parent_revision: null
  child_revision: null
  witness_receipt: null
```

## Permission gates

| Operation | Default | Human gate |
| --- | --- | --- |
| Preview genome locally | Allowed | No |
| Validate/export genome locally | Allowed | No |
| Propose patch | Allowed in authorized workspace | No |
| Execute sandbox tests | Only isolated and explicitly enabled | Configure workspace |
| Clone or read private code | Denied without scoped auth | Yes |
| Push branch/create PR | Denied until explicit per-action authorization | Yes |
| Merge/deploy/publish | Denied | Yes |
| Spend/sign/transfer/rotate secrets | Denied | Yes |
| Alter authority policy | Denied | Independent human approval |

No hidden inheritance of credentials, principal identity, tokens, payment privileges, or tool permissions.

## Acceptance tests

1. Interview completes, skips, edits, and exports without forcing a public upload.
2. Schema validation rejects unknown privileged fields and invalid grants.
3. Same pinned template + genome generates identical file contents.
4. The Studio profile generates a child with working onboarding and no inherited credentials.
5. Child can propose but cannot silently merge/deploy, grant itself permissions, or access parent secrets.
6. Every candidate PR links parent revision, schema version, diff, check results, and approval receipt.
7. Accessibility: focus, screen-reader labels, reduced motion, no canvas-only controls.
8. Security: prompt-injection attempt in profile text cannot change execution permissions.
9. Migration tests preserve meaning across genome schema versions.
10. Rollback reconstructs prior pinned revision after an approved deployment.

## Milestones

M0: Approve RFC and audit existing paths.
M1: Implement genome schema, migration, validator and tests.
M2: Implement 9:16 responsive Genesis UI, export/import, human review.
M3: Deterministic compiler and Studio profile; verify recursive generation.
M4: Runtime permission gates, witness lineage, isolated tests.
M5: GitHub authorization and PR-only development workflow.
M6: Threat model, accessibility, documentation and opt-in rollout.

## Delivery constraints

The current æ Studio plugin bridge only prepares drafts; it does not read code, execute builds, deploy, or submit to a plugin directory. This RFC is an implementation specification, not evidence that the runtime has been built.

**One cockpit. Many pilots. One human principal.**
