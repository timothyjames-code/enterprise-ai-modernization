package com.example.backend.ai;

import java.util.Map;

public record GenerationRequest(
    String purpose,
    String promptTemplateId,
    int promptTemplateVersion,
    String renderedPrompt,
    ModelProfile modelProfile,
    String generationPolicyVersion,
    String correlationId,
    Map<String, String> tags
) {}
