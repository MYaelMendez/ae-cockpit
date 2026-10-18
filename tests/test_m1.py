import copy
import hmac
import json
import unittest
from datetime import datetime, timezone
from hashlib import sha256
from pathlib import Path
from packages.governance.reference import Denied, canonical, digest, verify_lease, verify_witness

KEY = b"unit-test-only-key"
NOW = datetime(2026, 10, 18, 14, 40, tzinfo=timezone.utc)

def sign(value):
    return hmac.new(KEY, canonical(value), sha256).hexdigest()

def lease():
    d = dict(grant_id="g1", principal_ref="human:1", subject_ref="agent:1",
             resource="github:owner/repo", actions=["pr.create"], branch_prefix="feature/",
             issued_at="2026-10-18T14:32:00Z", expires_at="2026-10-18T15:32:00Z",
             nonce="n1", issuer="test-issuer")
    return dict(d, signature=sign(d))

def check(l, **kwargs):
    opts = dict(principal="human:1", subject="agent:1", resource="github:owner/repo",
                action="pr.create", branch="feature/test", now=NOW,
                trusted_issuers={"test-issuer": KEY}, revoked=set(), used_nonces=set())
    opts.update(kwargs)
    return verify_lease(l, **opts)

class M1Tests(unittest.TestCase):
    def test_canonical_deterministic(self):
        self.assertEqual(digest({"a":1,"b":2}), digest({"b":2,"a":1}))
    def test_lease_valid(self):
        self.assertTrue(check(lease()))
    def test_lease_forgery(self):
        l=lease(); l["actions"]=["admin"]; self.assertRaises(Denied,check,l)
    def test_lease_expired(self):
        self.assertRaises(Denied,check,lease(),now=datetime(2027,1,1,tzinfo=timezone.utc))
    def test_lease_revoked(self):
        self.assertRaises(Denied,check,lease(),revoked={"g1"})
    def test_lease_replay(self):
        self.assertRaises(Denied,check,lease(),used_nonces={"n1"})
    def test_wrong_principal(self):
        self.assertRaises(Denied,check,lease(),principal="human:2")
    def test_wrong_subject(self):
        self.assertRaises(Denied,check,lease(),subject="agent:child")
    def test_wrong_branch(self):
        self.assertRaises(Denied,check,lease(),branch="main")
    def test_wrong_resource(self):
        self.assertRaises(Denied,check,lease(),resource="github:other/repo")
    def test_untrusted_issuer(self):
        self.assertRaises(Denied,check,lease(),trusted_issuers={})
    def test_extra_permission_field(self):
        l=lease(); l["admin"]=True; self.assertRaises(Denied,check,l)
    def test_witness_tamper(self):
        r=dict(signer="ci",parent_commit="a",genome_sha256="b",candidate_commit="c",
               artifact_sha256="d",test_run_id="run1",checks=["unit:passed"],
               approver_subject="human:1",decision="approved",action="deploy",resource="site",
               nonce="unique",decision_time="2026-10-18T14:32:00Z")
        r["signature"]=sign(r)
        self.assertTrue(verify_witness(r,trusted_signers={"ci":KEY},expected_artifact_sha256="d",expected_action="deploy",expected_resource="site"))
        r["artifact_sha256"]="forged"
        self.assertRaises(Denied,verify_witness,r,trusted_signers={"ci":KEY},expected_artifact_sha256="d",expected_action="deploy",expected_resource="site")
    def test_schema_structure(self):
        s=json.loads(Path("packages/genome/schema.json").read_text())
        self.assertFalse(s["additionalProperties"])
        self.assertEqual(s["properties"]["authority"]["properties"]["authority_may_propagate"]["const"],False)
        self.assertNotIn("authorized_bindings",s["properties"]["capabilities"]["properties"])

if __name__ == "__main__":
    unittest.main()
