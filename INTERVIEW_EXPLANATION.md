# Enterprise AI Modernization Application - Interview Guide

## Executive Summary

This is an **enterprise case management system** that demonstrates how to safely integrate AI into regulated healthcare workflows. The application modernizes legacy case review processes by using AI to generate case summaries while maintaining strict human oversight and compliance requirements.

---

## Business Problem & Solution

### The Challenge
Enterprise healthcare organizations face:
- Manual, time-consuming case review processes
- Fragmented data sources and outdated UIs
- High operational costs and error rates
- Need for AI assistance without compromising regulatory compliance

### The Solution
A **human-in-the-loop AI workflow** that:
- Generates AI-assisted case summaries to reduce review time by 30-50%
- Maintains full audit trails and compliance records
- Requires human approval for all AI-generated content
- Provides deterministic, explainable outputs

---

## Architecture Overview

### Technology Stack

**Frontend:**
- **Angular 21** with TypeScript
- **Angular Material** for UI components
- **RxJS** for reactive state management
- Standalone components with signals-based state

**Backend:**
- **Spring Boot 4.0.1** (Java 17)
- **JPA/Hibernate** for data persistence
- **H2 Database** (PostgreSQL-compatible patterns)
- RESTful API architecture

**AI Integration:**
- **Provider-agnostic design** using Ports & Adapters pattern
- Support for multiple providers: OpenAI, Azure OpenAI, AWS Bedrock
- Currently using `FakeAiTextGenerator` for development/testing

---

## Core Features & Workflows

### 1. Case Management
- Create, view, edit, and delete cases
- Pagination, filtering, and search
- Case status tracking (Open, In Review, Closed)
- Real-time activity feed per case

### 2. AI-Powered Summary Generation

**The Workflow:**
1. **Draft Creation**: User requests a summary draft for a case
2. **Input Snapshotting**: System captures case data, notes, and events
3. **Prompt Rendering**: Server-side prompt template rendering (never exposed to frontend)
4. **AI Generation**: Calls AI provider through abstraction layer
5. **Draft Storage**: Saves draft with full provenance metadata
6. **Human Review**: User reviews draft in UI
7. **Accept/Reject**: User accepts (becomes official) or rejects with reason

**Key Design Decisions:**
- **Immutable drafts**: Once created, drafts cannot be modified
- **Staleness detection**: Warns if case changed since draft generation
- **Single active draft**: New drafts supersede previous ones
- **Expiration**: Drafts expire after 7 days

### 3. Compliance & Audit Trail

**ADR-0001: Compliance Record** - Every draft stores:
- **Generation Provenance** (immutable):
  - Prompt template ID and version
  - SHA-256 hash of rendered prompt
  - Model provider, model ID, and configuration
  - Generation policy version
  - Input fingerprint (hash of source data)
  - Output hash (hash of generated text)
  - System principal and correlation ID

- **Review Provenance** (on accept/reject):
  - Reviewer user ID and role
  - Decision (ACCEPT/REJECT)
  - Reason code and optional comment
  - Timestamp and staleness check result

**Why This Matters:**
- Enables full traceability for regulatory audits
- Answers "What data was used?", "Which model produced it?", "Who reviewed it?"
- Cryptographic hashing ensures data integrity

---

## Technical Highlights

### 1. Hexagonal Architecture (Ports & Adapters)

The AI integration uses a clean abstraction:

```java
// Domain interface (port)
public interface AiTextGenerator {
  GenerationResult generate(GenerationRequest request);
}

// Adapters (implementations)
- FakeAiTextGenerator (for testing)
- OpenAiTextGenerator (commented out, ready to enable)
- BedrockConverseTextGenerator (AWS Bedrock support)
```

**Benefits:**
- Easy provider switching via configuration
- Testable with fake implementations
- No vendor lock-in
- Centralized retry/circuit breaking logic

### 2. State Management (Frontend)

**Angular Signals** for reactive state:
- Per-case draft state tracking
- Loading states for async operations
- Optimistic UI updates
- Stale data acknowledgment

**Store Pattern:**
- `CaseSummaryStore`: Manages draft lifecycle
- `CaseActivityStore`: Manages activity feed
- `CasesStore`: Manages case list state

### 3. Staleness Detection

**Problem**: Case data might change after draft generation

**Solution**: 
- Store `sourceUpdatedAt` timestamp when draft is created
- Compare to `CaseEntity.updatedAt` when accepting
- Return HTTP 409 Conflict if stale (unless acknowledged)

**User Experience:**
- Frontend shows stale warning
- User can acknowledge and proceed, or regenerate

### 4. Prompt Template Versioning

**ADR-0004**: Prompt templates are versioned and tracked:
- Template ID: `"case-summary-internal"`
- Template version: Incremented on changes
- Rendered prompt hash: SHA-256 for integrity
- Enables A/B testing and rollback capabilities

### 5. Audit Event System

Every significant action creates an audit event:
- `SUMMARY_DRAFT_CREATED`
- `SUMMARY_DRAFT_SUPERSEDED`
- `SUMMARY_ACCEPTED`
- `SUMMARY_REJECTED`
- `SUMMARY_DRAFT_EXPIRED`

Events include:
- Actor (system or user)
- Timestamp
- Structured JSON payload
- Correlation ID for request tracing

---

## API Design

### RESTful Endpoints

**Cases:**
- `GET /api/cases` - List with pagination/filtering
- `POST /api/cases` - Create case
- `GET /api/cases/{id}` - Get case
- `PATCH /api/cases/{id}` - Update case
- `DELETE /api/cases/{id}` - Delete case

**Summary Drafts:**
- `POST /api/cases/{caseId}/summary-drafts` - Create draft
- `GET /api/cases/{caseId}/summary-drafts/{draftId}` - Get draft
- `POST /api/cases/{caseId}/summary-drafts/{draftId}/accept` - Accept draft
- `POST /api/cases/{caseId}/summary-drafts/{draftId}/reject` - Reject draft

**Activity:**
- `GET /api/cases/{caseId}/activity` - Get activity feed

### HTTP Semantics
- **409 Conflict**: Stale draft (must acknowledge)
- **422 Unprocessable Entity**: Invalid state (e.g., draft already accepted)
- **404 Not Found**: Resource doesn't exist

---

## Security & Compliance Considerations

1. **No PII in AI Prompts**: System designed to avoid sending sensitive data to AI providers
2. **Server-Side Prompt Construction**: Prompts never exposed to frontend
3. **Immutable Audit Trail**: Cryptographic hashing ensures data integrity
4. **Human-in-the-Loop**: All AI outputs require explicit human approval
5. **Policy Versioning**: Generation policies are versioned for compliance tracking

---

## Performance Targets

- **API latency**: < 500ms for non-AI operations
- **AI inference**: < 3 seconds
- **Frontend**: Optimized with lazy loading, pagination, and efficient state management

---

## What Makes This Interview-Ready

### 1. Enterprise Patterns
- Hexagonal architecture
- Domain-driven design principles
- Comprehensive audit logging
- Compliance-first approach

### 2. Modern Frontend Practices
- Angular signals for reactivity
- Standalone components
- Store-based state management
- Material Design UI

### 3. AI Integration Best Practices
- Provider abstraction
- Prompt versioning
- Staleness detection
- Human oversight workflow

### 4. Documentation
- ADRs (Architecture Decision Records)
- Clear problem statement
- Technology rationale
- Success metrics

### 5. Production-Ready Features
- Error handling
- Loading states
- Optimistic updates
- Data validation
- Transaction management

---

## Key Talking Points for Interviews

### When Discussing Architecture:
- "I used a Hexagonal Architecture pattern for AI integration to avoid vendor lock-in and enable easy testing"
- "I implemented comprehensive audit trails with cryptographic hashing to meet healthcare compliance requirements"
- "The system uses immutable drafts with staleness detection to prevent data consistency issues"

### When Discussing Frontend:
- "I leveraged Angular signals for reactive state management, reducing boilerplate compared to traditional services"
- "The UI uses a store pattern to manage complex async workflows like draft creation and acceptance"
- "I implemented optimistic UI updates to improve perceived performance"

### When Discussing AI Integration:
- "I designed a provider-agnostic abstraction layer that supports multiple LLM providers (OpenAI, Azure, AWS Bedrock)"
- "All prompts are constructed server-side to prevent exposure of sensitive data"
- "The system tracks full provenance metadata for every AI-generated draft to enable regulatory audits"

### When Discussing Problem-Solving:
- "I solved the staleness problem by storing source timestamps and comparing them at acceptance time"
- "I implemented draft expiration to prevent accumulation of stale drafts"
- "The system uses HTTP 409 Conflict responses to handle concurrent modification scenarios"

---

## Areas for Future Enhancement

1. **Authentication & Authorization**: Currently uses placeholder user IDs
2. **Real AI Provider Integration**: Enable OpenAI/Azure/Bedrock adapters
3. **Async Draft Generation**: Polling endpoint for long-running generations
4. **Batch Operations**: Generate summaries for multiple cases
5. **Advanced Filtering**: More sophisticated search and filter options
6. **Export Functionality**: Export cases and audit logs
7. **Notifications**: Real-time updates for draft status changes

---

## How to Demo This Application

1. **Start with the Problem**: Explain the healthcare case review challenge
2. **Show the Workflow**: Create a case → Generate summary → Review → Accept/Reject
3. **Highlight Compliance**: Point out the audit trail and provenance metadata
4. **Discuss Architecture**: Walk through the Hexagonal Architecture for AI
5. **Show Code Quality**: Reference ADRs, clean separation of concerns, error handling

---

## Conclusion

This application demonstrates:
- ✅ Enterprise software development practices
- ✅ Modern full-stack development (Angular + Spring Boot)
- ✅ AI integration with safety and compliance
- ✅ Complex state management and async workflows
- ✅ Production-ready error handling and validation
- ✅ Thoughtful architecture decisions with documentation

It's a portfolio piece that shows you can build real-world, production-quality software that solves business problems while maintaining high technical standards.



