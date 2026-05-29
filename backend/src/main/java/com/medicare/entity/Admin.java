package com.medicare.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Admin.java (Entity) — UPDATED for Passkey support
 * ─────────────────────────────────────────────────
 * Added:
 *   • passkeys  – one-to-many relationship to AdminPasskey.
 *   • password is now nullable so that a passkey-only admin
 *     (no legacy password) is valid.  Set it to null when the
 *     admin completes passkey setup and wants passwordless-only login.
 */
@Entity
@Table(name = "admins")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Admin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    /** BCrypt-hashed password. Nullable when the admin uses passkey only. */
    @Column
    private String password;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    @Builder.Default
    private String role = "ADMIN";

    private LocalDateTime lastLogin;

    /** All passkeys registered for this admin */
    @OneToMany(mappedBy = "admin", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<AdminPasskey> passkeys = new ArrayList<>();
}
