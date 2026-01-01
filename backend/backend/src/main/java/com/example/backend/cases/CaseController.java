package com.example.backend.cases;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/cases")
public class CaseController {

  private static final int MAX_PAGE_SIZE = 50;

  private final CaseRepository repository;

  public CaseController(CaseRepository repository) {
    this.repository = repository;
  }

  @GetMapping
  public Page<CaseDto> list(
      @RequestParam(required = false) String search,
      @RequestParam(required = false) String status,
      @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
  ) {
    // Cap page size to prevent abuse / accidental huge requests
    if (pageable.getPageSize() > MAX_PAGE_SIZE) {
      pageable = PageRequest.of(pageable.getPageNumber(), MAX_PAGE_SIZE, pageable.getSort());
    }

    final String s = (search == null) ? "" : search.trim();
    final String st = (status == null) ? "" : status.trim();

    final boolean hasSearch = !s.isEmpty();
    final boolean hasStatus = !st.isEmpty();

    Page<CaseEntity> page;

  if (hasSearch && hasStatus) {
  page = repository.findByTitleContainingIgnoreCaseAndStatusContainingIgnoreCase(s, st, pageable);
} else if (hasSearch) {
  page = repository.findByTitleContainingIgnoreCase(s, pageable);
} else if (hasStatus) {
  page = repository.findByStatusContainingIgnoreCase(st, pageable);
} else {
  page = repository.findAll(pageable);
}

    return page.map(CaseDto::fromEntity);
  }

  @PostMapping
  public CaseDto create(@Valid @RequestBody CreateCaseRequest req) {
    var title = req.title().trim();
    var status = (req.status() == null || req.status().trim().isBlank())
        ? "Open"
        : req.status().trim();

    var saved = repository.save(new CaseEntity(title, status));
    return CaseDto.fromEntity(saved);
  }

  @PutMapping("/{id}")
  public ResponseEntity<CaseDto> update(@PathVariable Long id, @RequestBody UpdateCaseRequest req) {
    var existing = repository.findById(id).orElse(null);
    if (existing == null) return ResponseEntity.notFound().build();

    if (req.title() != null) {
      var title = req.title().trim();
      if (title.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "title is required");
      existing.setTitle(title);
    }

    if (req.status() != null) {
      var status = req.status().trim();
      if (status.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is required");
      existing.setStatus(status);
    }

    var saved = repository.save(existing);
    return ResponseEntity.ok(CaseDto.fromEntity(saved));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    if (!repository.existsById(id)) return ResponseEntity.notFound().build();
    repository.deleteById(id);
    return ResponseEntity.noContent().build();
  }
}
