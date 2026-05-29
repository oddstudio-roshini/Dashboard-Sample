package com.medicare.service;

import com.medicare.dto.MobileExerciseDTOs;
import com.medicare.entity.ClinicPatient;
import com.medicare.entity.Exercise;
import com.medicare.entity.PatientExercise;
import com.medicare.repository.ClinicPatientRepository;
import com.medicare.repository.ExerciseRepository;
import com.medicare.repository.PatientExerciseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MobileService {

    private final ClinicPatientRepository clinicPatientRepository;
    private final PatientExerciseRepository patientExerciseRepository;
    private final ExerciseRepository exerciseRepository;
    private final PasswordEncoder passwordEncoder;

    // ── Auth ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public MobileExerciseDTOs.LoginResponse login(Long patientId, String password) {
        ClinicPatient patient = clinicPatientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found. Check your Patient ID."));

        // Verify against the patient's own hashed mobile password
        if (patient.getMobilePassword() == null ||
                !passwordEncoder.matches(password, patient.getMobilePassword())) {
            throw new RuntimeException("Incorrect password");
        }

        // Simple token: Base64(patientId:patientId)
        String raw = patientId + ":" + patientId;
        String token = Base64.getEncoder().encodeToString(raw.getBytes());

        String status = patient.getPatientStatus() != null
                ? patient.getPatientStatus().name() : "ACTIVE";

        return MobileExerciseDTOs.LoginResponse.builder()
                .patientId(patient.getId())
                .patientName(safe(patient.getFirstName()) + " " + safe(patient.getLastName()))
                .token(token)
                .status(status)
                .injury(patient.getDiagnosis())
                .build();
    }

    // ── Exercises ─────────────────────────────────────────────────────────────

    /** Returns ALL exercises the admin has published — visible to any logged-in patient. */
    @Transactional(readOnly = true)
    public List<MobileExerciseDTOs.MobileExerciseDTO> getPatientExercises(Long patientId) {
        clinicPatientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        return exerciseRepository
                .findByPublishStatusOrderByIdAsc(Exercise.PublishStatus.PUBLISHED)
                .stream()
                .map(this::toExerciseDTODirect)
                .collect(Collectors.toList());
    }

    /** Returns a detailed download payload for a single exercise. */
    @Transactional(readOnly = true)
    public MobileExerciseDTOs.ExerciseDownloadDTO getExerciseDownload(Long exerciseId) {
        Exercise exercise = exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new RuntimeException("Exercise not found"));
        return toDownloadDTO(exercise);
    }

    // ── Mapping helpers ───────────────────────────────────────────────────────

    /** Maps directly from Exercise entity (for all-published query). */
    private MobileExerciseDTOs.MobileExerciseDTO toExerciseDTODirect(Exercise e) {
        String level = switch (e.getDifficulty() != null ? e.getDifficulty() : Exercise.Difficulty.EASY) {
            case MEDIUM -> "Intermediate";
            case HARD   -> "Advanced";
            default     -> "Beginner";
        };
        return MobileExerciseDTOs.MobileExerciseDTO.builder()
                .id(e.getId())
                .name(e.getExerciseName())
                .bodyPart(e.getBodyPart() != null ? e.getBodyPart().getName() : "")
                .description(e.getDescription() != null ? e.getDescription() : "")
                .duration(e.getDuration())
                .level(level)
                .difficulty(e.getDifficulty() != null ? e.getDifficulty().name() : "EASY")
                .sets(e.getSetsCount())
                .reps(e.getRepsCount())
                .frequency(e.getFrequency())
                .developer(e.getDeveloper() != null ? e.getDeveloper() : "")
                .developerDate(e.getDeveloperDate() != null ? e.getDeveloperDate().toString() : "")
                .price(e.getPrice() != null ? e.getPrice() : 0)
                .videoUrl(e.getVideoUrl())
                .downloadUrl("/api/mobile/exercises/" + e.getId() + "/download")
                .updatedAt(e.getUpdatedAt() != null ? e.getUpdatedAt().toString() : null)
                .poseType(e.getPoseType())
                .arJsonUrl(e.getArJsonUrl())
                .build();
    }

    private MobileExerciseDTOs.MobileExerciseDTO toMobileExerciseDTO(PatientExercise pe) {
        Exercise e = pe.getExercise();
        String level = switch (e.getDifficulty() != null ? e.getDifficulty() : Exercise.Difficulty.EASY) {
            case MEDIUM -> "Intermediate";
            case HARD   -> "Advanced";
            default     -> "Beginner";
        };
        return MobileExerciseDTOs.MobileExerciseDTO.builder()
                .id(e.getId())
                .name(e.getExerciseName())
                .bodyPart(e.getBodyPart() != null ? e.getBodyPart().getName() : "")
                .description(e.getDescription() != null ? e.getDescription() : "")
                .duration(e.getDuration())
                .level(level)
                .difficulty(e.getDifficulty() != null ? e.getDifficulty().name() : "EASY")
                .sets(e.getSetsCount())
                .reps(e.getRepsCount())
                .frequency(e.getFrequency())
                .developer(e.getDeveloper() != null ? e.getDeveloper() : "")
                .developerDate(e.getDeveloperDate() != null ? e.getDeveloperDate().toString() : "")
                .price(e.getPrice() != null ? e.getPrice() : 0)
                .videoUrl(e.getVideoUrl())
                .downloadUrl("/api/mobile/exercises/" + e.getId() + "/download")
                .arJsonUrl(e.getArJsonUrl())
                .build();
    }

    private MobileExerciseDTOs.ExerciseDownloadDTO toDownloadDTO(Exercise e) {
        String level = switch (e.getDifficulty() != null ? e.getDifficulty() : Exercise.Difficulty.EASY) {
            case MEDIUM -> "Intermediate";
            case HARD   -> "Advanced";
            default     -> "Beginner";
        };
        String instructions = buildInstructions(e);
        return MobileExerciseDTOs.ExerciseDownloadDTO.builder()
                .exerciseId(e.getId())
                .name(e.getExerciseName())
                .bodyPart(e.getBodyPart() != null ? e.getBodyPart().getName() : "")
                .description(e.getDescription() != null ? e.getDescription() : "")
                .duration(e.getDuration())
                .level(level)
                .sets(e.getSetsCount())
                .reps(e.getRepsCount())
                .frequency(e.getFrequency())
                .developer(e.getDeveloper() != null ? e.getDeveloper() : "Medicare PT")
                .instructions(instructions)
                .poseType(e.getPoseType())
                .arJsonUrl(e.getArJsonUrl())
                .build();
    }

    private String buildInstructions(Exercise e) {
        StringBuilder sb = new StringBuilder();
        sb.append("EXERCISE: ").append(e.getExerciseName()).append("\n");
        sb.append("Body Part: ").append(e.getBodyPart() != null ? e.getBodyPart().getName() : "N/A").append("\n");
        sb.append("Duration: ").append(e.getDuration()).append("\n");
        if (e.getSetsCount() != null) sb.append("Sets: ").append(e.getSetsCount()).append("\n");
        if (e.getRepsCount() != null) sb.append("Reps: ").append(e.getRepsCount()).append("\n");
        if (e.getFrequency() != null) sb.append("Frequency: ").append(e.getFrequency()).append("\n");
        sb.append("\nDescription:\n").append(e.getDescription() != null ? e.getDescription() : "Follow your therapist's guidance.");
        sb.append("\n\nRecommended by: ").append(e.getDeveloper() != null ? e.getDeveloper() : "Medicare PT Team");
        return sb.toString();
    }

    private String safe(String s) { return s != null ? s : ""; }
}
