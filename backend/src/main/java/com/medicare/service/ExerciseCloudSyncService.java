package com.medicare.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medicare.entity.Exercise;
import com.medicare.entity.ExerciseLog;
import com.medicare.repository.ExerciseLogRepository;
import com.medicare.repository.ExerciseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExerciseCloudSyncService {

    private final ExerciseRepository exerciseRepository;
    private final ExerciseLogRepository exerciseLogRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    @Value("${exercise.cloud.base-url:}")
    private String cloudBaseUrl;

    /**
     * For each exercise in the database, tries to fetch its AR JSON from Hostinger:
     *   {baseUrl}/{name_snake_case}.json  OR  {baseUrl}/left_{name_snake_case}.json
     * Updates repsCount, setsCount, and poseType from the AR JSON when found.
     */
    @Transactional
    public Map<String, Object> sync() {
        if (cloudBaseUrl == null || cloudBaseUrl.isBlank()) {
            return Map.of("success", false, "message", "exercise.cloud.base-url not configured");
        }

        String base = cloudBaseUrl.endsWith("/")
                ? cloudBaseUrl.substring(0, cloudBaseUrl.length() - 1)
                : cloudBaseUrl;

        List<Exercise> exercises = exerciseRepository.findAll();
        int updated = 0, skipped = 0;

        for (Exercise exercise : exercises) {
            String key = exercise.getExerciseName().toLowerCase().replace(" ", "_");

            // Try exact name, then left_ and right_ variants (common for bilateral exercises)
            String[] candidates = { key + ".json", "left_" + key + ".json", "right_" + key + ".json" };
            Map<String, Object> arData = null;

            String confirmedUrl = null;
            for (String candidate : candidates) {
                try {
                    String raw = restTemplate.getForObject(base + "/" + candidate, String.class);
                    if (raw != null && !raw.isBlank()) {
                        arData = objectMapper.readValue(raw, new TypeReference<>() {});
                        confirmedUrl = base + "/" + candidate;
                        log.info("AR JSON found for '{}' at {}", exercise.getExerciseName(), confirmedUrl);
                        break;
                    }
                } catch (Exception e) {
                    log.debug("No AR JSON at {}/{}: {}", base, candidate, e.getMessage());
                }
            }

            if (arData == null) { skipped++; continue; }

            boolean changed = false;

            // Always store the confirmed URL so Android gets the exact correct path
            if (!confirmedUrl.equals(exercise.getArJsonUrl())) {
                exercise.setArJsonUrl(confirmedUrl);
                changed = true;
            }

            Integer reps = intVal(arData, "reps");
            if (reps != null && !reps.equals(exercise.getRepsCount())) {
                exercise.setRepsCount(reps);
                changed = true;
            }

            Integer sets = intVal(arData, "sets");
            if (sets != null && !sets.equals(exercise.getSetsCount())) {
                exercise.setSetsCount(sets);
                changed = true;
            }

            // evaluator_type: "shoulder_flexion" → poseType: "SHOULDER_FLEXION"
            String evalType = str(arData, "evaluator_type");
            if (evalType != null) {
                String poseType = evalType.toUpperCase();
                if (!poseType.equals(exercise.getPoseType())) {
                    exercise.setPoseType(poseType);
                    changed = true;
                }
            }

            if (changed) {
                exercise.setUpdatedAt(LocalDateTime.now());
                exerciseRepository.save(exercise);
                exerciseLogRepository.save(ExerciseLog.builder()
                        .exerciseId(exercise.getId())
                        .exerciseName(exercise.getExerciseName())
                        .action(ExerciseLog.LogAction.UPDATED)
                        .details("AR data synced from cloud: reps=" + exercise.getRepsCount()
                                + ", sets=" + exercise.getSetsCount()
                                + ", poseType=" + exercise.getPoseType())
                        .timestamp(LocalDateTime.now())
                        .build());
                updated++;
                log.info("Updated AR data for: {}", exercise.getExerciseName());
            } else {
                skipped++;
            }
        }

        return Map.of("success", true, "updated", updated, "skipped", skipped,
                "message", "AR sync complete: " + updated + " updated, " + skipped + " skipped/not found");
    }

    private String str(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v instanceof String s ? s : null;
    }

    private Integer intVal(Map<String, Object> m, String key) {
        Object v = m.get(key);
        if (v instanceof Integer i) return i;
        if (v instanceof Number n) return n.intValue();
        return null;
    }

}
