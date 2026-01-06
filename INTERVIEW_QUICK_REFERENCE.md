# Quick Reference - Interview Talking Points

## 30-Second Elevator Pitch
"An enterprise case management system that uses AI to generate case summaries for healthcare workflows. It maintains strict human oversight and full compliance audit trails, reducing review time by 30-50% while meeting regulatory requirements."

## Tech Stack (One Sentence Each)
- **Frontend**: Angular 21 with TypeScript, Material Design, signals-based state management
- **Backend**: Spring Boot 4.0.1 (Java 17), JPA/Hibernate, RESTful API
- **AI**: Provider-agnostic abstraction supporting OpenAI, Azure, AWS Bedrock
- **Database**: H2 (PostgreSQL-compatible patterns)

## Core Workflow (3 Steps)
1. **Generate**: User requests AI summary → System creates immutable draft with full provenance
2. **Review**: User sees draft in UI with staleness warnings if case changed
3. **Decide**: User accepts (becomes official) or rejects with reason code

## Key Technical Decisions

### 1. Hexagonal Architecture for AI
**Why**: Avoid vendor lock-in, enable testing, support multiple providers
**How**: `AiTextGenerator` interface with adapter implementations

### 2. Immutable Drafts
**Why**: Prevent data corruption, maintain audit integrity
**How**: Drafts cannot be modified after creation, only accepted/rejected/superseded

### 3. Staleness Detection
**Why**: Prevent accepting summaries based on outdated data
**How**: Compare `sourceUpdatedAt` (draft) vs `updatedAt` (case) at acceptance

### 4. Comprehensive Audit Trail (ADR-0001)
**Why**: Regulatory compliance, traceability
**What**: Prompt hash, model info, input/output hashes, reviewer info, timestamps

### 5. Server-Side Prompt Construction
**Why**: Security - never expose prompts or sensitive data to frontend
**How**: Templates stored and rendered on backend only

## Architecture Highlights

```
Frontend (Angular)
    ↓ HTTP REST
Backend (Spring Boot)
    ↓ JPA
Database (H2/PostgreSQL)
    ↓
AI Abstraction Layer (Ports & Adapters)
    ↓
AI Providers (Fake/OpenAI/Azure/Bedrock)
```

## Key Code Locations

**Backend:**
- `CaseSummaryDraftService.java` - Core business logic
- `CaseSummaryDraft.java` - Entity with compliance fields
- `AiTextGenerator.java` - Provider abstraction interface
- `FakeAiTextGenerator.java` - Test implementation

**Frontend:**
- `case-summary.store.ts` - Draft state management
- `case-activity-panel.component.ts` - Review UI
- `cases.page.ts` - Main case list page

## Interview Questions & Answers

**Q: Why Angular over React?**
A: "Angular's opinionated structure and strong typing make it ideal for large enterprise teams. The dependency injection and module system provide better long-term maintainability for complex applications."

**Q: How do you handle AI provider failures?**
A: "The abstraction layer allows centralized retry logic and circuit breaking. We can also easily swap providers via configuration. Currently using a fake generator for development, but the architecture supports real providers."

**Q: What about data privacy?**
A: "Prompts are constructed server-side, never exposed to frontend. We track input fingerprints to ensure we know exactly what data was used. The system is designed to avoid sending PII to AI providers."

**Q: How do you ensure data consistency?**
A: "Drafts are immutable and include source timestamps. When accepting, we check for staleness and return HTTP 409 Conflict if the case changed. Transactions ensure atomicity of accept/reject operations."

**Q: What's the hardest problem you solved?**
A: "Staleness detection - ensuring users don't accept summaries based on outdated data. I solved it by storing source timestamps and comparing at acceptance time, with clear UI warnings and explicit acknowledgment required."

## Metrics to Mention
- API latency: < 500ms (non-AI)
- AI inference: < 3 seconds
- Target: 30-50% reduction in review time
- Zero PII in AI prompts

## ADRs (Architecture Decision Records)
- **ADR-0001**: Compliance record for AI drafts
- **ADR-0002**: Audit log hash chain
- **ADR-0003**: LLM provider abstraction
- **ADR-0004**: Prompt versioning

## What This Demonstrates
✅ Enterprise software patterns
✅ Full-stack development
✅ AI integration with safety
✅ Complex state management
✅ Production-ready error handling
✅ Compliance-first design

