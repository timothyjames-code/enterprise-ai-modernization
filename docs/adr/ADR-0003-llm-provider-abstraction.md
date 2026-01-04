ADR-0003: LLM Provider Abstraction via Ports/Adapters

Status: Proposed
Date: 2026-01-03
Context

We need real LLM integration, but we must:

keep the workflow backend-only

prevent vendor lock-in

avoid prompt construction on the frontend

ensure consistent compliance metadata independent of provider

Decision

Use a Ports & Adapters (Hexagonal) design for LLM calls.

Domain Port

Define an interface such as:

AiTextGenerator.generate(GenerationRequest) -> GenerationResult

Where GenerationRequest contains:

purpose

promptTemplateId, promptTemplateVersion

renderedPrompt OR template + inputs (see prompt ADR)

modelProfile (abstract selection that maps to provider-specific modelId/config)

generationPolicyVersion

idempotencyKey

correlationId

And GenerationResult contains:

text

provider + modelId

usage (tokens if available)

rawProviderMetadata (sanitized)

latencyMs

Provider Adapters

Implement adapters:

OpenAiAdapter

AzureOpenAiAdapter

etc.

The domain layer must not import provider SDK types. Adapters translate between domain request/result and provider APIs.

Consequences

Provider switching becomes a configuration/adaptation exercise rather than a rewrite.

Testing becomes simpler (fake generator for deterministic tests).

Requires an explicit mapping layer for “model profiles” and config.

Implementation Notes

Start with FakeAiTextGenerator returning deterministic text for integration tests.

Centralize retries/circuit breaking either inside adapters or via a shared wrapper, but keep policy decisions (retryable vs not) in domain/application layer.
