package com.example.backend.cases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class CaseAuditService {

  private final CaseEventRepository eventRepository;

  public CaseAuditService(CaseEventRepository eventRepository) {
    this.eventRepository = eventRepository;
  }

  /**
   * Append-only, hash-chained audit event (per-case chain).
   * Call within the same transaction as the domain change it records.
   */
  @Transactional
  public CaseEvent record(
      CaseEntity c,
      EventType type,
      String message,
      String payloadJson,
      AuditActor actor,
      String correlationId
  ) {
    String prevHash = eventRepository
        .findFirstByTheCase_IdOrderByIdDesc(c.getId())
        .map(CaseEvent::getEventHash)
        .orElse(null);

    CaseEvent ev = new CaseEvent();
    ev.setTheCase(c);
    ev.setType(type);
    ev.setMessage(message);
    ev.setPayloadJson(payloadJson);

    ev.setActorType(actor.actorType());
    ev.setActorId(actor.actorId());
    ev.setActorRole(actor.actorRole());
    ev.setCorrelationId(correlationId);

    ev.setPrevEventHash(prevHash);

    // Set createdAt before hashing so the hash commits to the timestamp
    ev.setCreatedAt(Instant.now());

    ev.setEventHash(AuditHashing.sha256Hex(canonicalize(ev)));

    return eventRepository.save(ev);
  }

  private String canonicalize(CaseEvent ev) {
    // Stable, versioned canonical string. Changing this is an ADR-worthy event.
    return String.join("|",
        "v1",
        AuditHashing.safe(ev.getPrevEventHash()),
        "caseId=" + ev.getTheCase().getId(),
        "type=" + ev.getType().name(),
        "actorType=" + AuditHashing.safe(ev.getActorType()),
        "actorId=" + AuditHashing.safe(ev.getActorId()),
        "actorRole=" + AuditHashing.safe(ev.getActorRole()),
        "correlationId=" + AuditHashing.safe(ev.getCorrelationId()),
        "createdAt=" + AuditHashing.iso(ev.getCreatedAt()),
        "message=" + AuditHashing.safe(ev.getMessage()),
        "payload=" + AuditHashing.safe(ev.getPayloadJson())
    );
  }
}
