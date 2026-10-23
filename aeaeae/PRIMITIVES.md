# $æææ · Executable local primitives v0.1

Status: **local reference implementation**. Not a production authorization or agent service.

| Primitive | Implemented behavior |
|---|---|
| `>_` intent | One human-labeled root, explicit brief and deadline |
| `💬` context | Selected source-labeled context is copied to a child; no implicit inheritance |
| `æ` child | Immutable parent relationship, bounded depth/open tasks/total nodes, typed state |
| `|||` composition | Independent bounded siblings; local operations are serialized for consistent decisions |
| capability | Fixed `text.inspect` and `draft.compose`; deterministic local results, no AI calls |
| `🫵` decision | Opaque instance-local, one-use handle bound to task revision, payload, context and deadline; expiry/revocation |
| `🧾` witness | Hash-linked events, computation results, correlation and parent references, head/count anchor |
| `↺` return | Rejoin child statuses/results/evidence; complete only when every descendant returned |

## Try it

Serve this repository locally and open `aeaeae/workbench.html`, or open it through a verified HTTPS deployment. A server avoids browser restrictions on module loading. Use Web Crypto hashing where available; the portable SHA-256 implementation supplies local evidence hashing on development HTTP origins and is tested against Node's implementation.

1. Enter a goal and brief. Begin the intent.
2. Select the parent and the brief it holds. Propose a text inspection or an unsent draft.
3. Review the displayed input. Record a local confirmation, then run the task.
4. Rejoin the returned results. Complete the intent only after all descendants return.
5. Export the ledger. Keep the exported head/count separately to detect later tampering or truncation relative to that anchor.

CLI: `node aeaeae/demo.mjs` runs a fixture with two tasks. Its principal confirmations are simulated by the demo script. The inspection counts text; the draft capability formats text and sets `sent: false`.

Tests: `node --test tests/aeaeae.test.mjs tests/primitives.test.mjs`.

## State and limits

Root starts `RUNNING`. Children start `PROPOSED`; local confirmation queues them; execution returns a result. Revision invalidates previous decisions. `CANCELLED` and `EXPIRED` are terminal. Parent cancellation cancels open descendants. Work cannot execute under a terminal ancestor. Open descendants block their parent's execution; cancelled descendants do not silently become success.

Defaults: depth 3, open child tasks 4, total nodes 64, root lifetime 10 minutes, child lifetime at most 5 minutes, local confirmation lifetime at most 1 minute. Configured limits are bounded in code. This is not a token or compute-cost budget manager.

The engine is browser/Node ESM. Mutations are serialized in-process, with snapshot copies rather than mutable internal references. No runtime state import is implemented; a JSON record cannot become an executable decision handle.

## Verification performed

Twenty local Node tests pass. The browser workshop was exercised through intent creation, child proposal, denied unapproved run, local confirmation, successful execution, rejoin, root completion and JSON export. The downloaded browser ledger was independently checked by the Node verifier against its exported head/count. This checks internal consistency, not the origin or truth of an arbitrary imported export. Mobile devices, screen readers, production hosting and external provider execution remain unverified.

## Evidence and authority limits

`principalId` and the UI confirmation button identify the local interaction only. They do not authenticate a real person, isolate hostile JavaScript in the same page, or authorize external effects. Do not attach consequential providers to this implementation. A separately verified host identity and grant service are needed for that boundary.

The ledger is in-memory. The app never persists user input automatically; explicit JSON export contains the user's text. Hashes detect changes against a retained anchor; they are neither signatures nor independent attestation. A party that controls both an export and its anchor can fabricate a replacement chain. Nothing is stored in GitHub by the workshop.

Existing PRs #1 (onboarding/orchestration) and #2 (governance) remain separate. Their interfaces informed this reference, but their unmerged authority mechanisms were not imported or certified. A future adapter must reconcile contracts through review and tests.
