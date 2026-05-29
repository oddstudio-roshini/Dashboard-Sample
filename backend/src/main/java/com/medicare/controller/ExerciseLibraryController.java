package com.medicare.controller;

import com.medicare.dto.ExerciseLibraryDTOs;
import com.medicare.service.ExerciseCloudSyncService;
import com.medicare.service.ExerciseLibraryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exercises")
@RequiredArgsConstructor
public class ExerciseLibraryController {

    private final ExerciseLibraryService exerciseLibraryService;
    private final ExerciseCloudSyncService exerciseCloudSyncService;

    /** GET /api/exercises/categories — all body-part categories with their exercises */
    @GetMapping("/categories")
    public ResponseEntity<List<ExerciseLibraryDTOs.CategoryDTO>> getCategories() {
        return ResponseEntity.ok(exerciseLibraryService.getCategories());
    }

    /** GET /api/exercises/stats — aggregate totals for the admin dashboard */
    @GetMapping("/stats")
    public ResponseEntity<ExerciseLibraryDTOs.StatsDTO> getStats() {
        return ResponseEntity.ok(exerciseLibraryService.getStats());
    }

    /** PUT /api/exercises/{id} — edit name, level, duration, price, category, developer, status */
    @PutMapping("/{id}")
    public ResponseEntity<ExerciseLibraryDTOs.ExerciseDTO> updateExercise(
            @PathVariable Long id,
            @RequestBody ExerciseLibraryDTOs.UpdateExerciseRequest req) {
        return ResponseEntity.ok(exerciseLibraryService.updateExercise(id, req));
    }

    /** DELETE /api/exercises/{id} — permanently remove an exercise */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExercise(@PathVariable Long id) {
        exerciseLibraryService.deleteExercise(id);
        return ResponseEntity.noContent().build();
    }

    /** PATCH /api/exercises/{id}/publish — toggle published ↔ draft */
    @PatchMapping("/{id}/publish")
    public ResponseEntity<ExerciseLibraryDTOs.ExerciseDTO> togglePublish(
            @PathVariable Long id,
            @RequestBody ExerciseLibraryDTOs.PublishRequest req) {
        return ResponseEntity.ok(exerciseLibraryService.togglePublish(id, req));
    }

    /** GET /api/exercises/{id}/logs — activity log timeline for one exercise */
    @GetMapping("/{id}/logs")
    public ResponseEntity<ExerciseLibraryDTOs.ExerciseLogsResponse> getLogs(@PathVariable Long id) {
        return ResponseEntity.ok(exerciseLibraryService.getLogs(id));
    }

    /** POST /api/exercises/cloud-sync — pull new exercises from hosted JSON into the library */
    @PostMapping("/cloud-sync")
    public ResponseEntity<Map<String, Object>> cloudSync() {
        return ResponseEntity.ok(exerciseCloudSyncService.sync());
    }
}
