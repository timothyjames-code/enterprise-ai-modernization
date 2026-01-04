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

  // =========================
  // ADR-0001: Generation provenance (immutable after creation)
  // =========================

  @Column(nullable = false, length = 120)
  private String promptTemplateId;

  @Column(nullable = false)
  private Integer promptTemplateVersion;

  // SHA-256 hex (64 chars)
  @Column(nullable = false, length = 64)
  private String promptHash;

  @Column(nullable = false, length = 40)
  private String modelProvider; // LEGACY / OPENAI / AZURE_OPENAI

  @Column(nullable = false, length = 120)
  private String modelId;

  @Column(columnDefinition = "TEXT")
  private String modelConfigJson;

  @Column(nullable = false, length = 50)
  private String generationPolicyVersion;

  // SHA-256 hex (64 chars) of contentText
  @Column(nullable = false, length = 64)
  private String outputHash;

  // system principal (service identity)
  @Column(nullable = false, length = 200)
  private String createdBy;

  @Column(length = 80)
  private String correlationId;

  // =========================

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

  public String getPromptTemplateId() { return promptTemplateId; }
  public void setPromptTemplateId(String promptTemplateId) { this.promptTemplateId = promptTemplateId; }

  public Integer getPromptTemplateVersion() { return promptTemplateVersion; }
  public void setPromptTemplateVersion(Integer promptTemplateVersion) { this.promptTemplateVersion = promptTemplateVersion; }

  public String getPromptHash() { return promptHash; }
  public void setPromptHash(String promptHash) { this.promptHash = promptHash; }

  public String getModelProvider() { return modelProvider; }
  public void setModelProvider(String modelProvider) { this.modelProvider = modelProvider; }

  public String getModelId() { return modelId; }
  public void setModelId(String modelId) { this.modelId = modelId; }

  public String getModelConfigJson() { return modelConfigJson; }
  public void setModelConfigJson(String modelConfigJson) { this.modelConfigJson = modelConfigJson; }

  public String getGenerationPolicyVersion() { return generationPolicyVersion; }
  public void setGenerationPolicyVersion(String generationPolicyVersion) { this.generationPolicyVersion = generationPolicyVersion; }

  public String getOutputHash() { return outputHash; }
  public void setOutputHash(String outputHash) { this.outputHash = outputHash; }

  public String getCreatedBy() { return createdBy; }
  public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

  public String getCorrelationId() { return correlationId; }
  public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }

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
