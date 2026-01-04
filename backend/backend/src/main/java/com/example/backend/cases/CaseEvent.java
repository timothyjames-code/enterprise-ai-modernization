package com.example.backend.cases;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "case_events")
public class CaseEvent {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "case_id", nullable = false)
  private CaseEntity theCase;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private EventType type;

  @Column(nullable = false, length = 500)
  private String message;

  // Structured details (JSON)
  @Lob
  private String payloadJson;

  // =========================
  // Actor attribution
  // =========================

  @Column(nullable = false, length = 20)
  private String actorType; // USER | SYSTEM

  @Column(nullable = false, length = 200)
  private String actorId; // userId or service principal

  @Column(length = 100)
  private String actorRole; // snapshot of role at time of action

  // =========================
  // Correlation / tracing
  // =========================

  @Column(length = 80)
  private String correlationId;

  // =========================
  // Hash chain (tamper evidence)
  // =========================

  @Column(length = 64)
  private String prevEventHash;

  @Column(nullable = false, length = 64)
  private String eventHash;

  // =========================
  // Timestamps
  // =========================

  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void onCreate() {
    if (createdAt == null) {
      createdAt = Instant.now();
    }
  }

  // Getters only for immutable fields where possible

  public Long getId() { return id; }

  public CaseEntity getTheCase() { return theCase; }
  public void setTheCase(CaseEntity theCase) { this.theCase = theCase; }

  public EventType getType() { return type; }
  public void setType(EventType type) { this.type = type; }

  public String getMessage() { return message; }
  public void setMessage(String message) { this.message = message; }

  public String getPayloadJson() { return payloadJson; }
  public void setPayloadJson(String payloadJson) { this.payloadJson = payloadJson; }

  public String getActorType() { return actorType; }
  public void setActorType(String actorType) { this.actorType = actorType; }

  public String getActorId() { return actorId; }
  public void setActorId(String actorId) { this.actorId = actorId; }

  public String getActorRole() { return actorRole; }
  public void setActorRole(String actorRole) { this.actorRole = actorRole; }

  public String getCorrelationId() { return correlationId; }
  public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }

  public String getPrevEventHash() { return prevEventHash; }
  public void setPrevEventHash(String prevEventHash) { this.prevEventHash = prevEventHash; }

  public String getEventHash() { return eventHash; }
  public void setEventHash(String eventHash) { this.eventHash = eventHash; }

  public Instant getCreatedAt() { return createdAt; }

public void setCreatedAt(Instant createdAt) {
  this.createdAt = createdAt;
}
}
