package com.example.backend.cases;

import com.example.backend.cases.dto.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;

@Service
public class CaseSummaryDraftService {

  private static final int NOTES_LIMIT = 20;
  private static final int EVENTS_LIMIT = 50;

  private final CaseRepository caseRepository;
  private final CaseNoteRepository noteRepository;
  private final CaseEventRepository eventRepository;
  private final CaseSummaryDraftRepository draftRepository;

  public CaseSummaryDraftService(
      CaseRepository caseRepository,
      CaseNoteRepository noteRepository,
      CaseEventRepository eventRepository,
      CaseSummaryDraftRepository draftRepository
  ) {
    this.caseRepository = caseRepository;
    this.noteRepository = noteRepository;
    this.eventRepository = eventRepository;
    this.draftRepository = draftRepository;
  }

  @Transactional
  public CreateDraftResponse createDraft(Long caseId, CreateSummaryDraftRequest req) {
    CaseEntity c = caseRepository.findById(caseId)
        .orElseThrow(() -> new EntityNotFoundException("Case not found: " + caseId));

    SummaryPurpose purpose = (req != null && req.purpose != null)
        ? req.purpose
        : SummaryPurpose.INTERNAL_CASE_OVERVIEW;

    // Supersede existing active drafts for this purpose
    for (CaseSummaryDraft d : draftRepository.findByTheCaseIdAndPurposeAndStatus(caseId, purpose, DraftStatus.DRAFT)) {
      d.setStatus(DraftStatus.SUPERSEDED);
      draftRepository.save(d);
    }

    // Snapshot inputs (server-owned)
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

    String fingerprint = sha256(snapshotText);

    // Stub summary (replace later with AI generation)
    String draftText =
        "Draft summary (stub): Case \"" + safe(c.getTitle()) + "\" is currently \"" + safe(c.getStatus()) + "\". " +
        "Based on " + notes.size() + " recent notes and " + events.size() + " recent events as of " + c.getUpdatedAt() + ".";

    CaseSummaryDraft draft = new CaseSummaryDraft();
    draft.setTheCase(c);
    draft.setPurpose(purpose);
    draft.setStatus(DraftStatus.DRAFT);
    draft.setGenerationStatus(GenerationStatus.COMPLETED);
    draft.setSourceUpdatedAt(c.getUpdatedAt());
    draft.setInputFingerprint(fingerprint);
    draft.setContentText(draftText);
    draft.setCreatedAt(Instant.now());
    draft.setExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS));
    draftRepository.save(draft);

    // Record event
    recordEvent(c, EventType.SUMMARY_DRAFT_CREATED, "Summary draft created",
        "{\"draftId\":" + draft.getId() + ",\"purpose\":\"" + purpose.name() + "\"}");

    return new CreateDraftResponse(
        draft.getId(),
        DraftStatus.DRAFT,
        GenerationStatus.COMPLETED,
        "/api/cases/" + caseId + "/summary-drafts/" + draft.getId()
    );
  }

  @Transactional(readOnly = true)
  public CaseSummaryDraftDto getDraft(Long caseId, Long draftId) {
    CaseEntity c = caseRepository.findById(caseId)
        .orElseThrow(() -> new EntityNotFoundException("Case not found: " + caseId));

    CaseSummaryDraft d = draftRepository.findByIdAndTheCaseId(draftId, caseId)
        .orElseThrow(() -> new EntityNotFoundException("Draft not found: " + draftId + " for case " + caseId));

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

  @Transactional
  public CaseDto accept(Long caseId, Long draftId, AcceptSummaryDraftRequest req) {
    CaseEntity c = caseRepository.findById(caseId)
        .orElseThrow(() -> new EntityNotFoundException("Case not found: " + caseId));

    CaseSummaryDraft d = draftRepository.findByIdAndTheCaseId(draftId, caseId)
        .orElseThrow(() -> new EntityNotFoundException("Draft not found: " + draftId + " for case " + caseId));

    if (d.getStatus() != DraftStatus.DRAFT) {
      throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Draft not reviewable");
    }
    if (d.getGenerationStatus() != GenerationStatus.COMPLETED) {
      throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Draft not ready");
    }
    if (Instant.now().isAfter(d.getExpiresAt())) {
      d.setStatus(DraftStatus.EXPIRED);
      draftRepository.save(d);
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

    // Apply to official case record (human-approved action)
    c.setSummaryText(d.getContentText());
    c.setUpdatedAt(Instant.now());
    caseRepository.save(c);

    d.setStatus(DraftStatus.ACCEPTED);
    d.setReviewedAt(Instant.now());
    d.setReviewedBy("user"); // replace later with your auth principal
    draftRepository.save(d);

    recordEvent(c, EventType.SUMMARY_ACCEPTED, "Summary accepted",
        "{\"draftId\":" + d.getId() + ",\"acknowledgeStale\":" + ack + "}");

    return CaseDto.fromEntity(c);
  }

  @Transactional
  public CaseSummaryDraftDto reject(Long caseId, Long draftId, RejectSummaryDraftRequest req) {
    CaseEntity c = caseRepository.findById(caseId)
        .orElseThrow(() -> new EntityNotFoundException("Case not found: " + caseId));

    CaseSummaryDraft d = draftRepository.findByIdAndTheCaseId(draftId, caseId)
        .orElseThrow(() -> new EntityNotFoundException("Draft not found: " + draftId + " for case " + caseId));

    if (d.getStatus() != DraftStatus.DRAFT) {
      throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Draft not reviewable");
    }

    d.setStatus(DraftStatus.REJECTED);
    d.setReviewedAt(Instant.now());
    d.setReviewedBy("user"); // replace later with your auth principal
    draftRepository.save(d);

    String payload = "{\"draftId\":" + d.getId() +
        ",\"reasonCode\":\"" + safe(req != null ? req.reasonCode : "OTHER") + "\"}";

    recordEvent(c, EventType.SUMMARY_REJECTED, "Summary rejected", payload);

    // Return current view
    return getDraft(caseId, draftId);
  }

  private void recordEvent(CaseEntity c, EventType type, String message, String payloadJson) {
    CaseEvent ev = new CaseEvent();
    ev.setTheCase(c);
    ev.setType(type);
    ev.setMessage(message);
    ev.setPayloadJson(payloadJson);
    eventRepository.save(ev);
  }

  private static String safe(String s) {
    return (s == null) ? "" : s.replace("\"", "'");
  }

  private static String sha256(String input) {
    try {
      MessageDigest md = MessageDigest.getInstance("SHA-256");
      byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
      return "sha256:" + HexFormat.of().formatHex(hash);
    } catch (Exception e) {
      return "sha256:unavailable";
    }
  }

  public record CreateDraftResponse(
      Long draftId,
      DraftStatus status,
      GenerationStatus generationStatus,
      String pollUrl
  ) {}
}
