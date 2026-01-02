package com.example.backend.cases;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "case_notes")
public class CaseNote {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "case_id", nullable = false)
  private CaseEntity theCase;

  @Lob
  @Column(nullable = false)
  private String body;

  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void onCreate() {
    if (createdAt == null) createdAt = Instant.now();
  }

  public Long getId() { return id; }

  public CaseEntity getTheCase() { return theCase; }
  public void setTheCase(CaseEntity theCase) { this.theCase = theCase; }

  public String getBody() { return body; }
  public void setBody(String body) { this.body = body; }

  public Instant getCreatedAt() { return createdAt; }
}
