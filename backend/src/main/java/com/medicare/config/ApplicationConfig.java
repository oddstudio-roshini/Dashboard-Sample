package com.medicare.config;

import com.medicare.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.client.RestTemplate;

/**
 * ApplicationConfig.java (Config)
 * ─────────────────────────────────
 * Separate config class that holds UserDetailsService, PasswordEncoder,
 * AuthenticationProvider, and AuthenticationManager beans.
 *
 * WHY THIS EXISTS:
 * Previously these beans were inside SecurityConfig, which caused a
 * circular dependency:
 *   JwtAuthFilter → needs UserDetailsService (was in SecurityConfig)
 *   SecurityConfig → needs JwtAuthFilter
 *   = circular reference → Spring fails to start
 *
 * Moving them here breaks the cycle:
 *   JwtAuthFilter → depends on ApplicationConfig beans (no cycle)
 *   SecurityConfig → depends on JwtAuthFilter + ApplicationConfig beans (no cycle)
 */
@Configuration
@RequiredArgsConstructor
public class ApplicationConfig {

    private final AdminRepository adminRepository;

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> adminRepository.findByEmail(username)
                .map(admin -> org.springframework.security.core.userdetails.User
                        .withUsername(admin.getEmail())
                        .password(admin.getPassword())
                        .roles(admin.getRole())
                        .build())
                .orElseThrow(() -> new UsernameNotFoundException("Admin not found: " + username));
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService());
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}