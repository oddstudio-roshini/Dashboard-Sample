package com.medicare.controller;

import com.medicare.dto.PatientDTOs;
import com.medicare.service.PatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    @GetMapping
    public ResponseEntity<List<PatientDTOs.PatientListItem>> getPatients() {
        return ResponseEntity.ok(patientService.getPatients());
    }

    /** Weekly payment failure counts — used by the admin dashboard payment failure panel. */
    @GetMapping("/payment-failure-weekly")
    public ResponseEntity<List<PatientDTOs.WeeklyPaymentStat>> getWeeklyPaymentStats() {
        return ResponseEntity.ok(patientService.getWeeklyPaymentFailureStats());
    }

    @GetMapping("/{patientId}/exercise-library")
    public ResponseEntity<PatientDTOs.PatientExerciseLibraryResponse> getExerciseLibrary(@PathVariable Long patientId) {
        return ResponseEntity.ok(patientService.getExerciseLibrary(patientId));
    }

    @GetMapping("/{patientId}/body-parts/{bodyPartId}/exercises")
    public ResponseEntity<PatientDTOs.BodyPartExercisesResponse> getBodyPartExercises(
            @PathVariable Long patientId,
            @PathVariable Long bodyPartId
    ) {
        return ResponseEntity.ok(patientService.getBodyPartExercises(patientId, bodyPartId));
    }

    @DeleteMapping("/{patientId}/body-parts/{bodyPartId}")
    public ResponseEntity<PatientDTOs.BodyPartLibraryItem> deleteBodyPart(
            @PathVariable Long patientId,
            @PathVariable Long bodyPartId
    ) {
        return ResponseEntity.ok(patientService.deleteBodyPart(patientId, bodyPartId));
    }

    @DeleteMapping("/{patientId}/patient-exercises/{patientExerciseId}")
    public ResponseEntity<PatientDTOs.ExerciseItem> deleteExercise(
            @PathVariable Long patientId,
            @PathVariable Long patientExerciseId
    ) {
        return ResponseEntity.ok(patientService.deletePatientExercise(patientId, patientExerciseId));
    }

    /** Toggle publishedToApp — sends/removes exercise from patient's mobile app */
    @PatchMapping("/{patientId}/patient-exercises/{patientExerciseId}/push-to-mobile")
    public ResponseEntity<PatientDTOs.ExerciseItem> pushToMobile(
            @PathVariable Long patientId,
            @PathVariable Long patientExerciseId
    ) {
        return ResponseEntity.ok(patientService.togglePushToMobile(patientId, patientExerciseId));
    }

    @PostMapping("/{patientId}/prescription")
    public ResponseEntity<PatientDTOs.PatientProfile> uploadPrescription(
            @PathVariable Long patientId,
            @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(patientService.uploadPrescription(patientId, file));
    }

    @PostMapping("/{patientId}/report")
    public ResponseEntity<PatientDTOs.PatientProfile> uploadReport(
            @PathVariable Long patientId,
            @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(patientService.uploadReport(patientId, file));
    }

    @GetMapping("/{patientId}/history")
    public ResponseEntity<List<PatientDTOs.HistoryItem>> getHistory(@PathVariable Long patientId) {
        return ResponseEntity.ok(patientService.getHistory(patientId));
    }

    @PostMapping("/{patientId}/history")
    public ResponseEntity<PatientDTOs.HistoryItem> addHistory(
            @PathVariable Long patientId,
            @RequestBody PatientDTOs.CreateHistoryRequest request
    ) {
        return ResponseEntity.ok(patientService.addManualHistory(patientId, request));
    }

    @GetMapping("/{patientId}/previous-exercises")
    public ResponseEntity<List<PatientDTOs.ScheduleItem>> getPreviousExercises(@PathVariable Long patientId) {
        return ResponseEntity.ok(patientService.getPreviousExercises(patientId));
    }

    @GetMapping("/{patientId}/upcoming-exercises")
    public ResponseEntity<List<PatientDTOs.ScheduleItem>> getUpcomingExercises(@PathVariable Long patientId) {
        return ResponseEntity.ok(patientService.getUpcomingExercises(patientId));
    }

    @GetMapping("/{patientId}/published-exercises")
    public ResponseEntity<List<PatientDTOs.ExerciseItem>> getPublishedExercises(@PathVariable Long patientId) {
        return ResponseEntity.ok(patientService.getPublishedExercises(patientId));
    }
}
