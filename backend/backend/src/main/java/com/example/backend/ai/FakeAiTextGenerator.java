package com.example.backend.ai;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;

@Component
public class FakeAiTextGenerator implements AiTextGenerator {

  @Override
  public GenerationResult generate(GenerationRequest request) {
    long start = System.currentTimeMillis();

    // Very simple "fake" output that still follows your required structure.
    String text =
        "Summary: This is a demo-generated internal case summary for a regulated workflow. " +
        "It is based on the latest case fields and recent notes/events provided to the generator. " +
        "No external LLM provider was called.\n\n" +
        "Key facts:\n" +
        "- Purpose: " + request.purpose() + "\n" +
        "- Prompt template: " + request.promptTemplateId() + " v" + request.promptTemplateVersion() + "\n" +
        "- Generated at: " + Instant.now() + "\n\n" +
        "Risks/Unknowns:\n" +
        "- This environment is using a local fake generator (no external model).\n";

    long latency = System.currentTimeMillis() - start;

    return new GenerationResult(
        text,
        "FAKE",
        "local-fake-v1",
        1,
        latency,
        Map.of(
            "policyVersion", request.generationPolicyVersion(),
            "note", "Portfolio mode - no external provider"
        )
    );
  }
}
