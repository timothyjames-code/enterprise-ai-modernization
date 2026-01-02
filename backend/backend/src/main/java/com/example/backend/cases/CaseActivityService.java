package com.example.backend.cases;

import com.example.backend.cases.dto.ActivityItemDto;
import com.example.backend.cases.dto.CreateNoteRequest;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class CaseActivityService {

  private final CaseRepository caseRepository;
  private final CaseNoteRepository noteRepository;
  private final CaseEventRepository eventRepository;

  public CaseActivityService(
      CaseRepository caseRepository,
      CaseNoteRepository noteRepository,
      CaseEventRepository eventRepository
  ) {
    this.caseRepository = caseRepository;
    this.noteRepository = noteRepository;
    this.eventRepository = eventRepository;
  }

  @Transactional(readOnly = true)
  public List<ActivityItemDto> getActivity(Long caseId) {
    // Ensure case exists
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

    // Sort newest-first
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

    CaseEvent ev = new CaseEvent();
    ev.setTheCase(c);
    ev.setType(EventType.NOTE_ADDED);
    ev.setMessage("Note added");
    ev.setPayloadJson(null);
    eventRepository.save(ev);
  }

  @Transactional
  public void recordEvent(CaseEntity c, EventType type, String message, String payloadJson) {
    CaseEvent ev = new CaseEvent();
    ev.setTheCase(c);
    ev.setType(type);
    ev.setMessage(message);
    ev.setPayloadJson(payloadJson);
    eventRepository.save(ev);
  }
}
