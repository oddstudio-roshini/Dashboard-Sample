package com.medicare.controller;

import com.medicare.dto.MobileExerciseDTOs;
import com.medicare.service.MobileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * MobileController — REST API for the Android patient app
 *
 * Endpoints:
 *   POST /api/mobile/login                          — patient login (id + "patient123")
 *   GET  /api/mobile/patients/{id}/exercises        — published exercises the patient bought
 *   GET  /api/mobile/exercises/{id}/download        — full exercise detail for offline storage
 */
@RestController
@RequestMapping("/api/mobile")
@RequiredArgsConstructor
public class MobileController {

    private final MobileService mobileService;

    /** Login: { "patientId": 1, "password": "Patient@123" } */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody MobileExerciseDTOs.LoginRequest req) {
        try {
            MobileExerciseDTOs.LoginResponse response = mobileService.login(req.getPatientId(), req.getPassword());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    /** Exercises the patient has purchased that are PUBLISHED by admin */
    @GetMapping("/patients/{patientId}/exercises")
    public ResponseEntity<?> getPatientExercises(@PathVariable Long patientId) {
        try {
            List<MobileExerciseDTOs.MobileExerciseDTO> exercises =
                    mobileService.getPatientExercises(patientId);
            return ResponseEntity.ok(exercises);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /** Full exercise detail + instructions — saved locally by the Android app */
    @GetMapping("/exercises/{exerciseId}/download")
    public ResponseEntity<?> downloadExercise(@PathVariable Long exerciseId) {
        try {
            MobileExerciseDTOs.ExerciseDownloadDTO dto =
                    mobileService.getExerciseDownload(exerciseId);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}
