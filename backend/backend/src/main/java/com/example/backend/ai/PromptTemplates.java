package com.example.backend.ai;

import java.util.Map;

public final class PromptTemplates {
  private PromptTemplates() {}

  public static PromptTemplate resolve(String templateId) {
    if ("case-summary-internal".equals(templateId)) {
      return new PromptTemplate(templateId, 1,
          """
          You are generating an internal case summary for a regulated case management system.
          Write a concise, factual summary. Do not invent details. If something is unknown, say so.

          Case:
          - ID: {{caseId}}
          - Title: {{title}}
          - Status: {{status}}
          - Last Updated: {{updatedAt}}

          Recent Notes (most recent first):
          {{notes}}

          Recent Events (most recent first):
          {{events}}

          Output format:
          - Summary (2-6 sentences)
          - Key facts (bullets)
          - Risks/Unknowns (bullets)
          """
      );
    }
    throw new IllegalArgumentException("Unknown promptTemplateId: " + templateId);
  }

  public static String render(PromptTemplate t, Map<String, String> vars) {
    String out = t.content();
    for (var e : vars.entrySet()) {
      out = out.replace("{{" + e.getKey() + "}}", e.getValue() == null ? "" : e.getValue());
    }
    return out;
  }

  public record PromptTemplate(String id, int version, String content) {}
}
