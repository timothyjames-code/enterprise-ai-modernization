package com.example.backend.cases;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "case_summary_drafts")
public class CaseSummaryDraft {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "case_id", nullable = false)
  private CaseEntity theCase;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private SummaryPurpose purpose = SummaryPurpose.INTERNAL_CASE_OVERVIEW;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private DraftStatus status = DraftStatus.DRAFT;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private GenerationStatus generationStatus = GenerationStatus.COMPLETED;

  // Staleness anchor (compares to CaseEntity.updatedAt at accept time)
  @Column(nullable = false)
  private Instant sourceUpdatedAt;

  @Column(nullable = false, length = 128)
  private String inputFingerprint;

  @Column(columnDefinition = "TEXT")
  private String contentText;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  private Instant reviewedAt;

  @Column(length = 200)
  private String reviewedBy;

  @Column(nullable = false)
  private Instant expiresAt;

  public Long getId() { return id; }

  public CaseEntity getTheCase() { return theCase; }
  public void setTheCase(CaseEntity theCase) { this.theCase = theCase; }

  public SummaryPurpose getPurpose() { return purpose; }
  public void setPurpose(SummaryPurpose purpose) { this.purpose = purpose; }

  public DraftStatus getStatus() { return status; }
  public void setStatus(DraftStatus status) { this.status = status; }

  public GenerationStatus getGenerationStatus() { return generationStatus; }
  public void setGenerationStatus(GenerationStatus generationStatus) { this.generationStatus = generationStatus; }

  public Instant getSourceUpdatedAt() { return sourceUpdatedAt; }
  public void setSourceUpdatedAt(Instant sourceUpdatedAt) { this.sourceUpdatedAt = sourceUpdatedAt; }

  public String getInputFingerprint() { return inputFingerprint; }
  public void setInputFingerprint(String inputFingerprint) { this.inputFingerprint = inputFingerprint; }

  public String getContentText() { return contentText; }
  public void setContentText(String contentText) { this.contentText = contentText; }

  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

  public Instant getReviewedAt() { return reviewedAt; }
  public void setReviewedAt(Instant reviewedAt) { this.reviewedAt = reviewedAt; }

  public String getReviewedBy() { return reviewedBy; }
  public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }

  public Instant getExpiresAt() { return expiresAt; }
  public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
}
