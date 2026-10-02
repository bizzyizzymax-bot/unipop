package com.unipop.market.exception;

import org.springframework.dao.InvalidDataAccessApiUsageException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class ExceptionHandler {

    /** Business rules (.edu only, 18+, 14-day locks, campus scoping, ownership ...). */
    @org.springframework.web.bind.annotation.ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, String>> handleApiException(ApiException e) {
        return ResponseEntity.status(e.getStatus()).body(error(e.getMessage()));
    }

    /** Bean validation failures - returns a readable message for the form. */
    @org.springframework.web.bind.annotation.ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(f -> f.getField() + ": " + f.getDefaultMessage())
                .orElse("Invalid request.");
        return ResponseEntity.badRequest().body(error(message));
    }

    /**
     * Hibernate's "The given id must not be null" (a null id reaching a repository)
     * - surface it as a readable 400 instead of a raw error.
     */
    @org.springframework.web.bind.annotation.ExceptionHandler(InvalidDataAccessApiUsageException.class)
    public ResponseEntity<Map<String, String>> handleInvalidId(InvalidDataAccessApiUsageException e) {
        String raw = e.getMessage() == null ? "" : e.getMessage();
        String message = raw.contains("must not be null")
                ? "The request is missing a required id."
                : "Invalid request.";
        return ResponseEntity.badRequest().body(error(message));
    }

    @org.springframework.web.bind.annotation.ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException e) {
        return new ResponseEntity<>(error(e.getMessage()), HttpStatus.NOT_FOUND);
    }

    private Map<String, String> error(String message) {
        Map<String, String> body = new HashMap<>();
        body.put("message", message == null ? "Unexpected error" : message);
        return body;
    }
}