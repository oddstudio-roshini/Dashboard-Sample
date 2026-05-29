package com.medicare.service;

import com.medicare.config.JwtUtil;
import com.medicare.dto.DTOs.*;
import com.medicare.entity.Admin;
import com.medicare.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * AuthService.java (Service)
 * ───────────────────────────
 * Business logic for authentication.
 *
 * login(LoginRequest):
 *   1. Delegates to Spring Security's AuthenticationManager
 *      which verifies email + password against the database.
 *   2. On success, generates a JWT token using JwtUtil.
 *   3. Returns LoginResponse with the token + admin info.
 *   4. Throws RuntimeException on invalid credentials (caught by controller).
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final AdminRepository adminRepository;
    private final JwtUtil jwtUtil;

    public LoginResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(), request.getPassword()
                    )
            );
        } catch (AuthenticationException e) {
            throw new RuntimeException("Invalid email or password");
        }

        Admin admin = adminRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        admin.setLastLogin(LocalDateTime.now());

        adminRepository.save(admin);


        String token = jwtUtil.generateToken(admin.getEmail());

        return LoginResponse.builder()
                .token(token)
                .adminName(admin.getName())
                .adminEmail(admin.getEmail())
                .role(admin.getRole())
                .build();
    }

    /** Returns true if the given email + password are valid credentials. */
    public boolean verifyPassword(String email, String password) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );
            return true;
        } catch (AuthenticationException e) {
            return false;
        }
    }
}
