package com.example.backend.cases;

public record AuditActor(
    String actorType, // USER | SYSTEM
    String actorId,
    String actorRole
) {
  public static AuditActor system(String serviceName) {
    return new AuditActor("SYSTEM", serviceName, null);
  }

  public static AuditActor user(String userId, String role) {
    return new AuditActor("USER", userId, role);
  }
}
