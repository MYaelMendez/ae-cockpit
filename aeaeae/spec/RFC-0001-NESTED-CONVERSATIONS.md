# RFC-0001 · Nested conversations

Status: **Proposal** · Version: **0.1** · Project: **$æææ**

## Intent

Turn “the chats within the chat” into a bounded, inspectable conversation tree. The human remains the authority root. Every child has one parent, an explicit purpose, selected context, defined limits, and a return path.

## Terms

- **Principal:** the human whose judgment and authorization govern effects.
- **Parent:** the conversation that requests and receives a bounded child result.
- **Child:** a distinct task conversation with a parent reference and scope.
- **Context:** selected information, with source references and privacy labels.
- **Grant:** host-verified authority, issued separately from context and task text.
- **Evidence:** an observed result with a source, revision, and timestamp where available.

## Proposed record

Each conversation has `id`, nullable `parent_id`, `principal_ref`, `purpose`, `status`, `context_refs`, `requested_capabilities`, `limits`, `correlation_id`, `created_at`, nullable `finished_at`, and `result_ref`.

Limits include maximum depth, maximum concurrent children, deadline, and explicit resource budget where measurable. A host must validate actual availability and permissions; record fields never grant authority. Missing or invalid authority blocks consequential execution.

## Lifecycle

`PROPOSED → QUEUED → RUNNING → RETURNED`

Additional states: `WAITING_FOR_HUMAN`, `FAILED`, `CANCELLED`, `EXPIRED`. A retry creates a new attempt with a causation reference and bounded retry count. A failed or cancelled child cannot be reported as completed. A parent cancellation propagates cancellation requests to active descendants; the host records whether they actually stopped.

## Invariants

1. One principal per tree. Every non-root conversation has exactly one known parent. Parent links are acyclic.
2. Context selection is explicit. Minimize personal data and preserve source references.
3. Context, child creation, model output, and a receipt do not create or expand authority.
4. Consequential operations require a current host-verified grant scoped to the exact action, principal, payload and relevant revision, with expiry and revocation enforced by that host.
5. Children cannot approve their own consequential operations or increase their limits.
6. Rejoin preserves disagreements, failures, unresolved questions and evidence gaps. A summary does not upgrade reported evidence to independently reproduced evidence.
7. Each state change and attempt is attributable and inspectable. A log is not automatically a cryptographic attestation.

## Minimal future host interface

- `proposeChild(parent, task, contextRefs, limits)` returns a proposal.
- `startChild(proposal, hostAuthorizationRef)` verifies bounds and queues work.
- `inspectConversation(id)` returns observable state and references.
- `cancelConversation(id, principalAuthorizationRef)` requests bounded cancellation.
- `returnResult(id, result, evidenceRefs)` records a result for parent review.

These are conceptual interfaces, not implemented endpoints or callable tools.

## Return envelope

Include conversation and attempt IDs, correlation/causation IDs, actual status, source revision, outputs, evidence references, observed effects, errors, resource usage if measured, and remaining decisions. Never fabricate cost, completion, approval, or external state.

## Acceptance targets

- Reject cycles and orphan children.
- Refuse execution above configured depth/concurrency/budget limits.
- Refuse consequential operations without a valid action-bound host grant.
- Demonstrate that copied context and imported JSON cannot transfer authority.
- Preserve parent/child correlation across retries and returns.
- Surface cancellation, expiry and partial failure honestly.
- Rejoin results with evidence classification and unresolved decisions intact.

## Boundary

The origin loop illustrates this idea. No conversation runtime, agent orchestration, live permission service, or platform command registration is delivered by this RFC.
