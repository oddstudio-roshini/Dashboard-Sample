package com.medicare.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JwtAuthFilter.java (Config / Filter)
 * ──────────────────────────────────────
 * A Spring Security filter that runs ONCE per HTTP request.
 *
 * How it works:
 *   1. Reads the "Authorization" header from the request.
 *   2. If the header starts with "Bearer ", extracts the token.
 *   3. Validates the token using JwtUtil.
 *   4. If valid, loads the user details and sets the authentication
 *      in the Spring Security context — so the request is considered authenticated.
 *   5. If no token or invalid token, the filter chain continues without authentication
 *      (public endpoints like /auth/login will still work).
 *
 * This filter is registered in SecurityConfig before the UsernamePasswordAuthenticationFilter.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

//    System.out.println("PATH: " + request.getServletPath());
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

//        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
//            response.setStatus(HttpServletResponse.SC_OK);
//            filterChain.doFilter(request, response);
//            return;
//        }
        System.out.println("PATH: " + request.getServletPath());

        String path = request.getServletPath();

//        if (
//                path.equals("/api/doctors/doctor-login") || path.matches("/api/doctors/.*/doctor-logout") ||
//                path.startsWith("/api/auth")) {
//            filterChain.doFilter(request, response);
//            return;
//        }
        if (
                path.equals("/api/doctors/doctor-login") ||
                        path.matches("/api/doctors/.*/doctor-logout") ||
                        path.startsWith("/api/auth") ||
                        path.startsWith("/api/clinics")
        ) {
            filterChain.doFilter(request, response);
            return;
        }
        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);

        // Defensively extract email — non-JWT tokens (e.g. plain strings) are silently ignored
        String email;
        try {
            email = jwtUtil.extractEmail(jwt);
        } catch (Exception e) {
            filterChain.doFilter(request, response);
            return;
        }

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                if (jwtUtil.validateToken(jwt)) {
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            } catch (Exception ignored) {
                // Unknown user or invalid token — continue unauthenticated
            }
        }

        filterChain.doFilter(request, response);
    }
}
