package com.example.backend.cases;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/cases")
public class CaseController {

  private final CaseRepository repository;

  public CaseController(CaseRepository repository) {
    this.repository = repository;
  }

  @GetMapping
  public List<CaseEntity> getCases() {
    return repository.findAll();
  }
}
