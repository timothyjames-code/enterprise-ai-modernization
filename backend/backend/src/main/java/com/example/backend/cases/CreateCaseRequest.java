package com.example.backend.cases;

import jakarta.validation.constraints.NotBlank;

public record CreateCaseRequest(
    @NotBlank(message = "title is required")
    String title,

    // optional; if omitted/blank we’ll default to "Open"
    String status
) {}
