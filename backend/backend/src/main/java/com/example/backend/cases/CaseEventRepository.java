package com.example.backend.cases;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CaseEventRepository extends JpaRepository<CaseEvent, Long> {

  List<CaseEvent> findByTheCaseIdOrderByCreatedAtDesc(Long caseId);

  // ✅ CORRECT: traverse theCase.id
  Optional<CaseEvent> findFirstByTheCase_IdOrderByIdDesc(Long caseId);
}
