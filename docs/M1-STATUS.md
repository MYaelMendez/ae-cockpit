# M1 status: reference implementation, not production enforcement

This feature branch is a **security reference prototype** only. It is not a trusted external authority service, and the tests have not been verified by independent CI yet.

Implemented:
- Strict genome JSON Schema Draft 2020-12 (requires a JSON Schema validator for full validation).
- Deterministic canonical JSON helper (not RFC 8785/JCS).
- HMAC-signed sample lease verifier with expiry, resource, principal, action, branch and revocation inputs.
- HMAC-signed sample witness verifier with exact action/resource/artifact binding.
- Unit tests and read-only GitHub Actions workflow.

**Known blockers before M1 completion**:
1. Deploy independent external authorization and revocation service with atomic nonce consumption; current verifier accepts caller-provided sets and is vulnerable if caller controls them or races.
2. Replace symmetric HMAC examples with externally issued asymmetric signatures and a pinned trust store; trusted signer keys cannot be accessible to children.
3. Implement actual genome validation using JSON Schema library, migration logic, negative fixtures and integration tests.
4. Bind witness to authenticated approval event, trusted CI identity, exact candidate commit, trusted artifact digest, and external immutable log.
5. Harden CI for untrusted PRs, branch protections and security review. Workflow contents can be proposed in PRs; protection must be configured in GitHub settings.
6. Implement cross-request authorization checks, revoke-during-action semantics, independent build reproducibility, injection testing, and secret scanning.
7. Confirm independent security review and signed/attested evidence.

No claim of complete M1 or production-grade enforcement is made. Do not merge without human review.
