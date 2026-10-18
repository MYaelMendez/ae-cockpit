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

## Governance Amendment A — Three-layer model and enforceable authority (proposed)

This amendment is normative for M1 design, pending human review. Declarations alone do not enforce permissions.

### A1. GENOME / PHENOTYPE / LINEAGE

- **GENOME:** untrusted declarative input describing purpose, configuration, requested capabilities, and approval preferences. No tokens, credentials, authoritative identity assertions, or self-executing grants.
- **PHENOTYPE:** deterministic generated files plus runtime bindings supplied separately by the authorized environment. Build manifest records compiler digest, pinned template commit, schema version, normalized genome digest, generated artifact digest and build environment. Non-deterministic metadata (timestamps, run IDs) belongs in the separate receipt, not in hashed reproducible output.
- **LINEAGE:** independently verified evidence connecting parent revision, genome digest, candidate artifact, test run, authenticated human decision and child revision. A local JSON file or hash alone is not immutable or proof of human approval. Use protected GitHub environments/branches, trusted OIDC identities, artifact attestations or equivalent signed receipts, and access-controlled append-only audit storage. Verify signatures, identities, scopes, timestamps and referenced digests before relying on them.

### A2. Five governance locks

1. **Proposal is not execution:** generation of local candidate files is not permission to push, publish, deploy, or access remote systems.
2. **Capability leases:** every delegated grant is scoped by principal, resource, action, environment, issue time, expiry, unique grant ID and revocation status. Deny by default. Check the current authoritative revocation state at execution time, not only a cached genome. For highly consequential actions, require a fresh interactive approval even if a lease exists.
3. **Principal outside genome:** principal authentication, credential custody and grant issuance are handled by a separate trusted authority service. The genome may contain an opaque reference but cannot forge an authenticated identity or approval.
4. **Reproducible generation:** pin dependencies and source revisions; canonicalize genome input; hash inputs and output manifest; compare two independent clean builds. A digest proves equality to a referenced artifact, not benign behavior or secure code.
5. **Independent witness:** the proposer cannot mint valid approval or verification receipts. The trusted CI verifier evaluates the exact candidate commit and publishes a verifiable signed receipt. Never execute untrusted PR code in a privileged workflow with write tokens or secrets. A receipt should distinguish tests that passed from checks not performed.

### A3. Permission levels and gates

| Level | Example | Default | Gate |
| --- | --- | --- | --- |
| L0 Explore | local preview, validation, draft proposal | Allow within local user session | No consequential external action |
| L1 Prepare | isolated code generation and tests | Only in authorized sandbox | Workspace policy; no ambient credentials/network by default |
| L2 Publish proposal | remote branch push, PR, externally visible artifacts | Deny | Explicit scoped authorization, recorded per action or tightly bounded lease |
| L3 Operate | merge, deploy, spend, sign, read sensitive data, alter permissions | Deny | Fresh human authorization, least privilege, independent enforcement and audit |

Child Studios can propose changes to parent authority policy **as untrusted text only**; no child may enact, approve, or verify that policy change. Permission-policy changes require an independent authorized human review and separate protected control path. The policy engine must not trust the candidate repository's own policy file for permission to modify itself.

### A4. Lease contract (conceptual, not a credential)

```yaml
grant_id: "unique-opaque-id"
principal_ref: "external-authenticated-subject"
subject_ref: "specific-agent-instance"
resource: "github:owner/repo"
actions: ["pr.create"]
constraints:
  branch_prefix: "feature/"
issued_at: "2026-10-18T14:32:00Z"
expires_at: "2026-10-18T15:32:00Z"
revocation_check: "online-before-action"
issuer: "trusted-authority-service"
status: "illustrative-only"
```

The authority service issues and verifies grants; editing this YAML never creates a valid lease. Clock checks must be performed server-side with bounded skew. A lease cannot be transferred to descendants.

### A5. Witness receipt verification

A witness record must bind `parent_commit`, `genome_sha256`, `compiler_digest`, `template_commit`, `candidate_commit`, `test_run_id`, `checks`, `approver_subject`, `decision`, `approval_scope`, `decision_time`, `child_commit` (if created), and `signature/attestation_ref`. Never publish tokens, private interview transcripts, or personal secrets. Publish only a redacted verification summary on Pages, with links to independently verifiable evidence when disclosure is permitted. No successful-approval claim may appear before approval is actually recorded.

### A6. Required negative and adversarial tests

- Child-generated genome requests admin, secrets, deploy or parent write permissions -> **denied**.
- Child modifies its own policy evaluator or `authority.yaml` -> no elevated privileges; independent policy enforcement remains authoritative.
- Stolen, expired, revoked, wrong-principal, wrong-repo or wrong-branch lease -> **denied** at action time.
- Prompt injection in interview, template, source comment, dependency, or tool result requests bypass -> **denied**.
- Forged local witness JSON, altered digest, spoofed CI run or approval subject -> **verification fails**.
- Untrusted PR attempts to read CI secrets or write to protected branch -> **blocked**.
- Same pinned inputs built in two clean environments -> identical generated artifacts; non-deterministic receipts excluded.
- Candidate PR changes policy, workflow permissions, dependency pins, or secrets access -> heightened review required.
- A deployed instance loses its lease -> subsequent gated actions denied; already executed external effects are not assumed reversible.
- Parent revocation does not silently mutate independent child principals; it invalidates only grants actually issued by that parent authority, according to explicit trust relationships.

### A7. Updated milestone gate

**M1 is governance-first:** incorporate this amendment; implement strict schema/validators, external authorization interface contract, lease and revocation verifier, witness verification interface, and negative tests using mocks. M1 is complete only when the isolation, forged-witness, and revocation tests pass. M2 mobile UI and M3 recursive compilation may then proceed. **Production execution** remains blocked until real credential isolation, protected CI, independently verifiable witness, revocation integration, and end-to-end tests are deployed and independently reviewed.

This amendment is a proposed design, not a claim of operational production-grade security.
