package com.example.backend.common;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

// Spring 6.1+ (Boot 3.2+/4.x) may throw this for method validation
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
    // This exception structure is different; simplest reliable output:
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

  // Optional: if you throw IllegalArgumentException anywhere, make it a 400 not a 500
  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
    return ResponseEntity.badRequest().body(Map.of(
        "message", ex.getMessage()
    ));
  }
}
