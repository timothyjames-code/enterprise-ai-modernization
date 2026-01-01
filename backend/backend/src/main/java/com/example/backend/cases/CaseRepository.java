package com.example.backend.cases;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CaseRepository extends JpaRepository<CaseEntity, Long> {
  Page<CaseEntity> findByTitleContainingIgnoreCase(String title, Pageable pageable);

  // ✅ Use CONTAINING instead of exact match
  Page<CaseEntity> findByStatusContainingIgnoreCase(String status, Pageable pageable);

  Page<CaseEntity> findByTitleContainingIgnoreCaseAndStatusContainingIgnoreCase(
      String title,
      String status,
      Pageable pageable
  );
}
