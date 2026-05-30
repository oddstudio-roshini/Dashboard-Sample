package com.medicare.config;

import com.medicare.dto.DTOs.CreateDoctorRequest;
import com.medicare.entity.Doctor;
import com.medicare.repository.DoctorRepository;
import com.medicare.service.DoctorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Seeds all 1056 doctors from resources/data/doctors_seed.csv on first startup.
 *
 * CSV format (ARthoMove master CSV):
 *   SNO, Hospital SNO, Hospital, Branch SNO, Branch Code, Doctor Name,
 *   Specialization, Contact Number, Email ID, Highest Qualification,
 *   Consultation Fee, Patients, Status
 */
@Slf4j
@Component
@Order(5)   // runs before SalesDataInitializer (Order 10)
@RequiredArgsConstructor
public class DoctorsDataInitializer implements ApplicationRunner {

    private final DoctorRepository  doctorRepository;
    private final DoctorService      doctorService;

    private static final int EXPECTED = 1056;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        long existing = doctorRepository.count();
        if (existing >= EXPECTED) {
            log.info("Doctors already seeded ({}) — skipping.", existing);
            return;
        }

        log.info("Seeding doctors from CSV (existing={}, expected={})…", existing, EXPECTED);

        ClassPathResource res = new ClassPathResource("data/doctors_seed.csv");
        if (!res.exists()) {
            log.warn("doctors_seed.csv not found in resources/data — skipping doctor seed.");
            return;
        }

        int created = 0, skipped = 0;

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(res.getInputStream(), StandardCharsets.UTF_8))) {

            String headerLine = reader.readLine();
            if (headerLine == null) { log.warn("doctors_seed.csv is empty."); return; }

            String[] headers = splitRow(headerLine);
            Map<String, Integer> idx = new HashMap<>();
            for (int i = 0; i < headers.length; i++)
                idx.put(headers[i].trim().toLowerCase().replaceAll("[^a-z0-9]", ""), i);

            String line;
            int rowNum = 1;

            while ((line = reader.readLine()) != null) {
                rowNum++;
                if (line.isBlank()) continue;

                String[] cols = splitRow(line);

                String fullName  = col(cols, idx, "doctorname");
                String email     = col(cols, idx, "emailid");
                String hospital  = col(cols, idx, "hospital");
                String mobile    = col(cols, idx, "contactnumber");
                String spec      = col(cols, idx, "specialization");
                String statusRaw = col(cols, idx, "status");
                String branch    = col(cols, idx, "branchcode");
                String qual      = col(cols, idx, "highestqualification");

                if (fullName.isBlank() || email.isBlank()) {
                    log.debug("Row {} skipped — missing name or email", rowNum);
                    skipped++;
                    continue;
                }

                // Skip if email already exists
                if (doctorRepository.findByEmail(email).isPresent()) {
                    skipped++;
                    continue;
                }

                // Parse "Dr. Nisha Kumar" → firstName / lastName
                String cleaned   = fullName.replaceAll("(?i)^Dr\\.?\\s*", "").trim();
                int lastSpace    = cleaned.lastIndexOf(' ');
                String firstName = lastSpace > 0 ? cleaned.substring(0, lastSpace).trim() : cleaned;
                String lastName  = lastSpace > 0 ? cleaned.substring(lastSpace + 1).trim() : "Doctor";

                // Build notes with branch code + qualification
                List<String> noteParts = new ArrayList<>();
                if (!branch.isBlank()) noteParts.add("Branch: " + branch);
                if (!qual.isBlank())   noteParts.add("Qualification: " + qual);

                CreateDoctorRequest req = new CreateDoctorRequest();
                req.setFirstName(firstName);
                req.setLastName(lastName);
                req.setEmail(email);
                req.setMobileNumber(mobile);
                req.setSpecialization(spec);
                req.setClinicHospital(hospital);
                req.setNotes(String.join(" | ", noteParts));
                req.setStatus(parseStatus(statusRaw));
                req.setBirthYear(null);

                try {
                    doctorService.createDoctor(req);
                    created++;
                } catch (Exception e) {
                    log.debug("Row {} skipped — {}", rowNum, e.getMessage());
                    skipped++;
                }
            }
        } catch (Exception e) {
            log.error("Failed to seed doctors: {}", e.getMessage(), e);
            return;
        }

        log.info("Doctors seed complete — created: {}, skipped: {}", created, skipped);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String[] splitRow(String line) {
        List<String> parts = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder sb = new StringBuilder();
        for (char c : line.toCharArray()) {
            if (c == '"') { inQuotes = !inQuotes; }
            else if (c == ',' && !inQuotes) { parts.add(sb.toString().trim()); sb.setLength(0); }
            else { sb.append(c); }
        }
        parts.add(sb.toString().trim());
        return parts.toArray(new String[0]);
    }

    private String col(String[] cols, Map<String, Integer> idx, String key) {
        Integer i = idx.get(key);
        return (i != null && i < cols.length) ? cols[i].trim().replace("\"", "") : "";
    }

    private Doctor.DoctorStatus parseStatus(String raw) {
        if (raw == null || raw.isBlank()) return Doctor.DoctorStatus.ACTIVE;
        return switch (raw.trim().toUpperCase()) {
            case "INACTIVE" -> Doctor.DoctorStatus.INACTIVE;
            case "BLOCKED"  -> Doctor.DoctorStatus.BLOCKED;
            default         -> Doctor.DoctorStatus.ACTIVE;
        };
    }
}
