package com.example.backend.cases;

import jakarta.validation.Valid;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cases")
public class CaseController {

  private final CaseRepository repository;

  public CaseController(CaseRepository repository) {
    this.repository = repository;
  }

  @GetMapping
  public List<CaseDto> list() {
    return repository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
        .stream()
        .map(CaseDto::fromEntity)
        .toList();
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

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    if (!repository.existsById(id)) {
      return ResponseEntity.notFound().build();
    }
    repository.deleteById(id);
    return ResponseEntity.noContent().build();
  }
}
