package com.medicare.service;

import com.medicare.config.JwtUtil;
import com.medicare.dto.DTOs.*;
import com.medicare.entity.Doctor;
import com.medicare.entity.Doctor.DoctorStatus;
import com.medicare.entity.DoctorLog;
import com.medicare.entity.DoctorLog.LogAction;
import com.medicare.repository.DoctorRepository;
import com.medicare.repository.DoctorLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * DoctorService.java
 * ──────────────────
 * UPDATES IN THIS VERSION:
 *
 * 1. autoInactiveDoctors() — runs every hour.
 *    Marks a doctor INACTIVE only if:
 *      - lastLogin is more than 3 days ago (or has never logged in but was created > 3 days ago)
 *      - doctor is NOT currently online (isOnline = false)
 *      - doctor is NOT suspended (isSuspended = false)
 *      - current status is ACTIVE (don't touch BLOCKED doctors)
 *    Also logs a DEACTIVATED event for audit trail.
 *
 * 2. doctorLogout() — now also sets lastLogout timestamp.
 *    This is the doctor-initiated logout (performedBy = "DOCTOR").
 *
 * 3. forceLogout() — sets isOnline=false + lastLogout timestamp.
 *    performedBy = "ADMIN" in the log.
 *
 * 4. DoctorAuthService.login() — sets isOnline=true on login.
 *    DoctorAuthService.logout() — sets isOnline=false + lastLogout.
 *
 * 5. mapToLogResponse() — passes performedBy through to frontend correctly.
 */
@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final DoctorLogRepository doctorLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // ─── SCHEDULED: AUTO-DEACTIVATE AFTER 3 DAYS OF INACTIVITY ──────────────

    /**
     * Runs every hour.
     * Deactivates doctors who haven't logged in for 3+ days and are not currently active.
     * Does NOT touch suspended (BLOCKED) doctors.
     */
    @Scheduled(cron = "0 0 * * * *")
    public void autoInactiveDoctors() {
        updateInactiveDoctors();
    }

    public void updateInactiveDoctors() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(3);
        List<Doctor> doctors = doctorRepository.findAll();

        for (Doctor doctor : doctors) {
            // Skip if not ACTIVE (don't touch BLOCKED/INACTIVE doctors)
            if (doctor.getStatus() != DoctorStatus.ACTIVE) continue;
            // Skip if currently online
            if (Boolean.TRUE.equals(doctor.getIsOnline())) continue;
            // Skip if suspended
            if (Boolean.TRUE.equals(doctor.getIsSuspended())) continue;

            // Determine reference time: lastLogin if available, else createdAt
            LocalDateTime referenceTime = doctor.getLastLogin() != null
                    ? doctor.getLastLogin()
                    : doctor.getCreatedAt();

            if (referenceTime != null && referenceTime.isBefore(cutoff)) {
                doctor.setStatus(DoctorStatus.INACTIVE);
                doctorRepository.save(doctor);

                // Audit log for auto-deactivation
                DoctorLog log = DoctorLog.builder()
                        .doctorId(doctor.getId())
                        .doctorName(doctor.getFirstName() + " " + doctor.getLastName())
                        .action(LogAction.DEACTIVATED) // new action for system auto-deactivation
                        .performedBy("SYSTEM")
                        .clinic(doctor.getClinicHospital())
                        .notes("Account auto-deactivated: no login for 3+ days")
                        .timestamp(LocalDateTime.now())
                        .build();
                doctorLogRepository.save(log);
            }
        }
    }

    // ─── CREATE ──────────────────────────────────────────────────────────────

    @Transactional
    public DoctorResponse createDoctor(CreateDoctorRequest request) {
        if (doctorRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered: " + request.getEmail());
        }

        // Auto-generate Doctor ID (username) — DR + 8 random digits, no dash  e.g. DR63151126
        String username;
        do {
            long randomNum = (long) (Math.random() * 100_000_000);
            username = String.format("DR%08d", randomNum);
        } while (doctorRepository.existsByUsername(username));

        int randomPart = (int)(Math.random() * 9000000) + 1000000;
        String plainTempPassword = "Doctor#" + randomPart;
        String hashedTempPassword = passwordEncoder.encode(plainTempPassword);

        DoctorStatus status = request.getStatus() != null ? request.getStatus() : DoctorStatus.ACTIVE;

        // Step 1: Save with a temporary unique clinicalId placeholder (satisfies NOT NULL + UNIQUE)
        // We use the username as placeholder since it is already unique.
        Doctor doctor = Doctor.builder()
                .clinicalId("TMP-" + username)   // replaced in step 2
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .birthYear(request.getBirthYear())
                .username(username)
                .temporaryPassword(plainTempPassword)
                .password(hashedTempPassword)
                .email(request.getEmail())
                .mobileNumber(request.getMobileNumber())
                .specialization(request.getSpecialization())
                .clinicHospital(request.getClinicHospital())
                .status(status)
                .notes(request.getNotes())
                .requirePasswordChange(true)
                .build();

        Doctor saved = doctorRepository.save(doctor);

        // Step 2: Now that we have the DB-generated primary key, set the real Clinical ID → CLN-001
        saved.setClinicalId(String.format("CLN-%03d", saved.getId()));
        saved = doctorRepository.save(saved);

        System.out.println("===== CREATE DOCTOR DEBUG =====");
        System.out.println("Doctor ID (username): " + username);
        System.out.println("Clinical ID: " + saved.getClinicalId());
        System.out.println("Plain Temp Password: " + plainTempPassword);

        DoctorResponse response = mapToResponse(saved);
        response.setTemporaryPassword(plainTempPassword);
        return response;
    }

    // ─── UPDATE (EDIT PROFILE) ────────────────────────────────────────────────

    public DoctorResponse updateDoctor(Long id, UpdateDoctorRequest request) {
        Doctor doctor = findById(id);

        if (request.getFirstName() != null) doctor.setFirstName(request.getFirstName());
        if (request.getLastName() != null) doctor.setLastName(request.getLastName());
        if (request.getBirthYear() != null) doctor.setBirthYear(request.getBirthYear());
        if (request.getMobileNumber() != null) doctor.setMobileNumber(request.getMobileNumber());
        if (request.getEmail() != null && !request.getEmail().equals(doctor.getEmail())) {
            if (doctorRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new RuntimeException("Email already in use: " + request.getEmail());
            }
            doctor.setEmail(request.getEmail());
        }
        if (request.getSpecialization() != null) doctor.setSpecialization(request.getSpecialization());
        if (request.getClinicHospital() != null) doctor.setClinicHospital(request.getClinicHospital());
        if (request.getStatus() != null) doctor.setStatus(request.getStatus());
        if (request.getNotes() != null) doctor.setNotes(request.getNotes());

        Doctor saved = doctorRepository.save(doctor);
        saveLog(saved, LogAction.PROFILE_UPDATED, "Admin updated doctor profile", null, "ADMIN");
        return mapToResponse(saved);
    }

    // ─── RESET PASSWORD ───────────────────────────────────────────────────────

    public void resetPassword(Long id, String newPassword) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        doctor.setPassword(passwordEncoder.encode(newPassword));
        doctor.setRequirePasswordChange(false);
        doctorRepository.save(doctor);
        saveLog(doctor, LogAction.PASSWORD_RESET, "Admin reset doctor password", null, "ADMIN");
    }

    // ─── CHANGE PASSWORD (doctor-initiated) ──────────────────────────────────

    public void changePassword(Long id, String currentPassword, String newPassword) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        if (!passwordEncoder.matches(currentPassword, doctor.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        String hashed = passwordEncoder.encode(newPassword);
        doctor.setTemporaryPassword(hashed);
        doctor.setPassword(hashed);
        doctor.setRequirePasswordChange(false);
        doctorRepository.save(doctor);
        saveLog(doctor, LogAction.PASSWORD_RESET, "Doctor changed their own password", null, "DOCTOR");
    }

    // ─── SUSPEND ─────────────────────────────────────────────────────────────

    public DoctorResponse suspendDoctor(Long id, String reason) {
        Doctor doctor = findById(id);
        doctor.setIsSuspended(true);
        doctor.setStatus(DoctorStatus.BLOCKED);
        Doctor saved = doctorRepository.save(doctor);
        saveLog(saved, LogAction.SUSPENDED,
                reason != null ? reason : "Admin suspended this doctor account", null, "ADMIN");
        return mapToResponse(saved);
    }

    // ─── UNSUSPEND ────────────────────────────────────────────────────────────

    public DoctorResponse unsuspendDoctor(Long id) {
        Doctor doctor = findById(id);
        doctor.setIsSuspended(false);
        doctor.setStatus(DoctorStatus.ACTIVE);
        Doctor saved = doctorRepository.save(doctor);
        saveLog(saved, LogAction.ACTIVATED, "Admin reinstated doctor account", null, "ADMIN");
        return mapToResponse(saved);
    }

    // ─── FORCE LOGOUT (ADMIN) ─────────────────────────────────────────────────

    /**
     * FEATURE: Force logout is done by ADMIN.
     * Sets isOnline=false, sets lastLogout timestamp.
     * Logs with performedBy="ADMIN" and action=FORCE_LOGOUT.
     * After this, Force Logout button will be re-enabled (doctor is now offline).
     */
    public DoctorResponse forceLogout(Long id) {
        Doctor doctor = findById(id);
        doctor.setIsOnline(false);
        doctor.setLastLogout(LocalDateTime.now()); // record the force-logout time
        Doctor saved = doctorRepository.save(doctor);
        saveLog(saved, LogAction.FORCE_LOGOUT,
                "Admin force-terminated active session", null, "ADMIN");
        return mapToResponse(saved);
    }

    // ─── DOCTOR LOGIN ─────────────────────────────────────────────────────────

    /**
     * Called when doctor logs in from their dashboard.
     * Sets isOnline=true, updates lastLogin.
     * Logs with performedBy="DOCTOR".
     * After login, Force Logout button in admin panel becomes enabled (doctor is online).
     */
    public DoctorLoginResponse doctorLogin(DoctorLoginRequest request) {
        Doctor doctor = doctorRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), doctor.getPassword())) {
            throw new RuntimeException("Invalid username or password");
        }

        if (Boolean.TRUE.equals(doctor.getIsSuspended())) {
            throw new RuntimeException("Doctor account suspended");
        }

        doctor.setLastLogin(LocalDateTime.now());
        doctor.setIsOnline(true);
        doctor.setDevice("WEB");

        // If doctor was INACTIVE (auto-deactivated), reactivate on login
        if (doctor.getStatus() == DoctorStatus.INACTIVE) {
            doctor.setStatus(DoctorStatus.ACTIVE);
        }

        doctorRepository.save(doctor);

        saveLog(doctor, LogAction.LOGIN, "Doctor logged into the system", null, "DOCTOR");

        String token = jwtUtil.generateToken(doctor.getUsername());

        return DoctorLoginResponse.builder()
                .token(token)
                .doctorId(doctor.getId())
                .arthomoveId(String.format("ARTH-%03d", doctor.getId()))
                .username(doctor.getUsername())
                .fullName(doctor.getFirstName() + " " + doctor.getLastName())
                .doctorName(doctor.getFirstName() + " " + doctor.getLastName())
                .clinicalId(doctor.getClinicalId())
                .clinicHospital(doctor.getClinicHospital())
                .specialization(doctor.getSpecialization())
                .requirePasswordChange(doctor.getRequirePasswordChange())
                .build();
    }

    // ─── DOCTOR LOGOUT (DOCTOR-INITIATED) ────────────────────────────────────

    /**
     * Called when doctor clicks "Logout" from their own dashboard.
     * Sets isOnline=false, records lastLogout timestamp.
     * Logs with performedBy="DOCTOR" and action=LOGOUT.
     *
     * This is SEPARATE from FORCE_LOGOUT (which is admin-initiated).
     * In the admin View Logs panel:
     *   - LOGOUT entries show as "Logged out by Doctor"
     *   - FORCE_LOGOUT entries show as "Force logged out by Admin"
     */
    public void doctorLogout(Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        doctor.setIsOnline(false);
        doctor.setLastLogout(LocalDateTime.now()); // record exact logout time

        doctorRepository.save(doctor);

        saveLog(doctor, LogAction.LOGOUT, "Doctor logged out from their dashboard", null, "DOCTOR");
    }

    // ─── LOGS ─────────────────────────────────────────────────────────────────

    public List<DoctorLogResponse> getLogs(Long doctorId) {
        return doctorLogRepository.findByDoctorIdOrderByTimestampDesc(doctorId)
                .stream()
                .map(this::mapToLogResponse)
                .collect(Collectors.toList());
    }

    public List<DoctorLogResponse> getAllLogs() {
        return doctorLogRepository.findAllByOrderByTimestampDesc()
                .stream()
                .map(this::mapToLogResponse)
                .collect(Collectors.toList());
    }

    // ─── LIST / SEARCH ────────────────────────────────────────────────────────

    public List<DoctorResponse> getAllDoctors() {
        return doctorRepository.findAll()
                .stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<DoctorResponse> searchDoctors(String query) {
        return doctorRepository.searchDoctors(query)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<DoctorResponse> getDoctorsByStatus(String status) {
        return doctorRepository.findByStatus(DoctorStatus.valueOf(status.toUpperCase()))
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public DoctorStatsResponse getStats() {
        return DoctorStatsResponse.builder()
                .totalDoctors(doctorRepository.count())
                .activeDoctors(doctorRepository.countByStatus(DoctorStatus.ACTIVE))
                .inactiveDoctors(doctorRepository.countByStatus(DoctorStatus.INACTIVE))
                .build();
    }

    public DoctorResponse updateDoctorStatus(Long id, String status) {
        Doctor doctor = findById(id);
        DoctorStatus newStatus = DoctorStatus.valueOf(status.toUpperCase());
        doctor.setStatus(newStatus);

        LogAction action = newStatus == DoctorStatus.BLOCKED ? LogAction.BLOCKED : LogAction.ACTIVATED;
        Doctor saved = doctorRepository.save(doctor);
        saveLog(saved, action, "Status changed to " + status, null, "ADMIN");
        return mapToResponse(saved);
    }

    public void deleteDoctor(Long id) {
        if (!doctorRepository.existsById(id)) {
            throw new RuntimeException("Doctor not found with id: " + id);
        }
        doctorRepository.deleteById(id);
    }

    // ─── HELPERS ─────────────────────────────────────────────────────────────

    private Doctor findById(Long id) {
        return doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found with id: " + id));
    }

    /**
     * Saves an audit log entry.
     * @param performedBy "ADMIN", "DOCTOR", or "SYSTEM"
     */
    private void saveLog(Doctor doctor, LogAction action, String notes, String ipAddress, String performedBy) {
        DoctorLog log = DoctorLog.builder()
                .doctorId(doctor.getId())
                .doctorName(doctor.getFirstName() + " " + doctor.getLastName())
                .action(action)
                .performedBy(performedBy)
                .clinic(doctor.getClinicHospital())
                .device(doctor.getDevice())
                .ipAddress(ipAddress)
                .notes(notes)
                .timestamp(LocalDateTime.now())
                .build();
        doctorLogRepository.save(log);
    }

    // Overload for backward compat — defaults to ADMIN
    private void saveLog(Doctor doctor, LogAction action, String notes, String ipAddress) {
        saveLog(doctor, action, notes, ipAddress, "ADMIN");
    }

    private DoctorResponse mapToResponse(Doctor doctor) {
        return DoctorResponse.builder()
                .id(doctor.getId())
                .arthomoveId(String.format("ARTH-%03d", doctor.getId()))
                .clinicalId(doctor.getClinicalId())
                .firstName(doctor.getFirstName())
                .lastName(doctor.getLastName())
                .fullName(doctor.getFirstName() + " " + doctor.getLastName())
                .birthYear(doctor.getBirthYear())
                .username(doctor.getUsername())
                .temporaryPassword("••••••••")
                .email(doctor.getEmail())
                .mobileNumber(doctor.getMobileNumber())
                .specialization(doctor.getSpecialization())
                .clinicHospital(doctor.getClinicHospital())
                .status(doctor.getStatus())
                .notes(doctor.getNotes())
                .requirePasswordChange(doctor.getRequirePasswordChange())
                .lastLogin(doctor.getLastLogin())
                .lastLogout(doctor.getLastLogout())
                .device(doctor.getDevice())
                .fps(doctor.getFps())
                .createdAt(doctor.getCreatedAt())
                .isSuspended(doctor.getIsSuspended())
                .isOnline(doctor.getIsOnline())
                .build();
    }

    private DoctorLogResponse mapToLogResponse(DoctorLog log) {
        return DoctorLogResponse.builder()
                .id(log.getId())
                .doctorId(log.getDoctorId())
                .doctorName(log.getDoctorName())
                .clinicalId("")
                .clinic(log.getClinic())
                .action(log.getAction())
                .actionLabel(formatActionLabel(log.getAction()))
                .performedBy(log.getPerformedBy())
                .device(log.getDevice())
                .ipAddress(log.getIpAddress())
                .notes(log.getNotes())
                .timestamp(log.getTimestamp())
                .build();
    }

    private String formatActionLabel(DoctorLog.LogAction action) {
        return switch (action) {
            case LOGIN -> "Login";
            case LOGOUT -> "Logout";
            case FORCE_LOGOUT -> "Force Logout";
            case SUSPENDED -> "Suspended";
            case ACTIVATED -> "Account Activated";
            case BLOCKED -> "Account Blocked";
            case PASSWORD_RESET -> "Password Reset";
            case PROFILE_UPDATED -> "Profile Updated";
            case DEACTIVATED -> "Auto-Deactivated";
        };
    }
}
