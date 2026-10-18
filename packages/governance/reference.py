"""M1 reference verifiers. NOT a production authority server or trusted witness issuer.
External trusted callers must supply authenticated principal, trusted keys and live revocation.
"""
from __future__ import annotations
from datetime import datetime, timezone
from hashlib import sha256
import hmac
import json

class Denied(Exception):
    pass

def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False).encode("utf-8")

def digest(value):
    return sha256(canonical(value)).hexdigest()

def parse_utc(value):
    if not isinstance(value, str) or not value.endswith("Z"):
        raise Denied("invalid UTC time")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise Denied("invalid UTC time") from exc
    return parsed.astimezone(timezone.utc)

def verify_lease(lease, *, principal, subject, resource, action, branch, now, trusted_issuers, revoked, used_nonces):
    """Pure verifier; revocation/nonce stores must be checked atomically by trusted caller."""
    if not isinstance(lease, dict):
        raise Denied("invalid lease")
    required = {"grant_id", "principal_ref", "subject_ref", "resource", "actions", "branch_prefix",
                "issued_at", "expires_at", "nonce", "issuer", "signature"}
    if set(lease) != required:
        raise Denied("unknown or missing lease fields")
    issuer = lease["issuer"]
    key = trusted_issuers.get(issuer)
    if not isinstance(key, bytes):
        raise Denied("untrusted issuer")
    unsigned = {k: v for k, v in lease.items() if k != "signature"}
    expected = hmac.new(key, canonical(unsigned), sha256).hexdigest()
    if not isinstance(lease["signature"], str) or not hmac.compare_digest(expected, lease["signature"]):
        raise Denied("invalid signature")
    if lease["grant_id"] in revoked or lease["nonce"] in used_nonces:
        raise Denied("revoked or replayed")
    if (lease["principal_ref"], lease["subject_ref"], lease["resource"]) != (principal, subject, resource):
        raise Denied("scope mismatch")
    if action not in lease["actions"] or not branch.startswith(lease["branch_prefix"]):
        raise Denied("action or branch denied")
    if not parse_utc(lease["issued_at"]) <= now < parse_utc(lease["expires_at"]):
        raise Denied("expired or not yet valid")
    return True

def verify_witness(receipt, *, trusted_signers, expected_artifact_sha256, expected_action, expected_resource):
    """Checks a trusted HMAC test receipt; production should use asymmetric attestations."""
    if not isinstance(receipt, dict):
        raise Denied("invalid receipt")
    required = {"signer", "parent_commit", "genome_sha256", "candidate_commit", "artifact_sha256",
                "test_run_id", "checks", "approver_subject", "decision", "action", "resource",
                "nonce", "decision_time", "signature"}
    if set(receipt) != required:
        raise Denied("invalid receipt fields")
    key = trusted_signers.get(receipt["signer"])
    if not isinstance(key, bytes):
        raise Denied("untrusted signer")
    unsigned = {k: v for k, v in receipt.items() if k != "signature"}
    expected = hmac.new(key, canonical(unsigned), sha256).hexdigest()
    if not isinstance(receipt["signature"], str) or not hmac.compare_digest(expected, receipt["signature"]):
        raise Denied("witness signature invalid")
    if receipt["artifact_sha256"] != expected_artifact_sha256 or receipt["action"] != expected_action or receipt["resource"] != expected_resource:
        raise Denied("witness scope mismatch")
    if receipt["decision"] != "approved" or not receipt["approver_subject"] or not receipt["test_run_id"] or not receipt["checks"]:
        raise Denied("witness incomplete")
    parse_utc(receipt["decision_time"])
    return True
