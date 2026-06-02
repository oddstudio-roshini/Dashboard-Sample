package com.medicare.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntime(RuntimeException ex) {
        String message = ex.getMessage() != null ? ex.getMessage() : "Internal server error";

        // "not found" errors → 404 (e.g. "Patient not found: 261746", "Doctor not found with id: 5")
        if (message.toLowerCase().contains("not found")) {
            log.warn("Resource not found: {}", message);
            return ResponseEntity.status(404).body(Map.of("error", message, "message", message));
        }

        log.error("Unhandled runtime exception: {}", ex.getMessage(), ex);
        return ResponseEntity.status(500).body(Map.of("error", message, "message", message));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneric(Exception ex) {
        log.error("Unhandled exception: {}", ex.getMessage(), ex);
        return ResponseEntity.status(500).body(Map.of("error", "Internal server error", "message", "Internal server error"));
    }
}
