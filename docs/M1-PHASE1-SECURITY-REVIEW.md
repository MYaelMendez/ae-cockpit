# M1 Phase 1 Security Review — Workstream A (initial technical review)

**Review target:** PR #2, head `34359c70ed5efaa144f869770e62502864a1b6e5`; GitHub Actions run [39086914059](https://github.com/MYaelMendez/ae-cockpit/actions/runs/39086914059), job `117555287555` on synthetic merge commit `71b279e07c304a5edc5927f9a661e9bd75820169`. **14/14 unit tests passed**, as confirmed from actual job logs (Python 3.12.15; 2026-10-18 01:33 UTC). This is a code-level review, **not an independent security audit**, and tests did not establish production isolation. No PR review approvals recorded.

## Findings — merge-blocking for production

| ID | Severity | Code / evidence | Finding | Required remediation |
| --- | --- | --- | --- | --- |
| F01 | Critical if used as enforcement | `packages/governance/reference.py:verify_lease` | Revocation and `used_nonces` come from caller; verification neither consumes nonce nor performs an authoritative atomic check. Same valid lease can authorize unlimited operations when caller passes fresh/empty sets. | External authenticated policy/lease service, transactional consume/check, actor-bound authorization, test replay/race. |
| F02 | High | `verify_witness` | Signed witness checks no nonce uniqueness, time freshness, expected candidate commit, approver identity from trusted auth, CI run provenance or trusted check results. Correctly signed stale/unrelated receipt can be accepted when action/resource/artifact match. | Verify exact expected commit, approval event and check runs; independently authenticated signers; nonce/timestamp enforcement. |
| F03 | High | HMAC `trusted_issuers` / `trusted_signers` passed to reference functions | Shared-secret HMAC verifies signatures mathematically, but cannot establish external trust if child can influence key map or possesses signing key. Test key is intentionally public. | External asymmetric signer/verifier, pinned verification keys, issuer trust policy, secure key custody. |
| F04 | High | `packages/genome/schema.json`, `tests/test_m1.py:test_schema_structure` | JSON Schema is never applied to a genome; current test inspects schema text only. Invalid genomes are not rejected by a validator entrypoint. | Add actual Draft 2020-12 validation and malicious fixtures; treat all input as untrusted. |
| F05 | High | `.github/workflows/m1-security-gates.yml` | CI checks 14 unit tests; no integration/privilege-boundary, secret scan, policy tamper, workflow permission, dependency or real service tests. Branch/ruleset protections not verified. | Explicit independent review and protected required checks; isolated integration/security suites, secret scanning, workflow threat model. |
| F06 | Medium | `verify_lease` | Branch scope via `startswith` is coarse; signed string values and data types are not validated independently. Caller supplies trusted `now`; no server-side source enforced. | Typed lease schema, bound resource/action/environment/branch ref, server clock and authenticated caller. |
| F07 | Medium | `canonical` | Sorted `json.dumps` is internally deterministic for examples but not interoperable RFC 8785 canonical JSON; no real deterministic compiler/build. | Specify canonical encoding/version and independent clean-build equality tests. |
| F08 | Medium | `tests/test_m1.py` | Witness only has one happy-path + modified artifact check; no forged signer, replay, wrong approver, wrong commit, mismatched test run, stale decision, or wrong principal tests. | Add adversarial fixtures asserting deny and trace to exact check/identity. |

## Trust boundary

Adversarial child controls genome, proposed source changes, local config, and potentially its process environment. **Must not control** trusted principal session, signing key custody, live revocation/nonce DB, approval store, deployment credentials or enforcement code/process. GitHub CI job success proves these particular unit tests ran successfully; it does not certify auth separation, branch protection, or the human approval chain. In particular, calling `verify_lease` inside a child and letting that child choose the supplied key/revocation sets is not secure.

## Test-to-claim audit

**Actually demonstrated (within supplied test fixtures):** canonical sorted key serialization, HMAC integrity for a modified signed lease, rejection of expired/revoked/replayed fixtures *when corresponding sets/time are provided*, wrong principal/subject/resource/branch, untrusted issuer, unexpected field, and modified signed witness artifact. **Not demonstrated:** token theft, concurrent nonce consumption, real revocation service, principal authentication, provenance of signer or approver, repeatable signed audit evidence, active JSON Schema enforcement, prompt-injection resistance, CI secret access isolation, protected branches, deterministic genome compiler.

## Workstream B — phase 2 design contract (not implemented)

- `POST /v1/authorizations/prepare`: authenticated principal+agent context, exact proposed action/resource/ref/content digest, idempotency key. Returns a short-lived **opaque decision handle**, never signing keys.
- `POST /v1/authorizations/consume`: trusted executor mutually authenticates, verifies live grant/revocation/policy and atomically transitions decision to consumed **for that exact operation** with unique nonce; denies expired/revoked/mismatched/replayed decisions.
- **External side effect:** executor uses provider-side idempotency/conditional commits where available. Record `planned -> authorized -> attempted -> committed/failed/unknown` separately; `unknown` requires reconciliation, never blind retry.
- **Revocation limitation:** cannot undo a completed side effect. Handle revocation before dispatch and explicitly reconcile races and post-dispatch revocation.
- **Witness:** trusted CI/signature attestation binds exact genome/parent/template/compiler/artifact/candidate hashes, CI run and policy, authenticated approver, approval scope, action, nonce and time; independent verifier uses pinned trusted identities and audit log.
- **Transport and identity:** operator sessions/OIDC for principal, mTLS or equivalent workload identity for executor, external KMS-backed signing key; child has no ambient authority or signing key.
- **Fail closed:** timeout, unavailable revocation store, stale decision, unknown execution status => no new action without reconciliation.

## Decision

**Phase 1 reference logic is suitable for learning/testing, not enforcement.** Continue Phase 2 **design** subject to remediation planning, but do **not merge for production**, deploy, or claim M1 complete. Independent security review and full runtime testing remain outstanding.

One clarification: the RFC lists **ten** A6 adversarial scenarios; the current test suite has 14 tests, but these are not equivalent to those ten end-to-end scenarios.