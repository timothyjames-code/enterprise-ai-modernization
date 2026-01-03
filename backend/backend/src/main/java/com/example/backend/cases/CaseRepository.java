package com.example.backend.cases;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CaseRepository extends JpaRepository<CaseEntity, Long> {

  Page<CaseEntity> findByTitleContainingIgnoreCase(String search, Pageable pageable);

  Page<CaseEntity> findByStatusContainingIgnoreCase(String status, Pageable pageable);

  Page<CaseEntity> findByTitleContainingIgnoreCaseAndStatusContainingIgnoreCase(
      String search,
      String status,
      Pageable pageable
  );
}
