package com.example.backend.cases.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateNoteRequest {
  @NotBlank(message = "Note body is required")
  public String body;
}
