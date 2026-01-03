package com.example.backend.common;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, Object>> handleBodyValidation(MethodArgumentNotValidException ex) {
    Map<String, String> fieldErrors = new HashMap<>();
    for (FieldError err : ex.getBindingResult().getFieldErrors()) {
      fieldErrors.put(err.getField(), err.getDefaultMessage());
    }

    return ResponseEntity.badRequest().body(Map.of(
        "message", "Validation failed",
        "errors", fieldErrors
    ));
  }

  @ExceptionHandler(HandlerMethodValidationException.class)
  public ResponseEntity<Map<String, Object>> handleMethodValidation(HandlerMethodValidationException ex) {
    return ResponseEntity.badRequest().body(Map.of(
        "message", "Validation failed",
        "errors", Map.of("request", "Invalid request")
    ));
  }

  @ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<Map<String, Object>> handleConstraintViolation(ConstraintViolationException ex) {
    return ResponseEntity.badRequest().body(Map.of(
        "message", "Validation failed",
        "errors", Map.of("request", ex.getMessage())
    ));
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
    return ResponseEntity.badRequest().body(Map.of(
        "message", ex.getMessage()
    ));
  }

  // ✅ NEW: map missing entities to 404 instead of 500
  @ExceptionHandler(EntityNotFoundException.class)
  public ResponseEntity<Map<String, Object>> handleNotFound(EntityNotFoundException ex) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
        "message", ex.getMessage()
    ));
  }
}
