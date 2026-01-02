package com.example.backend.cases.dto;

import com.example.backend.cases.EventType;
import java.time.Instant;

public class ActivityItemDto {
  public String kind;            // "event" | "note"
  public Long id;
  public Instant createdAt;

  // Event fields
  public EventType type;         // only for kind="event"
  public String message;         // only for kind="event"
  public String payloadJson;     // only for kind="event"

  // Note fields
  public String body;            // only for kind="note"

  public static ActivityItemDto event(Long id, Instant createdAt, EventType type, String message, String payloadJson) {
    ActivityItemDto dto = new ActivityItemDto();
    dto.kind = "event";
    dto.id = id;
    dto.createdAt = createdAt;
    dto.type = type;
    dto.message = message;
    dto.payloadJson = payloadJson;
    return dto;
  }

  public static ActivityItemDto note(Long id, Instant createdAt, String body) {
    ActivityItemDto dto = new ActivityItemDto();
    dto.kind = "note";
    dto.id = id;
    dto.createdAt = createdAt;
    dto.body = body;
    return dto;
  }
}
