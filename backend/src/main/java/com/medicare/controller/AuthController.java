package com.medicare.controller;

import com.medicare.dto.DTOs.*;
import com.medicare.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * AuthController.java (Controller)
 * ──────────────────────────────────
 * REST controller for authentication endpoints.
 *
 * POST /api/auth/login
 *   → Accepts { email, password } in request body
 *   → Returns JWT token + admin info on success
 *   → Returns 401 Unauthorized on invalid credentials
 *
 * This endpoint is publicly accessible (no JWT required).
 * All other /api/** endpoints require "Authorization: Bearer <token>".
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.login(request);
            return ResponseEntity.ok(ApiResponse.success("Login successful", response));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /** Verify the current admin's password without issuing a new token.
     *  Used by the frontend before destructive actions (delete / publish). */
    @PostMapping("/verify-password")
    public ResponseEntity<ApiResponse<Boolean>> verifyPassword(
            @RequestBody LoginRequest request) {
        boolean valid = authService.verifyPassword(request.getEmail(), request.getPassword());
        if (valid) {
            return ResponseEntity.ok(ApiResponse.success("Password verified", true));
        } else {
            return ResponseEntity.status(401).body(ApiResponse.error("Incorrect password"));
        }
    }
}
