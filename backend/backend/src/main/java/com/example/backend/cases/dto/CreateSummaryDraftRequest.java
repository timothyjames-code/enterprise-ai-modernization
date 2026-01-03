package com.example.backend.cases.dto;

import com.example.backend.cases.SummaryPurpose;
import jakarta.validation.constraints.NotNull;

public class CreateSummaryDraftRequest {
  @NotNull
  public SummaryPurpose purpose = SummaryPurpose.INTERNAL_CASE_OVERVIEW;
}
