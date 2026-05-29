package com.medicare.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * AdminPasskey.java (Entity)
 * ───────────────────────────
 * Stores a WebAuthn / Passkey credential for an Admin.
 *
 * One admin can have multiple passkeys (e.g. laptop + phone).
 *
 * Fields:
 *   credentialId   – Base64url-encoded credential ID returned by the
 *                    authenticator during registration.  Used as the
 *                    lookup key during authentication.
 *   publicKeyCose  – COSE-encoded public key bytes (stored as Base64).
 *                    Verified against the authenticator's signature on
 *                    every login.
 *   signCount      – Monotonically increasing counter.  We check that
 *                    the new count is > the stored count to detect
 *                    cloned authenticators.
 *   aaguid         – Authenticator Attestation GUID (identifies the
 *                    make/model of the authenticator, optional).
 *   createdAt      – When the passkey was registered.
 *   lastUsedAt     – Updated on every successful login with this key.
 */
@Entity
@Table(name = "admin_passkeys")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminPasskey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The Admin that owns this passkey */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id", nullable = false)
    private Admin admin;

    /** Base64url-encoded credential ID – must be unique globally */
    @Column(nullable = false, unique = true, length = 512)
    private String credentialId;

    /** Base64-encoded COSE public key */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String publicKeyCose;

    /** Signature counter – starts at 0 */
    @Column(nullable = false)
    @Builder.Default
    private long signCount = 0L;

    /** Optional: AAGUID of the authenticator (UUID string) */
    @Column(length = 36)
    private String aaguid;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime lastUsedAt;
}
