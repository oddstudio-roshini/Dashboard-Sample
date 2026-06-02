package com.medicare.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Seeds dummy INACTIVE patients on startup so the Inactive stat card is
 * always populated for demo purposes. Runs last (@Order 20) and skips if
 * INACTIVE patients already exist.
 */
@Component
@Order(20)
@RequiredArgsConstructor
@Slf4j
public class InactivePatientSeeder implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    private static final Object[][] INACTIVE_SEED = {
        {"Arjun",    "Verma",    45, "Male",   "9876543210", "Back Pain",                  3},
        {"Sunita",   "Rao",      52, "Female", "9876543211", "Knee Osteoarthritis",         4},
        {"Rajan",    "Sharma",   60, "Male",   "9876543212", "Shoulder Impingement",        5},
        {"Meena",    "Pillai",   38, "Female", "9876543213", "Cervical Spondylosis",        6},
        {"Deepak",   "Joshi",    47, "Male",   "9876543214", "Tennis Elbow",                7},
        {"Kavitha",  "Nair",     55, "Female", "9876543215", "Hip Replacement Rehab",       8},
        {"Suresh",   "Iyer",     63, "Male",   "9876543216", "Post Fracture Rehab",         9},
        {"Anita",    "Bose",     41, "Female", "9876543217", "Wrist Pain",                 10},
        {"Mohan",    "Reddy",    50, "Male",   "9876543218", "Sciatica",                   11},
        {"Lakshmi",  "Menon",    35, "Female", "9876543219", "Rotator Cuff Injury",        12},
        {"Vikram",   "Singh",    58, "Male",   "9876543220", "Ankle Sprain",               13},
        {"Preethi",  "Kumar",    44, "Female", "9876543221", "Plantar Fasciitis",          14},
        {"Harish",   "Naidu",    67, "Male",   "9876543222", "Lumbar Disc Herniation",     15},
        {"Divya",    "Krishnan", 33, "Female", "9876543223", "Frozen Shoulder",            16},
        {"Santosh",  "Yadav",    56, "Male",   "9876543224", "Hip Mobility Restriction",   17},
    };

    @Override
    public void run(String... args) {
        // Skip if INACTIVE patients already exist
        Integer existing = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM clinic_patients WHERE patient_status = 'INACTIVE'",
            Integer.class);
        if (existing != null && existing > 0) {
            log.info("INACTIVE patients already seeded ({}), skipping.", existing);
            return;
        }

        // Get the first available clinic doctor id
        Long doctorId = null;
        try {
            doctorId = jdbcTemplate.queryForObject(
                "SELECT id FROM clinic_doctors ORDER BY id ASC LIMIT 1", Long.class);
        } catch (Exception ignored) {}

        if (doctorId == null) {
            log.warn("No clinic doctors found — cannot seed INACTIVE patients.");
            return;
        }

        String hashed = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh7y"; // Patient@123

        for (Object[] row : INACTIVE_SEED) {
            LocalDate joinDate = LocalDate.now().minusMonths((int) row[6]);
            jdbcTemplate.update(
                "INSERT INTO clinic_patients " +
                "(clinic_doctor_id, first_name, last_name, age, gender, contact_phone, " +
                " diagnosis, injury, join_date, patient_status, mobile_password, created_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'INACTIVE', ?, NOW())",
                doctorId, row[0], row[1], row[2], row[3], row[4],
                row[5], row[5], joinDate, hashed
            );
        }
        log.info("Seeded {} dummy INACTIVE patients for demo.", INACTIVE_SEED.length);
    }
}
