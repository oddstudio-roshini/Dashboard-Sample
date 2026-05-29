package com.medicare.controller;

import com.medicare.dto.DTOs.ApiResponse;
import com.medicare.dto.DTOs.LoginResponse;
import com.medicare.dto.PasskeyDTOs.*;
import com.medicare.service.PasskeyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * PasskeyController.java
 * ───────────────────────
 * REST controller for WebAuthn / Passkey endpoints.
 *
 * All routes are under /api/auth/passkey and are publicly accessible
 * (no JWT required – same as /api/auth/login).  Add them to SecurityConfig.
 *
 * REGISTRATION (admin must be logged in via password first):
 *   POST /api/auth/passkey/register/start   ← { email }
 *   POST /api/auth/passkey/register/finish  ← PasskeyRegFinishRequest
 *
 * AUTHENTICATION (passwordless):
 *   POST /api/auth/passkey/auth/start       ← { email }
 *   POST /api/auth/passkey/auth/finish      ← PasskeyAuthFinishRequest → JWT
 */
@RestController
@RequestMapping("/api/auth/passkey")
@RequiredArgsConstructor
public class
PasskeyController {

    private final PasskeyService passkeyService;

    // ── REGISTRATION ─────────────────────────────────────────────────────────

    @PostMapping("/register/start")
    public ResponseEntity<ApiResponse<PasskeyRegOptionsResponse>> registrationStart(
            @RequestBody PasskeyRegStartRequest request) {
        try {
            PasskeyRegOptionsResponse options = passkeyService.startRegistration(request.getEmail());
            return ResponseEntity.ok(ApiResponse.success("Registration options generated", options));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/register/finish")
    public ResponseEntity<ApiResponse<Void>> registrationFinish(
            @RequestBody PasskeyRegFinishRequest request) {
        try {
            passkeyService.finishRegistration(request);
            return ResponseEntity.ok(ApiResponse.success("Passkey registered successfully", null));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ── AUTHENTICATION ────────────────────────────────────────────────────────

    @PostMapping("/auth/start")
    public ResponseEntity<ApiResponse<PasskeyAuthOptionsResponse>> authStart(
            @RequestBody PasskeyAuthStartRequest request) {
        try {
            PasskeyAuthOptionsResponse options = passkeyService.startAuthentication(request.getEmail());
            return ResponseEntity.ok(ApiResponse.success("Authentication options generated", options));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/auth/finish")
    public ResponseEntity<ApiResponse<LoginResponse>> authFinish(
            @RequestBody PasskeyAuthFinishRequest request) {
        try {
            LoginResponse loginResponse = passkeyService.finishAuthentication(request);
            return ResponseEntity.ok(ApiResponse.success("Login successful", loginResponse));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(ApiResponse.error(e.getMessage()));
        }
    }
}
