package com.medicare.service;

import com.medicare.config.JwtUtil;
import com.medicare.dto.DTOs.LoginResponse;
import com.medicare.dto.PasskeyDTOs.*;
import com.medicare.entity.Admin;
import com.medicare.entity.AdminPasskey;
import com.medicare.repository.AdminPasskeyRepository;
import com.medicare.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.PublicKey;
import java.security.Signature;
import java.security.SecureRandom;
import java.security.spec.X509EncodedKeySpec;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * PasskeyService.java
 * ────────────────────
 * Implements a simplified WebAuthn (Passkey) registration and authentication
 * flow suitable for a single-admin backend.
 *
 * IMPORTANT SIMPLIFICATIONS (fine for internal admin tool):
 *   • We use "none" attestation – we don't verify the authenticator's
 *     attestation statement (only its signature on assertions).
 *   • Challenges are stored in memory (ConcurrentHashMap).  In production
 *     with multiple replicas you would store them in Redis or the DB.
 *   • COSE key parsing supports ES256 (P-256) only – the algorithm used
 *     by all modern platform authenticators (Touch ID, Windows Hello,
 *     Android).  RS256 support can be added if needed.
 *
 * WebAuthn spec references used:
 *   https://www.w3.org/TR/webauthn-2/
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PasskeyService {

    private final AdminRepository adminRepository;
    private final AdminPasskeyRepository passkeyRepository;
    private final JwtUtil jwtUtil;

    /** RP (Relying Party) settings – must match your domain */
    private static final String RP_ID   = "localhost";       // change to your domain in prod
    private static final String RP_NAME = "MediCare Admin";

    /** In-memory challenge store: email → Base64url challenge */
    private final ConcurrentHashMap<String, String> pendingChallenges = new ConcurrentHashMap<>();

    // ─────────────────────────────────────────────────────────────────────────
    // REGISTRATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Step 1 – Generate and return PublicKeyCredentialCreationOptions.
     * The challenge is stored server-side keyed by email.
     */
    public PasskeyRegOptionsResponse startRegistration(String email) {
        Admin admin = adminRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Admin not found: " + email));

        String challenge = generateChallenge();
        pendingChallenges.put("reg:" + email, challenge);

        return PasskeyRegOptionsResponse.builder()
                .challenge(challenge)
                .rp(RpInfo.builder().id(RP_ID).name(RP_NAME).build())
                .user(UserInfo.builder()
                        .id(base64url(longToBytes(admin.getId())))
                        .name(admin.getEmail())
                        .displayName(admin.getName())
                        .build())
                .timeout("60000")
                .attestation("none")
                .build();
    }

    /**
     * Step 2 – Verify the authenticator response and persist the credential.
     *
     * Checks performed:
     *   1. clientDataJSON.type == "webauthn.create"
     *   2. clientDataJSON.origin matches expected origin
     *   3. clientDataJSON.challenge matches stored challenge
     *   4. Credential ID is not already registered
     *   5. Extract public key from attestationObject (CBOR → COSE map)
     */
    @Transactional
    public void finishRegistration(PasskeyRegFinishRequest req) {
        String storedChallenge = pendingChallenges.remove("reg:" + req.getEmail());
        if (storedChallenge == null) throw new RuntimeException("No pending registration for this email");

        // Decode and verify clientDataJSON
        byte[] clientDataBytes = base64urlDecode(req.getClientDataJSON());
        String clientDataJson  = new String(clientDataBytes, StandardCharsets.UTF_8);
        verifyClientData(clientDataJson, storedChallenge, "webauthn.create");

        // Check credential uniqueness
        if (passkeyRepository.existsByCredentialId(req.getCredentialId())) {
            throw new RuntimeException("Credential already registered");
        }

        // Parse attestationObject (CBOR) to extract the public key
        byte[] attObjBytes  = base64urlDecode(req.getAttestationObject());
        byte[] publicKeyCose = extractPublicKeyFromAttestationObject(attObjBytes);

        Admin admin = adminRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        AdminPasskey passkey = AdminPasskey.builder()
                .admin(admin)
                .credentialId(req.getCredentialId())
                .publicKeyCose(Base64.getEncoder().encodeToString(publicKeyCose))
                .signCount(0L)
                .createdAt(LocalDateTime.now())
                .build();

        passkeyRepository.save(passkey);
        log.info("Passkey registered for admin {} – credentialId {}", req.getEmail(), req.getCredentialId());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AUTHENTICATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Step 1 – Generate and return PublicKeyCredentialRequestOptions.
     * Includes the list of allowed credential IDs for this admin.
     */
    public PasskeyAuthOptionsResponse startAuthentication(String email) {
        Admin admin = adminRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Admin not found: " + email));

        List<AdminPasskey> passkeys = passkeyRepository.findByAdminId(admin.getId());
        if (passkeys.isEmpty()) throw new RuntimeException("No passkeys registered for this admin");

        String challenge = generateChallenge();
        pendingChallenges.put("auth:" + email, challenge);

        List<AllowedCredential> allowed = passkeys.stream()
                .map(p -> AllowedCredential.builder()
                        .type("public-key")
                        .id(p.getCredentialId())
                        .build())
                .toList();

        return PasskeyAuthOptionsResponse.builder()
                .challenge(challenge)
                .timeout("60000")
                .rpId(RP_ID)
                .allowCredentials(allowed)
                .userVerification("required")
                .build();
    }

    /**
     * Step 2 – Verify the authenticator assertion and return a JWT.
     *
     * Checks performed:
     *   1. clientDataJSON.type == "webauthn.get"
     *   2. clientDataJSON.origin matches expected origin
     *   3. clientDataJSON.challenge matches stored challenge
     *   4. rpIdHash in authenticatorData matches SHA-256(RP_ID)
     *   5. User-present (UP) and user-verified (UV) flags are set
     *   6. signCount is greater than stored value (replay protection)
     *   7. Signature is valid over (authenticatorData || SHA-256(clientDataJSON))
     */
    @Transactional
    public LoginResponse finishAuthentication(PasskeyAuthFinishRequest req) {
        String storedChallenge = pendingChallenges.remove("auth:" + req.getEmail());
        if (storedChallenge == null) throw new RuntimeException("No pending authentication for this email");

        // 1-3: Verify clientDataJSON
        byte[] clientDataBytes = base64urlDecode(req.getClientDataJSON());
        String clientDataJson  = new String(clientDataBytes, StandardCharsets.UTF_8);
        verifyClientData(clientDataJson, storedChallenge, "webauthn.get");

        // Look up the credential
        AdminPasskey passkey = passkeyRepository.findByCredentialId(req.getCredentialId())
                .orElseThrow(() -> new RuntimeException("Unknown credential ID"));

        byte[] authData = base64urlDecode(req.getAuthenticatorData());

        // 4: Verify rpIdHash (first 32 bytes of authenticatorData)
        verifyRpIdHash(authData);

        // 5: Verify UP + UV flags (byte 32 of authenticatorData)
        byte flags = authData[32];
        if ((flags & 0x01) == 0) throw new RuntimeException("User Present flag not set");
        if ((flags & 0x04) == 0) throw new RuntimeException("User Verified flag not set");

        // 6: signCount (bytes 33-36, big-endian uint32)
        long newSignCount = ByteBuffer.wrap(authData, 33, 4).getInt() & 0xFFFFFFFFL;
        if (newSignCount != 0 && newSignCount <= passkey.getSignCount()) {
            throw new RuntimeException("Sign count mismatch – possible cloned authenticator");
        }

        // 7: Verify signature
        byte[] sig            = base64urlDecode(req.getSignature());
        byte[] clientDataHash = sha256(clientDataBytes);
        byte[] signedData     = concat(authData, clientDataHash);

        PublicKey publicKey = decodeCosePublicKey(
                Base64.getDecoder().decode(passkey.getPublicKeyCose()));
        verifySignature(publicKey, signedData, sig);

        // All checks passed – update state and return JWT
        passkey.setSignCount(newSignCount);
        passkey.setLastUsedAt(LocalDateTime.now());
        passkeyRepository.save(passkey);

        Admin admin = passkey.getAdmin();
        admin.setLastLogin(LocalDateTime.now());
        adminRepository.save(admin);

        String token = jwtUtil.generateToken(admin.getEmail());
        log.info("Passkey authentication successful for {}", admin.getEmail());

        return LoginResponse.builder()
                .token(token)
                .adminName(admin.getName())
                .adminEmail(admin.getEmail())
                .role(admin.getRole())
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /** Generates a cryptographically random 32-byte challenge in Base64url */
    private String generateChallenge() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return base64url(bytes);
    }

    /**
     * Parses the JSON clientDataJSON and verifies type, origin, and challenge.
     * We do a simple string-contains check to avoid pulling in a JSON library
     * dependency; the values are Base64url which cannot contain special chars.
     */
    private void verifyClientData(String json, String expectedChallenge, String expectedType) {
        if (!json.contains("\"type\":\"" + expectedType + "\"") &&
            !json.contains("\"type\": \"" + expectedType + "\"")) {
            throw new RuntimeException("Invalid clientData type");
        }
        // Challenge appears encoded in the JSON; compare raw bytes via inclusion
        if (!json.contains(expectedChallenge)) {
            throw new RuntimeException("Challenge mismatch");
        }
        // Origin check
        if (!json.contains("localhost")) {
            throw new RuntimeException("Origin mismatch – expected localhost");
        }
    }

    /** Verifies the first 32 bytes of authenticatorData equal SHA-256(RP_ID) */
    private void verifyRpIdHash(byte[] authData) {
        byte[] expected = sha256(RP_ID.getBytes(StandardCharsets.UTF_8));
        for (int i = 0; i < 32; i++) {
            if (authData[i] != expected[i]) {
                throw new RuntimeException("RP ID hash mismatch");
            }
        }
    }

    /**
     * Extracts the raw COSE public key bytes from the attestationObject.
     *
     * attestationObject is CBOR-encoded:
     *   { "fmt": "none", "attStmt": {}, "authData": <bytes> }
     *
     * authData layout:
     *   [0..31]  rpIdHash
     *   [32]     flags
     *   [33..36] signCount
     *   [37..52] aaguid (16 bytes)  – present when AT flag is set
     *   [53..54] credentialIdLength (big-endian uint16)
     *   [55..55+credentialIdLength-1]  credentialId
     *   [55+credentialIdLength ..]     COSE public key (CBOR map)
     *
     * We do a minimal CBOR parse to locate the authData bytes, then
     * extract the COSE key portion from authData.
     */
    private byte[] extractPublicKeyFromAttestationObject(byte[] attObjBytes) {
        try {
            // Minimal CBOR parse: locate the "authData" key and extract its byte-string value.
            byte[] authData = cborExtractAuthData(attObjBytes);

            // Parse authData to find the COSE public key offset
            int offset = 37; // skip rpIdHash(32) + flags(1) + signCount(4)
            // skip aaguid (16 bytes)
            offset += 16;
            // credentialIdLength
            int credIdLen = ((authData[offset] & 0xFF) << 8) | (authData[offset + 1] & 0xFF);
            offset += 2;
            // skip credentialId
            offset += credIdLen;
            // everything from here is the COSE key
            return Arrays.copyOfRange(authData, offset, authData.length);
        } catch (Exception e) {
            throw new RuntimeException("Failed to extract public key from attestationObject: " + e.getMessage(), e);
        }
    }

    /**
     * Minimal CBOR parser to extract the "authData" byte-string from an
     * attestationObject map.  Only handles the structure produced by real
     * WebAuthn authenticators (fmt=none).
     */
    private byte[] cborExtractAuthData(byte[] cbor) {
        // The attestationObject is a CBOR map with 3 entries.
        // We scan for the text key "authData" (0x68 61 75 74 68 44 61 74 61)
        // and then read the following byte-string value.
        byte[] keyBytes = new byte[]{0x68, 0x61, 0x75, 0x74, 0x68, 0x44, 0x61, 0x74, 0x61};
        for (int i = 0; i <= cbor.length - keyBytes.length; i++) {
            boolean match = true;
            for (int j = 0; j < keyBytes.length; j++) {
                if (cbor[i + j] != keyBytes[j]) { match = false; break; }
            }
            if (match) {
                // The next CBOR item is a byte-string (major type 2)
                int pos = i + keyBytes.length;
                int firstByte = cbor[pos] & 0xFF;
                int majorType = firstByte >> 5;
                if (majorType != 2) throw new RuntimeException("Expected byte-string after authData key");
                int additionalInfo = firstByte & 0x1F;
                pos++;
                int length;
                if (additionalInfo < 24) {
                    length = additionalInfo;
                } else if (additionalInfo == 24) {
                    length = cbor[pos++] & 0xFF;
                } else if (additionalInfo == 25) {
                    length = ((cbor[pos] & 0xFF) << 8) | (cbor[pos + 1] & 0xFF);
                    pos += 2;
                } else {
                    throw new RuntimeException("Unsupported CBOR length encoding");
                }
                return Arrays.copyOfRange(cbor, pos, pos + length);
            }
        }
        throw new RuntimeException("authData key not found in attestationObject");
    }

    /**
     * Decodes a COSE key (CBOR map) into a Java PublicKey.
     * Supports ES256 (-7) on P-256 curve only.
     *
     * COSE key map for EC2:
     *   1  → kty   (2 = EC2)
     *   3  → alg   (-7 = ES256)
     *  -1  → crv   (1 = P-256)
     *  -2  → x     (32 bytes)
     *  -3  → y     (32 bytes)
     */
    private PublicKey decodeCosePublicKey(byte[] coseBytes) {
        try {
            // Scan for x (-2) and y (-3) byte arrays in the CBOR map
            byte[] x = cborFindByteStringForNegativeKey(coseBytes, -2);
            byte[] y = cborFindByteStringForNegativeKey(coseBytes, -3);

            if (x == null || y == null) throw new RuntimeException("Could not find x/y in COSE key");

            // Build uncompressed EC point: 0x04 || x || y
            byte[] uncompressed = new byte[65];
            uncompressed[0] = 0x04;
            System.arraycopy(x, 0, uncompressed, 1, 32);
            System.arraycopy(y, 0, uncompressed, 33, 32);

            // Wrap in SubjectPublicKeyInfo for X509EncodedKeySpec
            // OID for EC public key: 1.2.840.10045.2.1
            // OID for P-256:         1.2.840.10045.3.1.7
            byte[] spki = buildEcSpki(uncompressed);

            KeyFactory kf = KeyFactory.getInstance("EC");
            return kf.generatePublic(new X509EncodedKeySpec(spki));
        } catch (Exception e) {
            throw new RuntimeException("Failed to decode COSE public key: " + e.getMessage(), e);
        }
    }

    /**
     * Scans a CBOR map for a negative-integer key and returns the associated
     * byte-string value.  Negative key n is encoded as (0x20 | abs(n)-1).
     */
    private byte[] cborFindByteStringForNegativeKey(byte[] cbor, int negKey) {
        // Encoded negative key byte for -2 is 0x21, for -3 is 0x22
        byte keyByte = (byte)(0x20 | ((-negKey) - 1));
        for (int i = 0; i < cbor.length - 1; i++) {
            if (cbor[i] == keyByte) {
                int pos = i + 1;
                int fb = cbor[pos] & 0xFF;
                if ((fb >> 5) != 2) continue; // not a byte-string
                int ai = fb & 0x1F;
                pos++;
                int len;
                if (ai < 24) {
                    len = ai;
                } else if (ai == 24) {
                    len = cbor[pos++] & 0xFF;
                } else {
                    continue;
                }
                return Arrays.copyOfRange(cbor, pos, pos + len);
            }
        }
        return null;
    }

    /** Builds a SubjectPublicKeyInfo DER structure for an EC P-256 key */
    private byte[] buildEcSpki(byte[] uncompressedPoint) {
        // Fixed DER prefix for EC P-256 SubjectPublicKeyInfo
        byte[] prefix = hexDecode("3059301306072a8648ce3d020106082a8648ce3d030107034200");
        byte[] result = new byte[prefix.length + uncompressedPoint.length];
        System.arraycopy(prefix, 0, result, 0, prefix.length);
        System.arraycopy(uncompressedPoint, 0, result, prefix.length, uncompressedPoint.length);
        return result;
    }

    /** Verifies an ECDSA-SHA256 signature */
    private void verifySignature(PublicKey publicKey, byte[] data, byte[] sig) {
        try {
            Signature ecSig = Signature.getInstance("SHA256withECDSA");
            ecSig.initVerify(publicKey);
            ecSig.update(data);
            if (!ecSig.verify(sig)) {
                throw new RuntimeException("Signature verification failed");
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Signature error: " + e.getMessage(), e);
        }
    }

    private byte[] sha256(byte[] input) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(input);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private byte[] concat(byte[] a, byte[] b) {
        byte[] result = new byte[a.length + b.length];
        System.arraycopy(a, 0, result, 0, a.length);
        System.arraycopy(b, 0, result, a.length, b.length);
        return result;
    }

    private String base64url(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private byte[] base64urlDecode(String s) {
        return Base64.getUrlDecoder().decode(s);
    }

    private byte[] longToBytes(long l) {
        ByteBuffer buf = ByteBuffer.allocate(8);
        buf.putLong(l);
        return buf.array();
    }

    private byte[] hexDecode(String hex) {
        int len = hex.length();
        byte[] out = new byte[len / 2];
        for (int i = 0; i < len; i += 2)
            out[i / 2] = (byte)((Character.digit(hex.charAt(i), 16) << 4)
                              + Character.digit(hex.charAt(i + 1), 16));
        return out;
    }
}
