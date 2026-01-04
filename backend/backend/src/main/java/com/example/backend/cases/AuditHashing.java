package com.example.backend.cases;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;

final class AuditHashing {
  private AuditHashing() {}

  static String sha256Hex(String input) {
    try {
      MessageDigest md = MessageDigest.getInstance("SHA-256");
      byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(hash);
    } catch (Exception e) {
      throw new IllegalStateException("SHA-256 unavailable", e);
    }
  }

  static String iso(Instant t) {
    return (t == null) ? "" : t.toString();
  }

  static String safe(String s) {
    return (s == null) ? "" : s;
  }
}
