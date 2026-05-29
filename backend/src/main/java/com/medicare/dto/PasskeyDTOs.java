package com.medicare.dto;

import lombok.*;

/**
 * PasskeyDTOs.java
 * ─────────────────
 * DTOs used by the WebAuthn / Passkey endpoints.
 *
 * REGISTRATION FLOW (two round-trips):
 *   1. POST /api/auth/passkey/register/start
 *        ← { email }
 *        → PasskeyRegistrationOptionsResponse   (challenge + RP info)
 *   2. POST /api/auth/passkey/register/finish
 *        ← PasskeyRegistrationRequest           (authenticator response)
 *        → success / error message
 *
 * AUTHENTICATION FLOW (two round-trips):
 *   1. POST /api/auth/passkey/auth/start
 *        ← { email }
 *        → PasskeyAuthOptionsResponse           (challenge + allowed keys)
 *   2. POST /api/auth/passkey/auth/finish
 *        ← PasskeyAuthRequest                   (authenticator assertion)
 *        → LoginResponse (JWT token)
 */
public class PasskeyDTOs {

    // ─── REGISTRATION ────────────────────────────────────────────────────────

    /** Step 1 – client sends the admin's email to start registration */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PasskeyRegStartRequest {
        private String email;
    }

    /**
     * Step 1 – server replies with the PublicKeyCredentialCreationOptions
     * that the browser passes to navigator.credentials.create().
     *
     * We send the minimum required fields; the browser fills in the rest.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PasskeyRegOptionsResponse {
        private String challenge;           // Base64url-encoded random bytes
        private RpInfo rp;                  // Relying-party info
        private UserInfo user;              // User info for the key
        private String timeout;             // milliseconds as string
        private String attestation;         // "none" for simplicity
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RpInfo {
        private String id;      // your domain, e.g. "localhost"
        private String name;    // display name
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private String id;          // Base64url-encoded admin ID
        private String name;        // admin email
        private String displayName; // admin name
    }

    /**
     * Step 2 – client sends back what navigator.credentials.create() returned.
     * All byte arrays are Base64url-encoded strings.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PasskeyRegFinishRequest {
        private String email;
        private String credentialId;      // Base64url
        private String clientDataJSON;    // Base64url
        private String attestationObject; // Base64url
    }

    // ─── AUTHENTICATION ───────────────────────────────────────────────────────

    /** Step 1 – client sends the admin's email to start authentication */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PasskeyAuthStartRequest {
        private String email;
    }

    /**
     * Step 1 – server replies with PublicKeyCredentialRequestOptions
     * that the browser passes to navigator.credentials.get().
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PasskeyAuthOptionsResponse {
        private String challenge;                   // Base64url random bytes
        private String timeout;
        private String rpId;
        private java.util.List<AllowedCredential> allowCredentials;
        private String userVerification;            // "required"
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AllowedCredential {
        private String type;    // always "public-key"
        private String id;      // Base64url credential ID
    }

    /**
     * Step 2 – client sends back what navigator.credentials.get() returned.
     * All byte arrays are Base64url strings.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PasskeyAuthFinishRequest {
        private String email;
        private String credentialId;
        private String clientDataJSON;
        private String authenticatorData;
        private String signature;
        private String userHandle;          // may be null
    }
}
