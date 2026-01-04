ADR-0004: Prompt Templates as Versioned, Approve-able Artifacts

Status: Proposed
Date: 2026-01-03
Context

Prompts are regulated artifacts when they influence clinical/financial/legal outcomes. We need:

ownership and change control
versioning and reproducibility
ability to audit “which prompt produced this output”
no frontend prompt construction

Decision

Manage prompts as server-side templates with explicit versioning and an approval lifecycle.

Prompt Template Entity
promptTemplateId (stable)
version (int or semver)
status: DRAFT | APPROVED | DEPRECATED
content (template text)
schema (optional): allowed variables and types
changeNotes
createdAt, createdBy
approvedAt, approvedBy (when status becomes APPROVED)

Runtime Rule

Generation may only use templates with status=APPROVED unless an explicit “non-prod / feature-flag” override exists.

Version Selection

Default: latest APPROVED version for that purpose
Optionally pin a specific version per environment to avoid drift

Consequences

Prompt edits become controlled changes (suitable for ADR/change management).
Debuggability improves (each draft ties to a prompt version).
Adds operational overhead (approval flow), but this is expected in regulated environments.

Implementation Notes

Store a promptHash per version to detect tampering.
Keep templates in DB if you need runtime edits; keep in Git if you want code-review driven changes. In regulated orgs, Git + controlled deploy is often preferred.
