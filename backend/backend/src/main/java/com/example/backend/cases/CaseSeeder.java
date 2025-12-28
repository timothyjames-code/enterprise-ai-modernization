package com.example.backend.cases;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class CaseSeeder implements CommandLineRunner {
  private final CaseRepository repo;

  public CaseSeeder(CaseRepository repo) {
    this.repo = repo;
  }

  @Override
  public void run(String... args) {
    if (repo.count() == 0) {
      repo.save(new CaseEntity("Medication reconciliation issue", "Open"));
      repo.save(new CaseEntity("Prior auth appeal", "In Review"));
      repo.save(new CaseEntity("Adverse event follow-up", "Closed"));
    }
  }
}
