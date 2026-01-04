ADR-0001: Compliance Record for AI Drafts and Reviews

Status: Proposed
Date: 2026-01-03
Context

We have a human-in-the-loop AI summary workflow where:

Drafts are immutable.
Case summary is updated only on accept.
Single active draft per (case, purpose).
Audit events exist for create/accept/reject.
Proper HTTP semantics exist for stale/conflict/unprocessable.

In a regulated environment, we must be able to answer, for any generated draft and resulting accepted summary:

What data was used?
Which prompt and model produced it?
Under which policy/version?
Who reviewed it and why?
Was the draft stale at time of review?

Decision

Introduce a first-class Compliance Record spanning both generation provenance and review provenance.
Generation provenance (stored with each draft)
Store the following immutable metadata with each draft:
purpose: enum/string (e.g., CASE_SUMMARY)
promptTemplateId: stable identifier
promptTemplateVersion: monotonically increasing int or semver
promptHash: SHA-256 hash of the fully-rendered prompt or (template + resolved inputs) representation
modelProvider: string (e.g., OPENAI, AZURE_OPENAI)
modelId: exact deployed model name
modelConfig: JSON (temperature, top_p, max_tokens, seed if applicable)
generationPolicyVersion: string/int identifying the safety/redaction/validation policy applied
inputFingerprint: cryptographic hash that commits to the exact inputs used
  either via snapshot hash (if snapshotting inputs), or
  via referenced-record hash (IDs + per-record hashes + ordering rule)
outputHash: SHA-256 hash of the draft text
createdBy: system principal (service identity)
createdAt
requestId / correlationId

Review provenance (stored with each review action)

Store the following on accept/reject:

reviewerUserId
reviewerRole (at time of action)
decision: ACCEPT | REJECT
reasonCode: enum (structured)
comment: optional free text
reviewedAt
stalenessCheckResult: pass/fail + details (e.g., compared fingerprint values)
policyCheckResult: pass/fail + details (output validation summary)
requestId / correlationId

Consequences

We can support internal/external audits with clear evidence.
We gain traceability for incidents (wrong summary, disputed changes).
Schema grows; storage increases moderately.
Requires strict discipline: no “optional” provenance in production paths.

Implementation Notes

Prefer inputFingerprint derived from deterministic canonicalization (stable ordering, stable JSON).
Never log raw prompt bodies in general logs; store them only if policy requires and encrypt at rest.
Expose provenance via privileged endpoints (not general UI).
