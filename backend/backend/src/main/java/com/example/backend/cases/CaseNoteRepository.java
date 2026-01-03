package com.example.backend.cases;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CaseNoteRepository extends JpaRepository<CaseNote, Long> {

  List<CaseNote> findByTheCaseIdOrderByCreatedAtDesc(Long caseId);

  // ✅ for edit/delete safety: guarantees the note belongs to the case
  Optional<CaseNote> findByIdAndTheCaseId(Long id, Long caseId);
}
