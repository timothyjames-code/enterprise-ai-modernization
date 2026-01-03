package com.example.backend.cases.dto;

import jakarta.validation.constraints.NotBlank;

public class RejectSummaryDraftRequest {
  @NotBlank
  public String reasonCode; // e.g. INACCURATE, INCOMPLETE, OTHER
  public String comment;
}
