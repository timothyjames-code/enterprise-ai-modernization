package com.example.backend.cases;

import com.example.backend.cases.dto.ActivityItemDto;
import com.example.backend.cases.dto.CreateNoteRequest;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class CaseActivityService {

  private final CaseRepository caseRepository;
  private final CaseNoteRepository noteRepository;
  private final CaseEventRepository eventRepository;
  private final CaseAuditService auditService;
  private final ObjectMapper objectMapper;

  public CaseActivityService(
      CaseRepository caseRepository,
      CaseNoteRepository noteRepository,
      CaseEventRepository eventRepository,
      CaseAuditService auditService,
      ObjectMapper objectMapper
  ) {
    this.caseRepository = caseRepository;
    this.noteRepository = noteRepository;
    this.eventRepository = eventRepository;
    this.auditService = auditService;
    this.objectMapper = objectMapper;
  }

  @Transactional(readOnly = true)
  public List<ActivityItemDto> getActivity(Long caseId) {
    if (!caseRepository.existsById(caseId)) {
      throw new EntityNotFoundException("Case not found: " + caseId);
    }

    var notes = noteRepository.findByTheCaseIdOrderByCreatedAtDesc(caseId);
    var events = eventRepository.findByTheCaseIdOrderByCreatedAtDesc(caseId);

    List<ActivityItemDto> out = new ArrayList<>(notes.size() + events.size());

    for (CaseEvent e : events) {
      out.add(ActivityItemDto.event(
          e.getId(),
          e.getCreatedAt(),
          e.getType(),
          e.getMessage(),
          e.getPayloadJson()
      ));
    }

    for (CaseNote n : notes) {
      out.add(ActivityItemDto.note(
          n.getId(),
          n.getCreatedAt(),
          n.getBody()
      ));
    }

    out.sort(Comparator.comparing((ActivityItemDto x) -> x.createdAt).reversed());
    return out;
  }

  @Transactional
  public void addNote(Long caseId, CreateNoteRequest req) {
    CaseEntity c = caseRepository.findById(caseId)
        .orElseThrow(() -> new EntityNotFoundException("Case not found: " + caseId));

    CaseNote note = new CaseNote();
    note.setTheCase(c);
    note.setBody(req.body.trim());
    noteRepository.save(note);

    auditService.record(
        c,
        EventType.NOTE_ADDED,
        "Note added",
        null,
        AuditActor.system("case-service"),
        null
    );

    touchCase(c);
  }

  @Transactional
  public void updateNote(Long caseId, Long noteId, CreateNoteRequest req) {
    CaseEntity c = caseRepository.findById(caseId)
        .orElseThrow(() -> new EntityNotFoundException("Case not found: " + caseId));

    CaseNote note = noteRepository.findByIdAndTheCaseId(noteId, caseId)
        .orElseThrow(() -> new EntityNotFoundException("Note not found: " + noteId + " for case " + caseId));

    note.setBody(req.body.trim());
    noteRepository.save(note);

    auditService.record(
        c,
        EventType.NOTE_UPDATED,
        "Note updated",
        jsonPayload(Map.of("noteId", noteId)),
        AuditActor.system("case-service"),
        null
    );

    touchCase(c);
  }

  @Transactional
  public void deleteNote(Long caseId, Long noteId) {
    CaseEntity c = caseRepository.findById(caseId)
        .orElseThrow(() -> new EntityNotFoundException("Case not found: " + caseId));

    CaseNote note = noteRepository.findByIdAndTheCaseId(noteId, caseId)
        .orElseThrow(() -> new EntityNotFoundException("Note not found: " + noteId + " for case " + caseId));

    noteRepository.delete(note);

    auditService.record(
        c,
        EventType.NOTE_DELETED,
        "Note deleted",
        jsonPayload(Map.of("noteId", noteId)),
        AuditActor.system("case-service"),
        null
    );

    touchCase(c);
  }

  // --- helpers ---

  private void touchCase(CaseEntity c) {
    c.setUpdatedAt(Instant.now());
    caseRepository.save(c);
  }

  private String jsonPayload(Map<String, Object> payload) {
    if (payload == null) return null;
    try {
      return objectMapper.writeValueAsString(payload);
    } catch (JsonProcessingException e) {
      return null;
    }
  }
}
