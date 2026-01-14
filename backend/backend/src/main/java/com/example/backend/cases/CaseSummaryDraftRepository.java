package com.example.backend.cases;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface CaseSummaryDraftRepository extends JpaRepository<CaseSummaryDraft, Long> {

  List<CaseSummaryDraft> findByTheCaseIdAndPurposeAndStatus(
      Long caseId,
      SummaryPurpose purpose,
      DraftStatus status
  );

  Optional<CaseSummaryDraft> findByIdAndTheCaseId(Long draftId, Long caseId);

  // ✅ REQUIRED for case deletion
  @Transactional
  void deleteByTheCaseId(Long caseId);
}
