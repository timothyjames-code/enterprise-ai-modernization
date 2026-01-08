# Case Management System with Human-in-the-Loop AI Summarization

This project is a production-style **case management system** demonstrating how to safely integrate AI-generated summaries into a regulated, audit-sensitive workflow.

It is intentionally designed **without chatbots or gimmicks**, focusing instead on:
- correctness
- governance
- auditability
- explicit human review

This mirrors real enterprise and regulated-environment requirements.

---

## 🎯 Key Features

### Case Management
- Paginated, sortable, filterable case list (URL-synced)
- Case detail drawer with full activity timeline
- Notes with create / edit / delete
- Safe case deletion with referential integrity handling

### Human-in-the-Loop AI Summary Workflow
- **Draft-based AI summaries** (no direct writes to case record)
- Single active draft per case & purpose
- Explicit **accept / reject** review step
- Drafts are **immutable**
- Case summary updates **only on accept**

### Staleness Protection
- Drafts capture a `sourceUpdatedAt` snapshot
- If the case changes after generation:
  - Accept is blocked with **HTTP 409**
  - Reviewer must explicitly acknowledge staleness
- Prevents silent overwrites of newer data

### Audit & Activity Timeline
- Unified timeline of:
  - notes
  - system events
  - AI lifecycle events
- Audit events recorded for:
  - draft creation
  - accept
  - reject (with reason code)
- Payloads stored as structured JSON for future reporting

### Proper API Semantics
- `400` – validation errors
- `404` – missing resources
- `409` – conflicts (stale drafts)
- `422` – invalid state transitions
- `204` – successful deletes

---

## 🏗 Architecture Overview

### Frontend
- Angular (standalone components)
- Angular Material 3
- Signals (zoneless)
- Drawer-based UX for review-first workflows
- Optimistic UI updates where safe

### Backend
- Spring Boot
- RESTful APIs
- JPA / Hibernate
- H2 (local dev)
- Transactional boundaries around state transitions

### AI Design (Provider-Agnostic)
- Backend-only summary generation
- No frontend prompt construction
- Draft lifecycle enforces human review
- Architecture supports future LLM providers (e.g. AWS Bedrock)

---

## 🧠 AI Summary Lifecycle

1. User requests summary draft
2. Backend snapshots case inputs (notes, events, metadata)
3. Draft is generated (currently stubbed)
4. Draft enters **DRAFT** state
5. Reviewer can:
   - Accept → updates official summary
   - Reject → records reason
   - Regenerate → supersedes previous draft
6. All actions are recorded as audit events

**Important:** Drafts are immutable. The system never mutates generated content after creation.

---

## 🔐 Governance & Compliance Concepts Demonstrated

- Immutable draft records
- Explicit human approval gates
- Staleness detection + acknowledgment
- Audit completeness with structured payloads
- Separation of “generated” vs “official” data
- Deterministic state transitions

This mirrors patterns used in healthcare, legal, finance, and enterprise AI systems.

---

## 📂 Project Structure (Simplified)

backend/
cases/
CaseController
CaseEntity
CaseEvent
CaseSummaryDraft
repositories/
services/
docs/
adr/
ADR-0001-immutable-drafts.md
ADR-0002-staleness-protection.md
ADR-0003-audit-events.md
frontend/
cases/
case-activity-panel.component.ts
case-summary.store.ts

yaml
Copy code

---

## 🚀 Running Locally

### Backend
```bash
./mvnw spring-boot:run
Frontend
bash
Copy code
npm install
ng serve
Then open:

arduino
Copy code
http://localhost:4200
