package com.example.backend.cases;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CaseNoteRepository extends JpaRepository<CaseNote, Long> {
  List<CaseNote> findByTheCaseIdOrderByCreatedAtDesc(Long caseId);
}
