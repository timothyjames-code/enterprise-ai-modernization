package com.example.backend.cases;

import java.time.Instant;

public record CaseDto(
    Long id,
    String title,
    String status,
    Instant createdAt,
    Instant updatedAt,
    String summaryText
) {
  static CaseDto fromEntity(CaseEntity e) {
    return new CaseDto(
        e.getId(),
        e.getTitle(),
        e.getStatus(),
        e.getCreatedAt(),
        e.getUpdatedAt(),
        e.getSummaryText()
    );
  }
}
