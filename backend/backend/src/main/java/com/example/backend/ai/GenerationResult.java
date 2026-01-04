package com.example.backend.ai;

import java.util.Map;

public record GenerationResult(
    String text,
    String provider,
    String modelId,
    int attempts,
    long latencyMs,
    Map<String, Object> providerMetadata
) {}
