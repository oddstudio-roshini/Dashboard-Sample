package com.medicare.config;

import com.medicare.entity.Admin;
import com.medicare.entity.ClinicPatient;
import com.medicare.repository.AdminRepository;
import com.medicare.repository.ClinicPatientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * DataInitializer.java (Config)
 * ──────────────────────────────
 * Seeds the database with a default admin user on first startup.
 * Implements CommandLineRunner — runs automatically after Spring Boot starts.
 *
 * Default admin credentials:
 *   Email    : admin@arthomove.com
 *   Password : Admin@123
 *
 * IMPORTANT: Change these credentials in production!
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private static final String NEW_EMAIL          = "admin@arthomove.com";
    private static final String OLD_EMAIL          = "admin@medicare.com";
    private static final String DEFAULT_PATIENT_PW = "Patient@123";

    private final AdminRepository        adminRepository;
    private final ClinicPatientRepository clinicPatientRepository;
    private final PasswordEncoder        passwordEncoder;

    @Override
    public void run(String... args) {
        // ── Admin email migration ─────────────────────────────────────────────
        if (adminRepository.count() == 0) {
            Admin admin = Admin.builder()
                    .email(NEW_EMAIL)
                    .password(passwordEncoder.encode("Admin@123"))
                    .name("Admin User")
                    .role("ADMIN")
                    .build();
            adminRepository.save(admin);
            log.info("Default admin created: {} / Admin@123", NEW_EMAIL);
        } else {
            adminRepository.findByEmail(OLD_EMAIL).ifPresent(admin -> {
                admin.setEmail(NEW_EMAIL);
                adminRepository.save(admin);
                log.info("Admin email updated: {} → {}", OLD_EMAIL, NEW_EMAIL);
            });
        }

        // ── Seed mobile passwords for existing patients who don't have one ────
        String hashed = passwordEncoder.encode(DEFAULT_PATIENT_PW);
        int count = 0;
        for (ClinicPatient p : clinicPatientRepository.findAll()) {
            if (p.getMobilePassword() == null || p.getMobilePassword().isBlank()) {
                p.setMobilePassword(hashed);
                clinicPatientRepository.save(p);
                count++;
            }
        }
        if (count > 0) {
            log.info("Mobile password set for {} patients (default: {})", count, DEFAULT_PATIENT_PW);
        }
    }
}
