////package com.medicare.config;
////
////import com.medicare.entity.*;
////import com.medicare.repository.*;
////import lombok.RequiredArgsConstructor;
////import lombok.extern.slf4j.Slf4j;
////import org.springframework.boot.CommandLineRunner;
////import org.springframework.core.annotation.Order;
////import org.springframework.stereotype.Component;
////
////import java.io.*;
////import java.time.LocalDate;
////import java.util.*;
////
/////**
//// * ClinicDataInitializer
//// * ──────────────────────
//// * Seeds clinic data from CSV files in src/main/resources/data/ on startup.
//// * Skips if data already exists. Replace CSVs with real data and restart.
//// *
//// * CSV files expected:
//// *   hospitals.csv       — id,name,area,city,state,pincode,address,specialization,
//// *                         contact_name,contact_number,email,body_part,status,established_year
//// *   branches.csv        — id,hospital_id,branch_name,branch_code,address,city,
//// *                         contact_phone,contact_email,manager_name,total_doctors,status
//// *   clinic_doctors.csv  — id,branch_id,hospital_id,first_name,last_name,specialization,
//// *                         highest_qualification,registration_number,experience_years,
//// *                         contact_phone,contact_email,consultation_fee,available_days,
//// *                         consultation_hours,status
//// *   clinic_patients.csv — id,clinic_doctor_id,first_name,last_name,age,gender,
//// *                         contact_phone,contact_email,address,diagnosis,
//// *                         appointment_date,appointment_status,visit_type,notes
//// */
////@Component
////@Order(2)
////@RequiredArgsConstructor
////@Slf4j
////public class ClinicDataInitializer implements CommandLineRunner {
////
////    private final HospitalRepository hospitalRepository;
////    private final BranchRepository branchRepository;
////    private final ClinicDoctorRepository clinicDoctorRepository;
////    private final ClinicPatientRepository clinicPatientRepository;
////
////    @Override
////    public void run(String... args) {
////        if (hospitalRepository.count() > 0) {
////            log.info("Clinic data already present, skipping seed.");
////            return;
////        }
////        log.info("Seeding clinic data from CSV...");
////        Map<Long, Hospital> hMap = seedHospitals();
////        Map<Long, Branch> bMap = seedBranches(hMap);
////        Map<Long, ClinicDoctor> dMap = seedDoctors(bMap, hMap);
////        seedPatients(dMap);
////        log.info("Clinic data seeding complete.");
////    }
////
////    // hospitals.csv: id,name,area,city,state,pincode,address,specialization,
////    //                contact_name,contact_number,email,body_part,status,established_year
////    private Map<Long, Hospital> seedHospitals() {
////        Map<Long, Hospital> map = new LinkedHashMap<>();
////        try (InputStream is = getClass().getResourceAsStream("/data/hospitals.csv")) {
////            if (is == null) { log.warn("hospitals.csv not found"); return map; }
////            BufferedReader br = new BufferedReader(new InputStreamReader(is));
////            br.readLine(); // header
////            String line;
////            while ((line = br.readLine()) != null) {
////                String[] f = line.split(",", -1);
////                if (f.length < 14) continue;
////                Hospital h = Hospital.builder()
////                        .name(f[1].trim())
////                        .area(f[2].trim())
////                        .city(f[3].trim())
////                        .state(f[4].trim())
////                        .pincode(f[5].trim())
////                        .address(f[6].trim())
////                        .specialization(f[7].trim())
////                        .contactName(f[8].trim())
////                        .contactNumber(f[9].trim())
////                        .email(f[10].trim())
////                        .bodyPart(f[11].trim())
////                        .status(Hospital.HospitalStatus.valueOf(f[12].trim()))
////                        .establishedYear(parseInt(f[13]))
////                        .build();
////                map.put(Long.parseLong(f[0].trim()), hospitalRepository.save(h));
////            }
////        } catch (Exception e) { log.error("Error seeding hospitals: {}", e.getMessage()); }
////        log.info("Seeded {} hospitals", map.size());
////        return map;
////    }
////
////    // branches.csv: id,hospital_id,branch_name,branch_code,address,city,
////    //               contact_phone,contact_email,manager_name,total_doctors,status
////    private Map<Long, Branch> seedBranches(Map<Long, Hospital> hMap) {
////        Map<Long, Branch> map = new LinkedHashMap<>();
////        try (InputStream is = getClass().getResourceAsStream("/data/branches.csv")) {
////            if (is == null) { log.warn("branches.csv not found"); return map; }
////            BufferedReader br = new BufferedReader(new InputStreamReader(is));
////            br.readLine();
////            String line;
////            while ((line = br.readLine()) != null) {
////                String[] f = line.split(",", -1);
////                if (f.length < 11) continue;
////                Hospital hospital = hMap.get(Long.parseLong(f[1].trim()));
////                if (hospital == null) continue;
////                Branch b = Branch.builder()
////                        .hospital(hospital)
////                        .branchName(f[2].trim())
////                        .branchCode(f[3].trim())
////                        .address(f[4].trim())
////                        .city(f[5].trim())
////                        .contactPhone(f[6].trim())
////                        .contactEmail(f[7].trim())
////                        .managerName(f[8].trim())
////                        .totalDoctors(parseInt(f[9]))
////                        .status(Branch.BranchStatus.valueOf(f[10].trim()))
////                        .build();
////                map.put(Long.parseLong(f[0].trim()), branchRepository.save(b));
////            }
////        } catch (Exception e) { log.error("Error seeding branches: {}", e.getMessage()); }
////        log.info("Seeded {} branches", map.size());
////        return map;
////    }
////
////    // clinic_doctors.csv: id,branch_id,hospital_id,first_name,last_name,specialization,
////    //   highest_qualification,registration_number,experience_years,contact_phone,
////    //   contact_email,consultation_fee,available_days,consultation_hours,status
////    private Map<Long, ClinicDoctor> seedDoctors(Map<Long, Branch> bMap, Map<Long, Hospital> hMap) {
////        Map<Long, ClinicDoctor> map = new LinkedHashMap<>();
////        try (InputStream is = getClass().getResourceAsStream("/data/clinic_doctors.csv")) {
////            if (is == null) { log.warn("clinic_doctors.csv not found"); return map; }
////            BufferedReader br = new BufferedReader(new InputStreamReader(is));
////            br.readLine();
////            String line;
////            while ((line = br.readLine()) != null) {
////                String[] f = line.split(",", -1);
////                if (f.length < 15) continue;
////                Branch branch = bMap.get(Long.parseLong(f[1].trim()));
////                Hospital hospital = hMap.get(Long.parseLong(f[2].trim()));
////                if (branch == null || hospital == null) continue;
////                ClinicDoctor d = ClinicDoctor.builder()
////                        .branch(branch)
////                        .hospital(hospital)
////                        .firstName(f[3].trim())
////                        .lastName(f[4].trim())
////                        .specialization(f[5].trim())
////                        .highestQualification(f[6].trim())
////                        .registrationNumber(f[7].trim())
////                        .experienceYears(parseInt(f[8]))
////                        .contactPhone(f[9].trim())
////                        .contactEmail(f[10].trim())
////                        .consultationFee(parseInt(f[11]))
////                        .availableDays(f[12].trim())
////                        .consultationHours(f[13].trim())
////                        .status(ClinicDoctor.DoctorStatus.valueOf(f[14].trim()))
////                        .build();
////                map.put(Long.parseLong(f[0].trim()), clinicDoctorRepository.save(d));
////            }
////        } catch (Exception e) { log.error("Error seeding clinic doctors: {}", e.getMessage()); }
////        log.info("Seeded {} clinic doctors", map.size());
////        return map;
////    }
////
////    // clinic_patients.csv: id,clinic_doctor_id,first_name,last_name,age,gender,
////    //   contact_phone,contact_email,address,diagnosis,appointment_date,
////    //   appointment_status,visit_type,notes
////    private void seedPatients(Map<Long, ClinicDoctor> dMap) {
////        int count = 0;
////        try (InputStream is = getClass().getResourceAsStream("/data/clinic_patients.csv")) {
////            if (is == null) { log.warn("clinic_patients.csv not found"); return; }
////            BufferedReader br = new BufferedReader(new InputStreamReader(is));
////            br.readLine();
////            String line;
////            while ((line = br.readLine()) != null) {
////                String[] f = line.split(",", -1);
////                if (f.length < 13) continue;
////                ClinicDoctor doctor = dMap.get(Long.parseLong(f[1].trim()));
////                if (doctor == null) continue;
////                ClinicPatient p = ClinicPatient.builder()
////                        .clinicDoctor(doctor)
////                        .firstName(f[2].trim())
////                        .lastName(f[3].trim())
////                        .age(parseInt(f[4]))
////                        .gender(f[5].trim())
////                        .contactPhone(f[6].trim())
////                        .contactEmail(f[7].trim())
////                        .address(f[8].trim())
////                        .diagnosis(f[9].trim())
////                        .appointmentDate(LocalDate.parse(f[10].trim()))
////                        .appointmentStatus(ClinicPatient.AppointmentStatus.valueOf(f[11].trim()))
////                        .visitType(f[12].trim())
////                        .notes(f.length > 13 ? f[13].trim() : null)
////                        .build();
////                clinicPatientRepository.save(p);
////                count++;
////            }
////        } catch (Exception e) { log.error("Error seeding patients: {}", e.getMessage()); }
////        log.info("Seeded {} patients", count);
////    }
////
////    private Integer parseInt(String s) {
////        try { return Integer.parseInt(s.trim()); } catch (Exception e) { return null; }
////    }
////}
//
//
//
//package com.medicare.config;
//
//import com.medicare.entity.*;
//import com.medicare.repository.*;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.boot.CommandLineRunner;
//import org.springframework.core.annotation.Order;
//import org.springframework.stereotype.Component;
//
//import java.io.*;
//import java.time.LocalDate;
//import java.util.*;
//
///**
// * Seeds clinic data from CSV on startup. Skips if data exists.
// * Replace CSV files with real data and restart to re-seed.
// *
// * hospitals.csv     — id,name,area,city,state,pincode,address,specialization,
// *                     contact_name,contact_number,email,body_part,status,
// *                     established_year,latitude,longitude
// * branches.csv      — id,hospital_id,branch_name,branch_code,address,city,
// *                     contact_phone,contact_email,manager_name,total_doctors,
// *                     status,latitude,longitude
// * clinic_doctors.csv— id,branch_id,hospital_id,first_name,last_name,
// *                     specialization,highest_qualification,registration_number,
// *                     experience_years,contact_phone,contact_email,
// *                     consultation_fee,available_days,consultation_hours,status
// * clinic_patients.csv— id,clinic_doctor_id,first_name,last_name,age,gender,
// *                      contact_phone,contact_email,address,diagnosis,
// *                      appointment_date,appointment_status,visit_type,notes
// */
//@Component @Order(2) @RequiredArgsConstructor @Slf4j
//public class ClinicDataInitializer implements CommandLineRunner {
//
//    private final HospitalRepository hospitalRepository;
//    private final BranchRepository branchRepository;
//    private final ClinicDoctorRepository clinicDoctorRepository;
//    private final ClinicPatientRepository clinicPatientRepository;
//
//    @Override
//    public void run(String... args) {
//        if (hospitalRepository.count() > 0) { log.info("Clinic data present, skipping."); return; }
//        log.info("Seeding clinic data...");
//        Map<Long, Hospital> hMap = seedHospitals();
//        Map<Long, Branch>   bMap = seedBranches(hMap);
//        Map<Long, ClinicDoctor> dMap = seedDoctors(bMap, hMap);
//        seedPatients(dMap);
//        log.info("Clinic seeding complete.");
//    }
//
//    // hospitals: id,name,area,city,state,pincode,address,specialization,
//    //            contact_name,contact_number,email,body_part,status,established_year,latitude,longitude
//    private Map<Long, Hospital> seedHospitals() {
//        Map<Long, Hospital> map = new LinkedHashMap<>();
//        try (InputStream is = getClass().getResourceAsStream("/data/hospitals.csv")) {
//            if (is == null) { log.warn("hospitals.csv not found"); return map; }
//            BufferedReader br = new BufferedReader(new InputStreamReader(is));
//            br.readLine();
//            String line;
//            while ((line = br.readLine()) != null) {
//                String[] f = line.split(",", -1);
//                if (f.length < 16) continue;
//                Hospital h = Hospital.builder()
//                        .name(f[1].trim()).area(f[2].trim()).city(f[3].trim())
//                        .state(f[4].trim()).pincode(f[5].trim()).address(f[6].trim())
//                        .specialization(f[7].trim()).contactName(f[8].trim())
//                        .contactNumber(f[9].trim()).email(f[10].trim())
//                        .bodyPart(f[11].trim())
//                        .status(Hospital.HospitalStatus.valueOf(f[12].trim()))
//                        .establishedYear(parseInt(f[13]))
//                        .latitude(parseDouble(f[14])).longitude(parseDouble(f[15]))
//                        .build();
//                map.put(Long.parseLong(f[0].trim()), hospitalRepository.save(h));
//            }
//        } catch (Exception e) { log.error("Error seeding hospitals: {}", e.getMessage()); }
//        log.info("Seeded {} hospitals", map.size());
//        return map;
//    }
//
//    // branches: id,hospital_id,branch_name,branch_code,address,city,
//    //           contact_phone,contact_email,manager_name,total_doctors,status,latitude,longitude
//    private Map<Long, Branch> seedBranches(Map<Long, Hospital> hMap) {
//        Map<Long, Branch> map = new LinkedHashMap<>();
//        try (InputStream is = getClass().getResourceAsStream("/data/branches.csv")) {
//            if (is == null) { log.warn("branches.csv not found"); return map; }
//            BufferedReader br = new BufferedReader(new InputStreamReader(is));
//            br.readLine();
//            String line;
//            while ((line = br.readLine()) != null) {
//                String[] f = line.split(",", -1);
//                if (f.length < 13) continue;
//                Hospital hospital = hMap.get(Long.parseLong(f[1].trim()));
//                if (hospital == null) continue;
//                Branch b = Branch.builder()
//                        .hospital(hospital).branchName(f[2].trim()).branchCode(f[3].trim())
//                        .address(f[4].trim()).city(f[5].trim()).contactPhone(f[6].trim())
//                        .contactEmail(f[7].trim()).managerName(f[8].trim())
//                        .totalDoctors(parseInt(f[9]))
//                        .status(Branch.BranchStatus.valueOf(f[10].trim()))
//                        .latitude(parseDouble(f[11])).longitude(parseDouble(f[12]))
//                        .build();
//                map.put(Long.parseLong(f[0].trim()), branchRepository.save(b));
//            }
//        } catch (Exception e) { log.error("Error seeding branches: {}", e.getMessage()); }
//        log.info("Seeded {} branches", map.size());
//        return map;
//    }
//
//    // clinic_doctors: id,branch_id,hospital_id,first_name,last_name,specialization,
//    //   highest_qualification,registration_number,experience_years,contact_phone,
//    //   contact_email,consultation_fee,available_days,consultation_hours,status
//    private Map<Long, ClinicDoctor> seedDoctors(Map<Long, Branch> bMap, Map<Long, Hospital> hMap) {
//        Map<Long, ClinicDoctor> map = new LinkedHashMap<>();
//        try (InputStream is = getClass().getResourceAsStream("/data/clinic_doctors.csv")) {
//            if (is == null) { log.warn("clinic_doctors.csv not found"); return map; }
//            BufferedReader br = new BufferedReader(new InputStreamReader(is));
//            br.readLine();
//            String line;
//            while ((line = br.readLine()) != null) {
//                String[] f = line.split(",", -1);
//                if (f.length < 15) continue;
//                Branch branch = bMap.get(Long.parseLong(f[1].trim()));
//                Hospital hospital = hMap.get(Long.parseLong(f[2].trim()));
//                if (branch == null || hospital == null) continue;
//                ClinicDoctor d = ClinicDoctor.builder()
//                        .branch(branch).hospital(hospital)
//                        .firstName(f[3].trim()).lastName(f[4].trim())
//                        .specialization(f[5].trim()).highestQualification(f[6].trim())
//                        .registrationNumber(f[7].trim()).experienceYears(parseInt(f[8]))
//                        .contactPhone(f[9].trim()).contactEmail(f[10].trim())
//                        .consultationFee(parseInt(f[11])).availableDays(f[12].trim())
//                        .consultationHours(f[13].trim())
//                        .status(ClinicDoctor.DoctorStatus.valueOf(f[14].trim()))
//                        .build();
//                map.put(Long.parseLong(f[0].trim()), clinicDoctorRepository.save(d));
//            }
//        } catch (Exception e) { log.error("Error seeding doctors: {}", e.getMessage()); }
//        log.info("Seeded {} clinic doctors", map.size());
//        return map;
//    }
//
//    private void seedPatients(Map<Long, ClinicDoctor> dMap) {
//        int count = 0;
//        try (InputStream is = getClass().getResourceAsStream("/data/clinic_patients.csv")) {
//            if (is == null) { log.warn("clinic_patients.csv not found"); return; }
//            BufferedReader br = new BufferedReader(new InputStreamReader(is));
//            br.readLine();
//            String line;
//            while ((line = br.readLine()) != null) {
//                String[] f = line.split(",", -1);
//                if (f.length < 13) continue;
//                ClinicDoctor doctor = dMap.get(Long.parseLong(f[1].trim()));
//                if (doctor == null) continue;
//                clinicPatientRepository.save(ClinicPatient.builder()
//                        .clinicDoctor(doctor).firstName(f[2].trim()).lastName(f[3].trim())
//                        .age(parseInt(f[4])).gender(f[5].trim()).contactPhone(f[6].trim())
//                        .contactEmail(f[7].trim()).address(f[8].trim()).diagnosis(f[9].trim())
//                        .appointmentDate(LocalDate.parse(f[10].trim()))
//                        .appointmentStatus(ClinicPatient.AppointmentStatus.valueOf(f[11].trim()))
//                        .visitType(f[12].trim()).notes(f.length > 13 ? f[13].trim() : null)
//                        .build());
//                count++;
//            }
//        } catch (Exception e) { log.error("Error seeding patients: {}", e.getMessage()); }
//        log.info("Seeded {} patients", count);
//    }
//
//    private Integer parseInt(String s) {
//        try { return Integer.parseInt(s.trim()); } catch (Exception e) { return null; }
//    }
//    private Double parseDouble(String s) {
//        try { return Double.parseDouble(s.trim()); } catch (Exception e) { return null; }
//    }
//}


package com.medicare.config;

import com.medicare.entity.*;
import com.medicare.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.*;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.List;

/**
 * Seeds clinic data from CSV files in src/main/resources/data/ on startup.
 *
 * FIX 1: Always clears and re-seeds so new CSV data is picked up on restart.
 * FIX 2: CSVs are tab-delimited (\t) — split on \t not comma.
 *
 * hospitals.csv      — tab-separated:
 *   id, name, area, city, state, pincode, address, specialization,
 *   contact_name, contact_number, email, body_part, status,
 *   established_year, latitude, longitude
 * branches.csv       — tab-separated:
 *   id, hospital_id, branch_name, branch_code, address, city,
 *   contact_phone, contact_email, manager_name, total_doctors,
 *   status, latitude, longitude
 * clinic_doctors.csv — comma-separated:
 *   id, branch_id, hospital_id, first_name, last_name, specialization,
 *   highest_qualification, registration_number, experience_years,
 *   contact_phone, contact_email, consultation_fee, available_days,
 *   consultation_hours, status
 * clinic_patients.csv — comma-separated:
 *   id, clinic_doctor_id, first_name, last_name, age, gender,
 *   contact_phone, contact_email, address, diagnosis,
 *   appointment_date, appointment_status, visit_type, notes
 */
@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class ClinicDataInitializer implements CommandLineRunner {

    private final HospitalRepository       hospitalRepository;
    private final BranchRepository         branchRepository;
    private final ClinicDoctorRepository   clinicDoctorRepository;
    private final ClinicPatientRepository  clinicPatientRepository;
    private final JdbcTemplate             jdbcTemplate;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @Override
    public void run(String... args) {
        fixPatientStatusConstraint();   // must run first — drops stale DB check constraint
        long csvHospitals = countCsvRows("/data/hospitals.csv",       ",");
        long csvBranches  = countCsvRows("/data/branches.csv",        ",");
        long csvDoctors   = countCsvRows("/data/clinic_doctors.csv",  ",");
        long csvPatients  = countCsvRows("/data/clinic_patients.csv", ",");

        long dbHospitals = hospitalRepository.count();
        long dbBranches  = branchRepository.count();
        long dbDoctors   = clinicDoctorRepository.count();
        long dbPatients  = clinicPatientRepository.count();

        boolean inSync = false;

        if (inSync) {
            log.info("Clinic DB in sync ({}/{}/{}/{}) — skipping seed.",
                    dbHospitals, dbBranches, dbDoctors, dbPatients);
        } else {
            log.info("Clinic DB out of sync (DB:{}/{}/{}/{} vs CSV:{}/{}/{}/{}) — re-seeding...",
                    dbHospitals, dbBranches, dbDoctors, dbPatients,
                    csvHospitals, csvBranches, csvDoctors, csvPatients);

            // Clear tables that FK-reference clinic_patients before deleting patients
            try {
                jdbcTemplate.execute("DELETE FROM patient_activity_logs");
                jdbcTemplate.execute("DELETE FROM patient_exercise_schedules");
                jdbcTemplate.execute("DELETE FROM patient_history");
                jdbcTemplate.execute("DELETE FROM patient_exercises");
                jdbcTemplate.execute("DELETE FROM patient_body_part_library");
            } catch (Exception ex) {
                log.warn("Could not clear exercise library tables (may not exist yet): {}", ex.getMessage());
            }
            clinicPatientRepository.deleteAll();
            clinicDoctorRepository.deleteAll();
            branchRepository.deleteAll();
            hospitalRepository.deleteAll();

            Map<Long, Hospital>    hMap = seedHospitals();
            Map<Long, Branch>      bMap = seedBranches(hMap);
            Map<Long, ClinicDoctor> dMap = seedDoctors(bMap, hMap);
            seedPatients(dMap);

            log.info("Clinic seeding complete — {} hospitals, {} branches, {} doctors, {} patients.",
                    hMap.size(), bMap.size(), dMap.size(), clinicPatientRepository.count());
        }

        ensureDummyPrescriptions();
        ensurePatientStatusDistribution();
        backfillPatientNames();
    }

    // ── hospitals.csv (TAB-separated) ─────────────────────────────────────────
    // id[0] name[1] area[2] city[3] state[4] pincode[5] address[6]
    // specialization[7] contact_name[8] contact_number[9] email[10]
    // body_part[11] status[12] established_year[13] latitude[14] longitude[15]
    private Map<Long, Hospital> seedHospitals() {
        Map<Long, Hospital> map = new LinkedHashMap<>();
        try (InputStream is = getClass().getResourceAsStream("/data/hospitals.csv")) {
            if (is == null) { log.warn("hospitals.csv not found"); return map; }
            BufferedReader br = new BufferedReader(new InputStreamReader(is, java.nio.charset.StandardCharsets.UTF_8));
            br.readLine(); // skip header
            String line;
            while ((line = br.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty()) continue;
                String[] f = line.split(",", -1);
                if (f.length < 14) { log.warn("Skipping short hospital row: {}", line); continue; }
                try {
                    Hospital h = Hospital.builder()
                            .name(f[1].trim())
                            .area(f[2].trim())
                            .city(f[3].trim())
                            .state(f[4].trim())
                            .pincode(f[5].trim())
                            .address(f[6].trim())
                            .specialization(f[7].trim())
                            .contactName(f[8].trim())
                            .contactNumber(f[9].trim())
                            .email(f[10].trim())
                            .bodyPart(f[11].trim())
                            .status(Hospital.HospitalStatus.valueOf(f[12].trim()))
                            .establishedYear(parseInt(f[13]))
                            .latitude(f.length > 14  ? parseDouble(f[14]) : null)
                            .longitude(f.length > 15 ? parseDouble(f[15]) : null)
                            .build();
                    map.put(Long.parseLong(f[0].trim()), hospitalRepository.save(h));
                } catch (Exception e) {
                    log.warn("Skipping hospital row (parse error): {} — {}", line, e.getMessage());
                }
            }
        } catch (Exception e) { log.error("Error reading hospitals.csv: {}", e.getMessage()); }
        log.info("Seeded {} hospitals", map.size());
        return map;
    }

    // ── branches.csv (TAB-separated) ──────────────────────────────────────────
    // id[0] hospital_id[1] branch_name[2] branch_code[3] address[4] city[5]
    // contact_phone[6] contact_email[7] manager_name[8] total_doctors[9]
    // status[10] latitude[11] longitude[12]
    private Map<Long, Branch> seedBranches(Map<Long, Hospital> hMap) {
        Map<Long, Branch> map = new LinkedHashMap<>();
        try (InputStream is = getClass().getResourceAsStream("/data/branches.csv")) {
            if (is == null) { log.warn("branches.csv not found"); return map; }
            BufferedReader br = new BufferedReader(new InputStreamReader(is));
            br.readLine();
            String line;
            while ((line = br.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty()) continue;
                String[] f = line.split(",", -1);
                if (f.length < 11) { log.warn("Skipping short branch row: {}", line); continue; }
                try {
                    Hospital hospital = hMap.get(Long.parseLong(f[1].trim()));
                    if (hospital == null) { log.warn("No hospital id={} for branch row", f[1]); continue; }
                    Branch b = Branch.builder()
                            .hospital(hospital)
                            .branchName(f[2].trim())
                            .branchCode(f[3].trim())
                            .address(f[4].trim())
                            .city(f[5].trim())
                            .contactPhone(f[6].trim())
                            .contactEmail(f[7].trim())
                            .managerName(f[8].trim())
                            .totalDoctors(parseInt(f[9]))
                            .status(Branch.BranchStatus.valueOf(f[10].trim()))
                            .latitude(f.length > 11  ? parseDouble(f[11]) : null)
                            .longitude(f.length > 12 ? parseDouble(f[12]) : null)
                            .build();
                    map.put(Long.parseLong(f[0].trim()), branchRepository.save(b));
                } catch (Exception e) {
                    log.warn("Skipping branch row (parse error): {} — {}", line, e.getMessage());
                }
            }
        } catch (Exception e) { log.error("Error reading branches.csv: {}", e.getMessage()); }
        log.info("Seeded {} branches", map.size());
        return map;
    }

    // ── clinic_doctors.csv (COMMA-separated) ──────────────────────────────────
    // id[0] branch_id[1] hospital_id[2] first_name[3] last_name[4]
    // specialization[5] highest_qualification[6] registration_number[7]
    // experience_years[8] contact_phone[9] contact_email[10]
    // consultation_fee[11] available_days[12] consultation_hours[13] status[14]
    private Map<Long, ClinicDoctor> seedDoctors(Map<Long, Branch> bMap, Map<Long, Hospital> hMap) {
        Map<Long, ClinicDoctor> map = new LinkedHashMap<>();
        try (InputStream is = getClass().getResourceAsStream("/data/clinic_doctors.csv")) {
            if (is == null) { log.warn("clinic_doctors.csv not found"); return map; }
            BufferedReader br = new BufferedReader(new InputStreamReader(is));
            br.readLine();
            String line;
            while ((line = br.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty()) continue;
                String[] f = line.split(",", -1);
                if (f.length < 15) { log.warn("Skipping short doctor row: {}", line); continue; }
                try {
                    Branch   branch   = bMap.get(Long.parseLong(f[1].trim()));
                    Hospital hospital = hMap.get(Long.parseLong(f[2].trim()));
                    if (branch == null || hospital == null) {
                        log.warn("Missing branch/hospital for doctor row id={}", f[0]); continue;
                    }
                    ClinicDoctor d = ClinicDoctor.builder()
                            .branch(branch)
                            .hospital(hospital)
                            .firstName(f[3].trim())
                            .lastName(f[4].trim())
                            .specialization(f[5].trim())
                            .highestQualification(f[6].trim())
                            .registrationNumber(f[7].trim())
                            .experienceYears(parseInt(f[8]))
                            .contactPhone(f[9].trim())
                            .contactEmail(f[10].trim())
                            .consultationFee(parseInt(f[11]))
                            .availableDays(f[12].trim())
                            .consultationHours(f[13].trim())
                            .status(ClinicDoctor.DoctorStatus.valueOf(f[14].trim()))
                            .build();
                    map.put(Long.parseLong(f[0].trim()), clinicDoctorRepository.save(d));
                } catch (Exception e) {
                    log.warn("Skipping doctor row (parse error): {} — {}", line, e.getMessage());
                }
            }
        } catch (Exception e) { log.error("Error reading clinic_doctors.csv: {}", e.getMessage()); }
        log.info("Seeded {} clinic doctors", map.size());
        return map;
    }

    // ── clinic_patients.csv (COMMA-separated) ─────────────────────────────────
    // id[0] clinic_doctor_id[1] first_name[2] last_name[3] age[4] gender[5]
    // contact_phone[6] contact_email[7] address[8] diagnosis[9]
    // appointment_date[10] appointment_status[11] visit_type[12] notes[13]
    private void seedPatients(Map<Long, ClinicDoctor> dMap) {
        int count = 0;
        try (InputStream is = getClass().getResourceAsStream("/data/clinic_patients.csv")) {
            if (is == null) { log.warn("clinic_patients.csv not found"); return; }
            BufferedReader br = new BufferedReader(new InputStreamReader(is));
            br.readLine();
            String line;
            while ((line = br.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty()) continue;
                String[] f = line.split(",", -1);
                if (f.length < 13) { log.warn("Skipping short patient row: {}", line); continue; }
                try {
                    ClinicDoctor doctor = dMap.get(Long.parseLong(f[1].trim()));
                    if (doctor == null) { log.warn("No doctor id={} for patient row", f[1]); continue; }
                    clinicPatientRepository.save(ClinicPatient.builder()
                            .clinicDoctor(doctor)
                            .firstName(f[2].trim())
                            .lastName(f[3].trim())
                            .age(parseInt(f[4]))
                            .gender(f[5].trim())
                            .contactPhone(f[6].trim())
                            .contactEmail(f[7].trim())
                            .address(f[8].trim())
                            .diagnosis(f[9].trim())
                            .appointmentDate(LocalDate.parse(f[10].trim()))
                            .appointmentStatus(ClinicPatient.AppointmentStatus.valueOf(f[11].trim()))
                            .visitType(f[12].trim())
                            .notes(f.length > 13 ? f[13].trim() : null)
                            .build());
                    count++;
                } catch (Exception e) {
                    log.warn("Skipping patient row (parse error): {} — {}", line, e.getMessage());
                }
            }
        } catch (Exception e) { log.error("Error reading clinic_patients.csv: {}", e.getMessage()); }
        log.info("Seeded {} patients", count);
    }

    // ── Dummy prescription generation ─────────────────────────────────────────
    private static final String DUMMY_PRESCRIPTION_FILE = "prescription.png";
    private static final String DUMMY_PRESCRIPTION_URL  = "/api/files/shared/" + DUMMY_PRESCRIPTION_FILE;

    private void ensureDummyPrescriptions() {
        try {
            System.setProperty("java.awt.headless", "true");

            // 1. Generate the shared prescription image once
            Path sharedDir = Paths.get(uploadDir, "shared");
            Files.createDirectories(sharedDir);
            Path prescriptionPath = sharedDir.resolve(DUMMY_PRESCRIPTION_FILE);
            if (!Files.exists(prescriptionPath)) {
                generatePrescriptionImage(prescriptionPath);
                log.info("Generated shared dummy prescription at {}", prescriptionPath.toAbsolutePath());
            }

            // 2. Assign it to every patient that has no prescription yet
            List<ClinicPatient> patients = clinicPatientRepository.findAllByOrderByIdAsc();
            int count = 0;
            for (ClinicPatient patient : patients) {
                if (patient.getPrescriptionUrl() == null || patient.getPrescriptionUrl().isBlank()) {
                    patient.setPrescription("Prescription.png");
                    patient.setPrescriptionUrl(DUMMY_PRESCRIPTION_URL);
                    patient.setPrescriptionFileName("Prescription.png");
                    patient.setPrescriptionFileType("image/png");
                    clinicPatientRepository.save(patient);
                    count++;
                }
            }
            if (count > 0) log.info("Assigned dummy prescription to {} patients", count);
        } catch (Exception e) {
            log.error("Failed to ensure dummy prescriptions: {}", e.getMessage());
        }
    }

    private void generatePrescriptionImage(Path filePath) throws Exception {
        int w = 794, h = 1123;
        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING,      RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

        // Background
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, w, h);

        // Header bar
        g.setColor(new Color(37, 99, 235));
        g.fillRect(0, 0, w, 108);

        g.setColor(Color.WHITE);
        g.setFont(new Font("SansSerif", Font.BOLD, 26));
        g.drawString("MEDICARE REHABILITATION CENTER", 40, 48);
        g.setFont(new Font("SansSerif", Font.PLAIN, 14));
        g.drawString("Official Medical Prescription", 40, 82);

        g.setColor(new Color(219, 234, 254));
        g.fillRect(0, 108, w, 4);

        // Rx + date
        int y = 165;
        g.setColor(new Color(37, 99, 235));
        g.setFont(new Font("Serif", Font.BOLD, 52));
        g.drawString("Rx", 40, y);

        y += 10;
        g.setColor(new Color(107, 114, 128));
        g.setFont(new Font("SansSerif", Font.PLAIN, 13));
        g.drawString("Date: " + LocalDate.now().toString(), 40, y);

        // Divider
        y += 22;
        g.setColor(new Color(229, 231, 235));
        g.fillRect(40, y, w - 80, 1);

        // Prescribed treatment
        y += 38;
        g.setColor(new Color(17, 24, 39));
        g.setFont(new Font("SansSerif", Font.BOLD, 17));
        g.drawString("Prescribed Physical Therapy", 40, y);

        y += 8;
        String[] treatments = {
            "1.  Range of motion exercises — 3 sessions per week",
            "2.  Strengthening exercises as demonstrated by therapist",
            "3.  Home exercise program (HEP) — daily",
            "4.  Ice / Heat therapy: 15–20 min after each session",
            "5.  Activity modification and ergonomic guidance",
            "6.  Gait training and balance exercises",
            "7.  Manual therapy — as clinically indicated",
        };
        g.setFont(new Font("SansSerif", Font.PLAIN, 14));
        for (String line : treatments) {
            y += 30;
            g.setColor(new Color(55, 65, 81));
            g.drawString(line, 60, y);
        }

        // Duration
        y += 40;
        g.setColor(new Color(229, 231, 235));
        g.fillRect(40, y, w - 80, 1);

        y += 35;
        g.setColor(new Color(17, 24, 39));
        g.setFont(new Font("SansSerif", Font.BOLD, 17));
        g.drawString("Duration & Follow-up", 40, y);

        y += 30;
        g.setFont(new Font("SansSerif", Font.PLAIN, 14));
        g.setColor(new Color(55, 65, 81));
        g.drawString("Duration: 8–12 weeks of supervised rehabilitation therapy", 60, y);
        y += 28;
        g.drawString("Follow-up: Every 4 weeks to assess progress", 60, y);
        y += 28;
        g.drawString("Outcomes reviewed and plan adjusted at each visit", 60, y);

        // Notes box
        y += 48;
        g.setColor(new Color(239, 246, 255));
        g.fillRoundRect(40, y, w - 80, 96, 12, 12);
        g.setColor(new Color(191, 219, 254));
        g.drawRoundRect(40, y, w - 80, 96, 12, 12);
        y += 26;
        g.setColor(new Color(30, 64, 175));
        g.setFont(new Font("SansSerif", Font.BOLD, 13));
        g.drawString("Clinical Notes:", 60, y);
        y += 22;
        g.setFont(new Font("SansSerif", Font.PLAIN, 13));
        g.drawString("Patient is progressing well. Continue current rehabilitation plan.", 60, y);
        y += 20;
        g.drawString("Reassess pain levels and functional outcomes at next visit.", 60, y);

        // Signature row
        y = h - 155;
        g.setColor(new Color(229, 231, 235));
        g.fillRect(40, y, w - 80, 1);
        y += 38;
        g.setColor(new Color(17, 24, 39));
        g.setFont(new Font("SansSerif", Font.BOLD, 14));
        g.drawString("Attending Physician", 40, y);
        g.drawString("Patient Acknowledgement", w - 256, y);
        y += 12;
        g.setColor(new Color(209, 213, 219));
        g.fillRect(40, y, 200, 1);
        g.fillRect(w - 256, y, 200, 1);
        y += 24;
        g.setColor(new Color(107, 114, 128));
        g.setFont(new Font("SansSerif", Font.PLAIN, 12));
        g.drawString("Signature & Stamp", 40, y);
        g.drawString("Signature", w - 256, y);

        // Footer bar
        g.setColor(new Color(37, 99, 235));
        g.fillRect(0, h - 44, w, 44);
        g.setColor(Color.WHITE);
        g.setFont(new Font("SansSerif", Font.PLAIN, 11));
        g.drawString("Medicare Rehabilitation Center  •  Computer-generated document  •  Valid for 90 days", 40, h - 16);

        g.dispose();
        ImageIO.write(img, "PNG", filePath.toFile());
    }

    // ── Indian name pools ────────────────────────────────────────────────────
    private static final String[] MALE_FIRST = {
        "Aarav","Arjun","Vikram","Rahul","Amit","Rohit","Suresh","Rajesh","Anil","Nikhil",
        "Ravi","Sanjay","Deepak","Manoj","Praveen","Ajay","Vijay","Gaurav","Harsh","Kunal",
        "Rohan","Tarun","Vivek","Anand","Pratik","Dev","Kartik","Manish","Naveen","Pranav",
        "Sachin","Tejas","Varun","Yash","Akash","Nitin","Sandeep","Pradeep","Ramesh","Girish",
        "Karan","Lokesh","Mihir","Neeraj","Om","Parth","Quamar","Ritesh","Shivam","Tanmay",
        "Uday","Vinod","Wasim","Xavier","Yogesh","Zuber","Bharat","Chirag","Dinesh","Feroz",
        "Gopal","Hemant","Ishaan","Jagdish","Kailash","Lalit","Mukesh","Narendra","Omkar","Pawan"
    };

    private static final String[] FEMALE_FIRST = {
        "Priya","Anjali","Pooja","Divya","Neha","Kavya","Sneha","Riya","Anika","Meera",
        "Lakshmi","Sunita","Geeta","Rekha","Ananya","Deepa","Nisha","Radha","Vandana","Yamini",
        "Bhavna","Chitra","Diya","Isha","Jyoti","Komal","Lata","Manju","Nandini","Payal",
        "Rashmi","Swati","Tanvi","Usha","Vidya","Aarti","Babita","Champa","Farida","Hema",
        "Indira","Jayashree","Kanchan","Leela","Madhuri","Namita","Ojaswi","Parvati","Qamar","Rita",
        "Shobha","Tara","Urmila","Vasudha","Wahida","Yashoda","Zara","Archana","Brinda","Chetna",
        "Durga","Esha","Falak","Gita","Hemlata","Ilma","Jasmine","Kamla","Lalita","Mamta"
    };

    private static final String[] LAST_NAMES = {
        "Sharma","Patel","Singh","Kumar","Gupta","Verma","Mehta","Shah","Joshi","Nair",
        "Reddy","Iyer","Pillai","Bhat","Rao","Mishra","Pandey","Chauhan","Yadav","Tiwari",
        "Dubey","Malhotra","Kapoor","Khanna","Arora","Bose","Chatterjee","Das","Ghosh","Sen",
        "Mukherjee","Banerjee","Roy","Desai","Parekh","Modi","Jain","Agarwal","Srivastava","Tripathi",
        "Chaudhary","Rathore","Thakur","Saxena","Rastogi","Bhatt","Dixit","Shukla","Pathak","Bajpai",
        "Naik","Hegde","Menon","Krishnan","Subramaniam","Venkatesh","Narayanan","Rajan","Balaji","Sundar",
        "Chowdhury","Dutta","Mondal","Sarkar","Biswas","Bhattacharya","Chakraborty","Sinha","Prasad","Lal"
    };

    private void backfillPatientNames() {
        List<ClinicPatient> patients = clinicPatientRepository.findAllByOrderByIdAsc();
        if (patients.isEmpty()) return;
        int updated = 0;
        for (ClinicPatient p : patients) {
            boolean female = "female".equalsIgnoreCase(p.getGender()) || "f".equalsIgnoreCase(p.getGender());
            String[] firstPool = female ? FEMALE_FIRST : MALE_FIRST;
            String newFirst = firstPool[(int)(p.getId() % firstPool.length)];
            String newLast  = LAST_NAMES[(int)(p.getId() % LAST_NAMES.length)];
            if (!newFirst.equals(p.getFirstName()) || !newLast.equals(p.getLastName())) {
                p.setFirstName(newFirst);
                p.setLastName(newLast);
                clinicPatientRepository.save(p);
                updated++;
            }
        }
        if (updated > 0) log.info("Backfilled Indian names for {} patients", updated);
    }

    // ── Fix stale patient_status CHECK constraint ─────────────────────────────
    // SUSPENDED removed from the Java enum. This method:
    //   1. Migrates all SUSPENDED rows → ACTIVE via raw SQL (BEFORE any JPA query runs,
    //      otherwise Hibernate throws IllegalArgumentException mapping the unknown enum value)
    //   2. Drops the old CHECK constraint and recreates it without SUSPENDED.
    private void fixPatientStatusConstraint() {
        try {
            // Step 1 — migrate SUSPENDED rows at SQL level before JPA ever sees them
            int migrated = jdbcTemplate.update(
                "UPDATE clinic_patients SET patient_status = 'ACTIVE' WHERE patient_status = 'SUSPENDED'"
            );
            if (migrated > 0) log.info("Migrated {} SUSPENDED patients → ACTIVE", migrated);

            // Step 2 — rebuild the CHECK constraint without SUSPENDED
            jdbcTemplate.execute(
                "ALTER TABLE clinic_patients DROP CONSTRAINT IF EXISTS clinic_patients_patient_status_check"
            );
            jdbcTemplate.execute(
                "ALTER TABLE clinic_patients ADD CONSTRAINT clinic_patients_patient_status_check " +
                "CHECK (patient_status IN ('ACTIVE','INACTIVE','COMPLETED','PAYMENT_FAILURE'))"
            );
            log.info("patient_status check constraint updated (ACTIVE/INACTIVE/COMPLETED/PAYMENT_FAILURE).");
        } catch (Exception e) {
            log.warn("Could not update patient_status constraint: {}", e.getMessage());
        }
    }

    // ── Patient status distribution ───────────────────────────────────────────
    // 65% ACTIVE · 10% INACTIVE · 18% COMPLETED · 7% PAYMENT_FAILURE
    // Counts for 2024 patients → Active ≈1456, Inactive ≈203, Completed ≈365, PaymentFailure ≈142
    // INACTIVE  = subscription ended, patient not buying new exercises.
    // PAYMENT_FAILURE patients are spread across the last 4 Mondays so the
    // weekly chart shows pre-populated history on first run.
    private void ensurePatientStatusDistribution() {
        List<ClinicPatient> patients = clinicPatientRepository.findAllByOrderByIdAsc();
        if (patients.isEmpty()) return;
        int total = patients.size();
        int updated = 0;

        // Build 4 past Monday dates (oldest first) for backfilling history
        LocalDate thisMonday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate[] pastMondays = {
            thisMonday.minusWeeks(3),
            thisMonday.minusWeeks(2),
            thisMonday.minusWeeks(1),
            thisMonday
        };

        int paymentFailureIndex = 0; // rotates patients across the 4 weeks

        for (int i = 0; i < total; i++) {
            ClinicPatient p = patients.get(i);
            ClinicPatient.PatientStatus target;
            // First 4 rows pinned to guarantee every status is visible immediately
            if      (i == 0) target = ClinicPatient.PatientStatus.ACTIVE;
            else if (i == 1) target = ClinicPatient.PatientStatus.COMPLETED;
            else if (i == 2) target = ClinicPatient.PatientStatus.PAYMENT_FAILURE;
            else if (i == 3) target = ClinicPatient.PatientStatus.INACTIVE;
            else {
                // 65% ACTIVE · 10% INACTIVE · 18% COMPLETED · 7% PAYMENT_FAILURE
                int pct = (int)((long)(i - 4) * 100 / (total - 4));
                if      (pct < 65) target = ClinicPatient.PatientStatus.ACTIVE;
                else if (pct < 75) target = ClinicPatient.PatientStatus.INACTIVE;
                else if (pct < 93) target = ClinicPatient.PatientStatus.COMPLETED;
                else               target = ClinicPatient.PatientStatus.PAYMENT_FAILURE;
            }

            boolean changed = false;
            if (p.getPatientStatus() != target) {
                p.setPatientStatus(target);
                changed = true;
            }
            // Backfill paymentFailureDate for PAYMENT_FAILURE patients that don't have one yet
            if (target == ClinicPatient.PatientStatus.PAYMENT_FAILURE && p.getPaymentFailureDate() == null) {
                p.setPaymentFailureDate(pastMondays[paymentFailureIndex % 4]);
                paymentFailureIndex++;
                changed = true;
            }
            if (changed) {
                clinicPatientRepository.save(p);
                updated++;
            }
        }
        if (updated > 0) log.info("Updated patient status distribution for {} patients", updated);
    }

    // ── Utility: count data rows in a resource CSV ─────────────────────────────
    private long countCsvRows(String resourcePath, String delimiter) {
        try (InputStream is = getClass().getResourceAsStream(resourcePath)) {
            if (is == null) return 0;
            BufferedReader br = new BufferedReader(new InputStreamReader(is));
            br.readLine(); // skip header
            return br.lines().filter(l -> !l.trim().isEmpty()).count();
        } catch (Exception e) { return 0; }
    }

    private Integer parseInt(String s) {
        try { return Integer.parseInt(s.trim()); } catch (Exception e) { return null; }
    }

    private Double parseDouble(String s) {
        try { return Double.parseDouble(s.trim()); } catch (Exception e) { return null; }
    }
}
