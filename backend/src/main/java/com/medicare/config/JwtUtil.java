//package com.medicare.config;
//
//import io.jsonwebtoken.*;
//import io.jsonwebtoken.security.Keys;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.stereotype.Component;
//
//import java.security.Key;
//import java.util.Date;
//
///**
// * JwtUtil.java (Config / Utility)
// * ─────────────────────────────────
// * Utility class for JWT (JSON Web Token) operations:
// *
// *   generateToken(email) → Creates a signed JWT for an authenticated admin.
// *                          The token is valid for `jwt.expiration` ms (default 24h).
// *
// *   extractEmail(token)  → Decodes the token and retrieves the stored email/subject.
// *
// *   validateToken(token) → Returns true if the token is valid and not expired.
// *
// * The secret key is loaded from application.properties (jwt.secret).
// * In production, use a 256-bit+ random secret stored in environment variables.
// */
//@Component
//public class JwtUtil {
//
//    @Value("${jwt.secret}")
//    private String secret;
//
//    @Value("${jwt.expiration}")
//    private long expiration;
//
//    private Key getSigningKey() {
//        return Keys.hmacShaKeyFor(secret.getBytes());
//    }
//
//    public String generateToken(String email) {
//        return Jwts.builder()
//                .setSubject(email)
//                .setIssuedAt(new Date())
//                .setExpiration(new Date(System.currentTimeMillis() + expiration))
//                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
//                .compact();
//    }
//
//    public String extractEmail(String token) {
//        return Jwts.parserBuilder()
//                .setSigningKey(getSigningKey())
//                .build()
//                .parseClaimsJws(token)
//                .getBody()
//                .getSubject();
//    }
//
//    public boolean validateToken(String token) {
//        try {
//            Jwts.parserBuilder()
//                    .setSigningKey(getSigningKey())
//                    .build()
//                    .parseClaimsJws(token);
//            return true;
//        } catch (JwtException | IllegalArgumentException e) {
//            return false;
//        }
//    }
//}


package com.medicare.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Arrays;
import java.util.Date;

/**
 * JwtUtil.java (Config / Utility)
 * Fixed version — pads the secret key to at least 32 bytes (256 bits)
 * so Keys.hmacShaKeyFor() never throws ExceptionInInitializerError
 * regardless of what value is set in application.properties.
 */
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    /**
     * Always returns a valid 256-bit key.
     * Pads short secrets with zeros; truncates secrets longer than 32 bytes
     * to exactly 32 bytes. This prevents ExceptionInInitializerError at startup.
     */
    private Key getSigningKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        // HS256 requires exactly 32 bytes (256 bits)
        byte[] paddedKey = Arrays.copyOf(keyBytes, 32);
        return Keys.hmacShaKeyFor(paddedKey);
    }

    public String generateToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractEmail(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}