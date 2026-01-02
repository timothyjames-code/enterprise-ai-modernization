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

  @Column(nullable = false)
  private String message;

  // Optional structured details; keep as JSON string for now (simple + H2-friendly)
  @Lob
  private String payloadJson;

  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void onCreate() {
    if (createdAt == null) createdAt = Instant.now();
  }

  public Long getId() { return id; }

  public CaseEntity getTheCase() { return theCase; }
  public void setTheCase(CaseEntity theCase) { this.theCase = theCase; }

  public EventType getType() { return type; }
  public void setType(EventType type) { this.type = type; }

  public String getMessage() { return message; }
  public void setMessage(String message) { this.message = message; }

  public String getPayloadJson() { return payloadJson; }
  public void setPayloadJson(String payloadJson) { this.payloadJson = payloadJson; }

  public Instant getCreatedAt() { return createdAt; }
}
