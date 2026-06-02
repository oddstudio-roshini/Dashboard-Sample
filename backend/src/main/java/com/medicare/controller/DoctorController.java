//package com.medicare.controller;
//
//import com.medicare.dto.DTOs.*;
//import com.medicare.service.DoctorService;
//import jakarta.validation.Valid;
//import lombok.RequiredArgsConstructor;
//import org.springframework.http.HttpStatus;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.List;
//
///**
// * DoctorController.java (Controller)
// * ─────────────────────────────────────
// * REST controller for all Doctor management endpoints.
// * All endpoints require a valid JWT (enforced by JwtAuthFilter + SecurityConfig).
// *
// * Endpoints:
// *
// *   POST   /api/doctors              → Create a new doctor
// *   GET    /api/doctors              → Get all doctors (optional ?search= or ?status=)
// *   GET    /api/doctors/stats        → Get dashboard statistics
// *   PATCH  /api/doctors/{id}/status  → Update doctor status (ACTIVE/INACTIVE/BLOCKED)
// *   DELETE /api/doctors/{id}         → Delete a doctor
// *
// * Query params for GET /api/doctors:
// *   ?search=<query>   → Search by name, clinical ID, or email
// *   ?status=ACTIVE    → Filter by status
// *   (no params)       → Return all doctors
// */
//@RestController
//@RequestMapping("/api/doctors")
//@RequiredArgsConstructor
//public class DoctorController {
//
//    private final DoctorService doctorService;
//
//    @PostMapping
//    public ResponseEntity<ApiResponse<DoctorResponse>> createDoctor(
//            @Valid @RequestBody CreateDoctorRequest request) {
//        try {
//            DoctorResponse doctor = doctorService.createDoctor(request);
//            return ResponseEntity.status(HttpStatus.CREATED)
//                    .body(ApiResponse.success("Doctor created successfully", doctor));
//        } catch (RuntimeException e) {
//            return ResponseEntity.badRequest()
//                    .body(ApiResponse.error(e.getMessage()));
//        }
//    }
//
//    @GetMapping
//    public ResponseEntity<ApiResponse<List<DoctorResponse>>> getDoctors(
//            @RequestParam(required = false) String search,
//            @RequestParam(required = false) String status) {
//        try {
//            List<DoctorResponse> doctors;
//            if (search != null && !search.isBlank()) {
//                doctors = doctorService.searchDoctors(search);
//            } else if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
//                doctors = doctorService.getDoctorsByStatus(status);
//            } else {
//                doctors = doctorService.getAllDoctors();
//            }
//            return ResponseEntity.ok(ApiResponse.success("Doctors fetched", doctors));
//        } catch (RuntimeException e) {
//            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
//        }
//    }
//
//    @GetMapping("/stats")
//    public ResponseEntity<ApiResponse<DoctorStatsResponse>> getStats() {
//        return ResponseEntity.ok(
//                ApiResponse.success("Stats fetched", doctorService.getStats())
//        );
//    }
//
//    @PatchMapping("/{id}/status")
//    public ResponseEntity<ApiResponse<DoctorResponse>> updateStatus(
//            @PathVariable Long id,
//            @RequestParam String status) {
//        try {
//            DoctorResponse updated = doctorService.updateDoctorStatus(id, status);
//            return ResponseEntity.ok(ApiResponse.success("Status updated", updated));
//        } catch (RuntimeException e) {
//            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
//        }
//    }
//
//    @DeleteMapping("/{id}")
//    public ResponseEntity<ApiResponse<Void>> deleteDoctor(@PathVariable Long id) {
//        try {
//            doctorService.deleteDoctor(id);
//            return ResponseEntity.ok(ApiResponse.success("Doctor deleted", null));
//        } catch (RuntimeException e) {
//            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
//        }
//    }
//}

package com.medicare.controller;

import com.medicare.dto.DTOs.*;
import com.medicare.service.DoctorAuthService;
import com.medicare.service.DoctorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * DoctorController.java — UPDATED
 * ─────────────────────────────────
 * New endpoints added:
 *
 *   PUT    /api/doctors/{id}               → Edit doctor profile
 *   POST   /api/doctors/{id}/reset-password → Reset password (returns new temp password)
 *   POST   /api/doctors/{id}/suspend       → Suspend doctor (optional ?reason=)
 *   POST   /api/doctors/{id}/unsuspend     → Reinstate doctor
 *   POST   /api/doctors/{id}/force-logout  → Force terminate session
 *   GET    /api/doctors/{id}/logs          → Get logs for specific doctor
 *   GET    /api/doctors/logs               → Get all logs (global audit trail)
 */
@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;
    private final DoctorAuthService doctorAuthService;

    // ─── EXISTING ENDPOINTS ───────────────────────────────────────────────────

//    @PostMapping
//    public ResponseEntity<ApiResponse<DoctorResponse>> createDoctor(
//            @Valid @RequestBody CreateDoctorRequest request) {
//        try {
//            return ResponseEntity.status(HttpStatus.CREATED)
//                    .body(ApiResponse.success("Doctor created successfully", doctorService.createDoctor(request)));
//        } catch (RuntimeException e) {
//            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
//        }
//    }
@PostMapping
public ResponseEntity<ApiResponse<DoctorResponse>> createDoctor(
        @Valid @RequestBody CreateDoctorRequest request) {

    try {

        System.out.println("CONTROLLER HIT");

        DoctorResponse response =
                doctorService.createDoctor(request);

        System.out.println("DOCTOR CREATED SUCCESSFULLY");

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "Doctor created successfully",
                        response
                ));

    } catch (Exception e) {

        e.printStackTrace();

        return ResponseEntity.badRequest()
                .body(ApiResponse.error(e.getMessage()));
    }
}

    @GetMapping
    public ResponseEntity<ApiResponse<List<DoctorResponse>>> getDoctors(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {
        try {
            List<DoctorResponse> doctors;
            if (search != null && !search.isBlank()) {
                doctors = doctorService.searchDoctors(search);
            } else if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
                doctors = doctorService.getDoctorsByStatus(status);
            } else {
                doctors = doctorService.getAllDoctors();
            }
            return ResponseEntity.ok(ApiResponse.success("Doctors fetched", doctors));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DoctorResponse>> getDoctorById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Doctor fetched", doctorService.getDoctorById(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DoctorStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.success("Stats fetched", doctorService.getStats()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<DoctorResponse>> updateStatus(
            @PathVariable Long id, @RequestParam String status) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Status updated", doctorService.updateDoctorStatus(id, status)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDoctor(@PathVariable Long id) {
        try {
            doctorService.deleteDoctor(id);
            return ResponseEntity.ok(ApiResponse.success("Doctor deleted", null));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─── NEW ENDPOINTS ────────────────────────────────────────────────────────

    /**
     * PUT /api/doctors/{id}
     * Edit doctor profile fields (name, email, mobile, specialization, clinic, status, notes)
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DoctorResponse>> updateDoctor(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDoctorRequest request) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Doctor updated", doctorService.updateDoctor(id, request)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * POST /api/doctors/{id}/reset-password
     * Generate new temporary password and return it (shown once to admin)
     */
//    @PostMapping("/{id}/reset-password")
//    public ResponseEntity<ApiResponse<ResetPasswordResponse>> resetPassword(@PathVariable Long id) {
//        try {
//            return ResponseEntity.ok(ApiResponse.success("Password reset successfully", doctorService.resetPassword(id)));
//        } catch (RuntimeException e) {
//            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
//        }
//    }
    @PostMapping("/{id}/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(
            @PathVariable Long id,
            @RequestBody ResetPasswordRequest request
    ) {

        doctorService.resetPassword(id, request.getNewPassword());

        return ResponseEntity.ok(
                ApiResponse.success("Password updated successfully", null)
        );
    }

    @PostMapping("/doctor-login")
    public ResponseEntity<ApiResponse<DoctorLoginResponse>> doctorLogin(
            @RequestBody DoctorLoginRequest request) {
        try {
            DoctorLoginResponse response = doctorService.doctorLogin(request);
            return ResponseEntity.ok(ApiResponse.success("Doctor login successful", response));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * GET /api/doctors/debug-credentials?username=DR12345678
     * DEV ONLY — returns info about a doctor for debugging.
     */
    @GetMapping("/debug-credentials")
    public ResponseEntity<ApiResponse<java.util.Map<String, String>>> debugCredentials(
            @RequestParam String username) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Debug info",
                    doctorService.getDebugCredentials(username)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ── Password Setup (token-based) ──────────────────────────────────────────

    /**
     * GET /api/doctors/setup-password/validate?token=xxx
     * Validates the token and returns doctor info. Called by the /setup-password frontend page.
     */
    @GetMapping("/setup-password/validate")
    public ResponseEntity<ApiResponse<java.util.Map<String, String>>> validateSetupToken(
            @RequestParam String token) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Token valid",
                    doctorService.validateSetupToken(token)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * POST /api/doctors/setup-password/complete
     * Doctor submits their new password. Marks token as used and sets password.
     */
    @PostMapping("/setup-password/complete")
    public ResponseEntity<ApiResponse<String>> completeSetup(
            @RequestBody java.util.Map<String, String> body) {
        try {
            String token    = body.get("token");
            String password = body.get("password");
            doctorService.completePasswordSetup(token, password);
            return ResponseEntity.ok(ApiResponse.success("Password set successfully. You can now log in.", null));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * POST /api/doctors/{id}/resend-setup-link
     * Admin regenerates + resends a fresh setup link for a doctor.
     */
    @PostMapping("/{id}/resend-setup-link")
    public ResponseEntity<ApiResponse<String>> resendSetupLink(@PathVariable Long id) {
        try {
            String link = doctorService.regenerateSetupLink(id);
            return ResponseEntity.ok(ApiResponse.success("Setup link sent to doctor's email. Share manually if needed: " + link, link));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/doctor-signout/{id}")
    public ResponseEntity<ApiResponse<String>> doctorLogout(
            @PathVariable Long id
    ) {

        doctorAuthService.logout(id);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Doctor logout successful",
                        "Logout completed"
                )
        );
    }

    /**
     * POST /api/doctors/{id}/suspend?reason=...
     * Suspend a doctor (blocks access + logs reason)
     */
    @PostMapping("/{id}/suspend")
    public ResponseEntity<ApiResponse<DoctorResponse>> suspendDoctor(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Doctor suspended", doctorService.suspendDoctor(id, reason)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * POST /api/doctors/{id}/unsuspend
     * Reinstate a suspended doctor
     */
    @PostMapping("/{id}/unsuspend")
    public ResponseEntity<ApiResponse<DoctorResponse>> unsuspendDoctor(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Doctor reinstated", doctorService.unsuspendDoctor(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * POST /api/doctors/{id}/force-logout
     * Terminate active session immediately, record logout timestamp
     */
    @PostMapping("/{id}/force-logout")
    public ResponseEntity<ApiResponse<DoctorResponse>> forceLogout(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Session terminated", doctorService.forceLogout(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * POST /api/doctors/{id}/change-password
     * Doctor changes their own password from their dashboard
     */
    @PostMapping("/{id}/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @PathVariable Long id,
            @RequestBody ChangePasswordRequest request) {
        try {
            doctorService.changePassword(id, request.getCurrentPassword(), request.getNewPassword());
            return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * GET /api/doctors/{id}/logs
     * Get all audit logs for a specific doctor
     */
    @GetMapping("/{id}/logs")
    public ResponseEntity<ApiResponse<List<DoctorLogResponse>>> getDoctorLogs(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Logs fetched", doctorService.getLogs(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * GET /api/doctors/logs
     * Get all audit logs across all doctors (global view)
     */
    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<List<DoctorLogResponse>>> getAllLogs() {
        return ResponseEntity.ok(ApiResponse.success("All logs fetched", doctorService.getAllLogs()));
    }

    /**
     * GET /api/doctors/{id}/clinic-profile
     * Returns the matching ClinicDoctor profile (by email) for a Doctor account.
     */
    @GetMapping("/{id}/clinic-profile")
    public ResponseEntity<ApiResponse<com.medicare.dto.ClinicDTOs.ClinicDoctorResponse>> getClinicProfile(
            @PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Clinic profile fetched",
                    doctorService.getClinicProfile(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * GET /api/doctors/{id}/patients?search=&gender=&status=
     * Returns ClinicPatient list for the matching ClinicDoctor.
     */
    @GetMapping("/{id}/patients")
    public ResponseEntity<ApiResponse<List<com.medicare.dto.ClinicDTOs.PatientResponse>>> getDoctorPatients(
            @PathVariable Long id,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String status) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Patients fetched",
                    doctorService.getDoctorPatients(id, search, gender, status)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * POST /api/doctors/import-csv
     *
     * Accepts two CSV formats:
     *
     * Format A — ARthoMove master CSV (from arthomove_csv_data/doctors.csv):
     *   SNO, Hospital SNO, Hospital, Branch SNO, Branch Code, Doctor Name,
     *   Specialization, Contact Number, Email ID, Highest Qualification,
     *   Consultation Fee, Patients, Status
     *
     * Format B — Simple CSV:
     *   firstName, lastName, email, mobileNumber, specialization, clinicHospital, status
     *
     * Returns: { created, skipped, errors[] }
     */
    /**
     * POST /api/doctors/import-csv
     *
     * Accepts two CSV formats:
     *   Format A — ARthoMove master CSV (doctorname, emailid, hospital, ...)
     *   Format B — Simple CSV (firstName, lastName, email, mobileNumber, ...)
     *
     * Returns: { created, skipped, errors[], credentials[] }
     * credentials[] contains { name, username, tempPassword, email } for every
     * successfully created doctor — shown once in the UI so admin can distribute them.
     */
    @PostMapping("/import-csv")
    public ResponseEntity<ApiResponse<Map<String, Object>>> importCsv(
            @RequestParam("file") MultipartFile file) {

        int created = 0, skipped = 0;
        List<String> errors = new ArrayList<>();
        List<Map<String, String>> credentials = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String headerLine = reader.readLine();
            if (headerLine == null)
                return ResponseEntity.badRequest().body(ApiResponse.error("Empty CSV file"));

            String[] headers = splitCsvRow(headerLine);
            java.util.Map<String, Integer> idx = new java.util.HashMap<>();
            for (int i = 0; i < headers.length; i++)
                idx.put(headers[i].trim().toLowerCase().replaceAll("[^a-z0-9]", ""), i);

            boolean isArthomoveFormat = idx.containsKey("doctorname");

            String line;
            int rowNum = 1;
            while ((line = reader.readLine()) != null) {
                rowNum++;
                if (line.isBlank()) continue;
                String[] cols = splitCsvRow(line);

                try {
                    CreateDoctorRequest req = new CreateDoctorRequest();

                    if (isArthomoveFormat) {
                        String fullName  = getCol(cols, idx, "doctorname");
                        String email     = getCol(cols, idx, "emailid");
                        String hospital  = getCol(cols, idx, "hospital");
                        String mobile    = getCol(cols, idx, "contactnumber");
                        String spec      = getCol(cols, idx, "specialization");
                        String branchCode= getCol(cols, idx, "branchcode");
                        String qual      = getCol(cols, idx, "highestqualification");

                        if (fullName.isBlank() || email.isBlank()) {
                            errors.add("Row " + rowNum + ": Doctor Name and Email ID are required");
                            skipped++; continue;
                        }

                        String cleaned   = fullName.replaceAll("(?i)^Dr\\.?\\s*", "").trim();
                        int lastSpace    = cleaned.lastIndexOf(' ');
                        String firstName = lastSpace > 0 ? cleaned.substring(0, lastSpace).trim() : cleaned;
                        String lastName  = lastSpace > 0 ? cleaned.substring(lastSpace + 1).trim() : "—";

                        req.setFirstName(firstName);
                        req.setLastName(lastName);
                        req.setEmail(email);
                        req.setMobileNumber(mobile);
                        req.setSpecialization(spec);
                        req.setClinicHospital(hospital);
                        req.setNotes(buildNotes(branchCode, qual));

                    } else {
                        String firstName = getCol(cols, idx, "firstname");
                        String email     = getCol(cols, idx, "email");

                        if (firstName.isBlank() || email.isBlank()) {
                            errors.add("Row " + rowNum + ": firstName and email are required");
                            skipped++; continue;
                        }

                        req.setFirstName(firstName);
                        req.setLastName(getCol(cols, idx, "lastname"));
                        req.setEmail(email);
                        req.setMobileNumber(getCol(cols, idx, "mobilenumber"));
                        req.setSpecialization(getCol(cols, idx, "specialization"));
                        req.setClinicHospital(getCol(cols, idx, "clinichospital"));
                    }

                    req.setStatus(parseStatus(getCol(cols, idx, "status")));
                    req.setBirthYear(null);

                    // createDoctor returns the plain-text temporaryPassword in the response
                    DoctorResponse saved = doctorService.createDoctor(req);
                    created++;

                    // Collect credentials for this doctor
                    Map<String, String> cred = new java.util.LinkedHashMap<>();
                    cred.put("name",         saved.getFullName());
                    cred.put("username",     saved.getUsername());
                    cred.put("tempPassword", saved.getTemporaryPassword());
                    cred.put("email",        saved.getEmail());
                    cred.put("clinicalId",   saved.getClinicalId());
                    cred.put("specialization", saved.getSpecialization() != null ? saved.getSpecialization() : "");
                    credentials.add(cred);

                } catch (Exception e) {
                    errors.add("Row " + rowNum + ": " + e.getMessage());
                    skipped++;
                }
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to parse CSV: " + e.getMessage()));
        }

        java.util.Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("created",     created);
        result.put("skipped",     skipped);
        result.put("errors",      errors);
        result.put("credentials", credentials);

        return ResponseEntity.ok(ApiResponse.success(
                created + " doctors imported, " + skipped + " skipped.", result));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String[] splitCsvRow(String line) {
        List<String> cols = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder sb = new StringBuilder();
        for (char c : line.toCharArray()) {
            if (c == '"') { inQuotes = !inQuotes; }
            else if (c == ',' && !inQuotes) { cols.add(sb.toString().trim()); sb.setLength(0); }
            else { sb.append(c); }
        }
        cols.add(sb.toString().trim());
        return cols.toArray(new String[0]);
    }

    private String getCol(String[] cols, Map<String, Integer> idx, String key) {
        Integer i = idx.get(key);
        return (i != null && i < cols.length) ? cols[i].trim().replace("\"", "") : "";
    }

    private com.medicare.entity.Doctor.DoctorStatus parseStatus(String raw) {
        if (raw == null || raw.isBlank()) return com.medicare.entity.Doctor.DoctorStatus.ACTIVE;
        String up = raw.trim().toUpperCase();
        if (up.equals("ACTIVE") || up.equals("ACTIVE")) return com.medicare.entity.Doctor.DoctorStatus.ACTIVE;
        if (up.equals("INACTIVE") || up.equals("INACTIVE")) return com.medicare.entity.Doctor.DoctorStatus.INACTIVE;
        try { return com.medicare.entity.Doctor.DoctorStatus.valueOf(up); }
        catch (IllegalArgumentException e) { return com.medicare.entity.Doctor.DoctorStatus.ACTIVE; }
    }

    private String buildNotes(String branchCode, String qualification) {
        List<String> parts = new ArrayList<>();
        if (branchCode != null && !branchCode.isBlank()) parts.add("Branch: " + branchCode);
        if (qualification != null && !qualification.isBlank()) parts.add("Qualification: " + qualification);
        return String.join(" | ", parts);
    }
}

