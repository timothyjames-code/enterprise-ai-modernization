package com.example.backend.cases;

import com.example.backend.ai.*;
import com.example.backend.ai.PromptTemplates.PromptTemplate;
import com.example.backend.cases.dto.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

@Service
public class CaseSummaryDraftService {

  private static final int NOTES_LIMIT = 20;
  private static final int EVENTS_LIMIT = 50;

  private final CaseRepository caseRepository;
  private final CaseNoteRepository noteRepository;
  private final CaseEventRepository eventRepository;
  private final CaseSummaryDraftRepository draftRepository;
  private final CaseAuditService auditService;
  private final AiTextGenerator ai;

  public CaseSummaryDraftService(
      CaseRepository caseRepository,
      CaseNoteRepository noteRepository,
      CaseEventRepository eventRepository,
      CaseSummaryDraftRepository draftRepository,
      CaseAuditService auditService,
      AiTextGenerator ai
  ) {
    this.caseRepository = caseRepository;
    this.noteRepository = noteRepository;
    this.eventRepository = eventRepository;
    this.draftRepository = draftRepository;
    this.auditService = auditService;
    this.ai = ai;
  }

  // =========================================================
  // Create draft
  // =========================================================

  @Transactional
  public CreateDraftResponse createDraft(Long caseId, CreateSummaryDraftRequest req) {
    CaseEntity c = caseRepository.findById(caseId)
        .orElseThrow(() -> new EntityNotFoundException("Case not found: " + caseId));

    SummaryPurpose purpose = (req != null && req.purpose != null)
        ? req.purpose
        : SummaryPurpose.INTERNAL_CASE_OVERVIEW;

    // Supersede existing active drafts
    for (CaseSummaryDraft d :
        draftRepository.findByTheCaseIdAndPurposeAndStatus(caseId, purpose, DraftStatus.DRAFT)) {

      d.setStatus(DraftStatus.SUPERSEDED);
      draftRepository.save(d);

      auditService.record(
          c,
          EventType.SUMMARY_DRAFT_SUPERSEDED,
          "Summary draft superseded",
          "{\"draftId\":" + d.getId() + "}",
          AuditActor.system("case-service"),
          null
      );
    }

    // Snapshot inputs
    var notes = noteRepository.findByTheCaseIdOrderByCreatedAtDesc(caseId)
        .stream().limit(NOTES_LIMIT).toList();
    var events = eventRepository.findByTheCaseIdOrderByCreatedAtDesc(caseId)
        .stream().limit(EVENTS_LIMIT).toList();

    String snapshotText =
        "caseId=" + c.getId() +
        "|title=" + safe(c.getTitle()) +
        "|status=" + safe(c.getStatus()) +
        "|updatedAt=" + c.getUpdatedAt() +
        "|notes=" + notes.size() +
        "|events=" + events.size();

    String inputFingerprint = AuditHashing.sha256Hex(snapshotText);

    // =========================
    // Prompt (server-owned) + AI generation (FAKE provider)
    // =========================

    PromptTemplate template = PromptTemplates.resolve("case-summary-internal");

    String notesText = notes.stream()
        .map(n -> "- [" + n.getCreatedAt() + "] " + safe(n.getBody()))
        .reduce("", (a, b) -> a + b + "\n");

    String eventsText = events.stream()
        .map(e -> "- [" + e.getCreatedAt() + "] " + e.getType().name() + ": " + safe(e.getMessage()))
        .reduce("", (a, b) -> a + b + "\n");

    Map<String, String> vars = Map.of(
        "caseId", String.valueOf(c.getId()),
        "title", safe(c.getTitle()),
        "status", safe(c.getStatus()),
        "updatedAt", String.valueOf(c.getUpdatedAt()),
        "notes", notesText.isBlank() ? "(none)" : notesText,
        "events", eventsText.isBlank() ? "(none)" : eventsText
    );

    String renderedPrompt = PromptTemplates.render(template, vars);

    GenerationRequest genReq = new GenerationRequest(
        purpose.name(),
        template.id(),
        template.version(),
        renderedPrompt,
        ModelProfile.LOCAL_FAKE_SUMMARIZER,
        "policy-v1",
        null,
        Map.of("caseId", String.valueOf(caseId))
    );

    GenerationResult gen = ai.generate(genReq);
    String draftText = gen.text();

    // =========================
    // Persist draft (+ ADR-0001 provenance)
    // =========================

    CaseSummaryDraft draft = new CaseSummaryDraft();
    draft.setTheCase(c);
    draft.setPurpose(purpose);
    draft.setStatus(DraftStatus.DRAFT);
    draft.setGenerationStatus(GenerationStatus.COMPLETED);

    draft.setSourceUpdatedAt(c.getUpdatedAt());
    draft.setInputFingerprint(inputFingerprint);

    draft.setPromptTemplateId(template.id());
    draft.setPromptTemplateVersion(template.version());
    draft.setPromptHash(AuditHashing.sha256Hex(renderedPrompt));

    draft.setModelProvider(gen.provider());
    draft.setModelId(gen.modelId());
    draft.setModelConfigJson("{\"profile\":\"" + ModelProfile.LOCAL_FAKE_SUMMARIZER.name() + "\"}");
    draft.setGenerationPolicyVersion("policy-v1");

    draft.setContentText(draftText);
    draft.setOutputHash(AuditHashing.sha256Hex(draftText));

    draft.setCreatedBy("case-service");
    draft.setCorrelationId(null);

    draft.setCreatedAt(Instant.now());
    draft.setExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS));

    draftRepository.save(draft);

    auditService.record(
        c,
        EventType.SUMMARY_DRAFT_CREATED,
        "Summary draft created",
        "{\"draftId\":" + draft.getId() + ",\"purpose\":\"" + purpose.name() + "\"}",
        AuditActor.system("case-service"),
        null
    );

    return new CreateDraftResponse(
        draft.getId(),
        DraftStatus.DRAFT,
        GenerationStatus.COMPLETED,
        "/api/cases/" + caseId + "/summary-drafts/" + draft.getId()
    );
  }

  // =========================================================
  // Get draft
  // =========================================================

  @Transactional(readOnly = true)
  public CaseSummaryDraftDto getDraft(Long caseId, Long draftId) {
    CaseEntity c = caseRepository.findById(caseId)
        .orElseThrow(() -> new EntityNotFoundException("Case not found: " + caseId));

    CaseSummaryDraft d = draftRepository.findByIdAndTheCaseId(draftId, caseId)
        .orElseThrow(() -> new EntityNotFoundException("Draft not found: " + draftId));

    boolean stale = c.getUpdatedAt().isAfter(d.getSourceUpdatedAt());

    return new CaseSummaryDraftDto(
        d.getId(),
        caseId,
        d.getPurpose(),
        d.getStatus(),
        d.getGenerationStatus(),
        d.getCreatedAt(),
        d.getExpiresAt(),
        d.getSourceUpdatedAt(),
        d.getInputFingerprint(),
        d.getContentText(),
        stale,
        c.getUpdatedAt()
    );
  }

  // =========================================================
  // Accept draft
  // =========================================================

  @Transactional
  public CaseDto accept(Long caseId, Long draftId, AcceptSummaryDraftRequest req) {
    CaseEntity c = caseRepository.findById(caseId)
        .orElseThrow(() -> new EntityNotFoundException("Case not found: " + caseId));

    CaseSummaryDraft d = draftRepository.findByIdAndTheCaseId(draftId, caseId)
        .orElseThrow(() -> new EntityNotFoundException("Draft not found: " + draftId));

    if (d.getStatus() != DraftStatus.DRAFT) {
      throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Draft not reviewable");
    }
    if (d.getGenerationStatus() != GenerationStatus.COMPLETED) {
      throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Draft not ready");
    }
    if (Instant.now().isAfter(d.getExpiresAt())) {
      d.setStatus(DraftStatus.EXPIRED);
      draftRepository.save(d);

      auditService.record(
          c,
          EventType.SUMMARY_DRAFT_EXPIRED,
          "Summary draft expired",
          "{\"draftId\":" + d.getId() + "}",
          AuditActor.system("case-service"),
          null
      );

      throw new ResponseStatusException(HttpStatus.CONFLICT, "Draft expired");
    }

    boolean stale = c.getUpdatedAt().isAfter(d.getSourceUpdatedAt());
    boolean ack = (req != null) && req.acknowledgeStale;

    if (stale && !ack) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "Case changed since draft generation. Set acknowledgeStale=true or regenerate."
      );
    }

    // Apply to official case record
    c.setSummaryText(d.getContentText());
    c.setUpdatedAt(Instant.now());
    caseRepository.save(c);

    d.setStatus(DraftStatus.ACCEPTED);
    d.setReviewedAt(Instant.now());
    d.setReviewedBy("user"); // replace with auth principal
    draftRepository.save(d);

    auditService.record(
        c,
        EventType.SUMMARY_ACCEPTED,
        "Summary accepted",
        "{\"draftId\":" + d.getId() + ",\"acknowledgeStale\":" + ack + "}",
        AuditActor.user("user", "REVIEWER"),
        null
    );

    return CaseDto.fromEntity(c);
  }

  // =========================================================
  // Reject draft
  // =========================================================

  @Transactional
  public CaseSummaryDraftDto reject(Long caseId, Long draftId, RejectSummaryDraftRequest req) {
    CaseEntity c = caseRepository.findById(caseId)
        .orElseThrow(() -> new EntityNotFoundException("Case not found: " + caseId));

    CaseSummaryDraft d = draftRepository.findByIdAndTheCaseId(draftId, caseId)
        .orElseThrow(() -> new EntityNotFoundException("Draft not found: " + draftId));

    if (d.getStatus() != DraftStatus.DRAFT) {
      throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Draft not reviewable");
    }

    d.setStatus(DraftStatus.REJECTED);
    d.setReviewedAt(Instant.now());
    d.setReviewedBy("user"); // replace with auth principal
    draftRepository.save(d);

    String payload =
        "{\"draftId\":" + d.getId() +
        ",\"reasonCode\":\"" + safe(req != null ? req.reasonCode : "OTHER") + "\"}";

    auditService.record(
        c,
        EventType.SUMMARY_REJECTED,
        "Summary rejected",
        payload,
        AuditActor.user("user", "REVIEWER"),
        null
    );

    return getDraft(caseId, draftId);
  }

  // =========================================================
  // Helpers
  // =========================================================

  private static String safe(String s) {
    return (s == null) ? "" : s.replace("\"", "'");
  }

  public record CreateDraftResponse(
      Long draftId,
      DraftStatus status,
      GenerationStatus generationStatus,
      String pollUrl
  ) {}
}
