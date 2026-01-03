package com.example.backend.cases.dto;

import com.example.backend.cases.DraftStatus;
import com.example.backend.cases.GenerationStatus;
import com.example.backend.cases.SummaryPurpose;

import java.time.Instant;

public record CaseSummaryDraftDto(
    Long draftId,
    Long caseId,
    SummaryPurpose purpose,
    DraftStatus status,
    GenerationStatus generationStatus,
    Instant createdAt,
    Instant expiresAt,
    Instant sourceUpdatedAt,
    String inputFingerprint,
    String contentText,
    boolean stale,
    Instant currentCaseUpdatedAt
) {}
