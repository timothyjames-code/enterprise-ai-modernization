package com.example.backend.cases;

public record UpdateCaseRequest(
    String title,
    String status
) {}
