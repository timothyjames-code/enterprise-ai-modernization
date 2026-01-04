ADR-0002: Audit Log as Append-Only Hash-Chained Events

Status: Proposed
Date: 2026-01-03
Context

We currently record audit events for draft create/accept/reject. In regulated environments we must ensure:

audit completeness (events always written)

tamper evidence (post-hoc changes detectable)

consistent actor attribution

correlation across systems/requests

Decision

Adopt an append-only audit event log with a hash chain for tamper evidence.

Each audit event is an immutable record containing:

eventId

occurredAt

eventType: e.g. DRAFT_CREATED, DRAFT_ACCEPTED, DRAFT_REJECTED, DRAFT_EXPIRED, DRAFT_POLICY_FAILED

actorType: USER | SYSTEM

actorId: userId or service principal

actorRole (when actorType=USER)

caseId

draftId (if applicable)

purpose

requestId / correlationId

payloadJson: minimal structured data (reason codes, hashes, status transitions)

prevEventHash

eventHash = SHA-256(prevEventHash + canonical(event fields))

Hash chaining may be global or partitioned:

Recommended: partition chain per caseId (simpler operationally, still strong value)

Alternative: single global chain (stronger but operationally heavier)

Consequences

Tampering becomes detectable (audit integrity checks can run periodically).

Events become the canonical “history” for compliance exports.

Increased write volume; audit table must be indexed and retention-managed.

Migration requires a bootstrapping strategy for prevEventHash.

Implementation Notes

Make audit writing part of the same transaction as the domain change where possible.

If you must write audit out-of-band, use a transactional outbox pattern (later ADR if needed).

Provide an internal endpoint/job to verify the chain and alert on breaks.
