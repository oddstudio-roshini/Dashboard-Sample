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

import java.util.List;

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
            @RequestBody DoctorLoginRequest request
    ) {

        DoctorLoginResponse response = doctorService.doctorLogin(request);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Doctor login successful",
                        response
                )
        );
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
}

