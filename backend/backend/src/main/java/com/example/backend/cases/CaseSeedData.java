package com.example.backend.cases;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.concurrent.ThreadLocalRandom;

@Component
public class CaseSeedData implements CommandLineRunner {

  private final CaseRepository repository;

  public CaseSeedData(CaseRepository repository) {
    this.repository = repository;
  }

  @Override
  public void run(String... args) {
    if (repository.count() > 0) return;

    String[] statuses = {"Open", "In Review", "Closed"};

    for (int i = 1; i <= 120; i++) {
      String status = statuses[ThreadLocalRandom.current().nextInt(statuses.length)];
      String title = "Case " + i + " - Sample title";
      repository.save(new CaseEntity(title, status));
    }
  }
}
