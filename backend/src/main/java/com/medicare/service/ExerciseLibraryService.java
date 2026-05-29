package com.medicare.service;

import com.medicare.dto.ExerciseLibraryDTOs;
import com.medicare.entity.BodyPart;
import com.medicare.entity.Exercise;
import com.medicare.entity.ExerciseLog;
import com.medicare.repository.BodyPartRepository;
import com.medicare.repository.ExerciseLogRepository;
import com.medicare.repository.ExerciseRepository;
import com.medicare.repository.PatientExerciseRepository;
import com.medicare.repository.PatientExerciseScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExerciseLibraryService {

    private final BodyPartRepository bodyPartRepository;
    private final ExerciseRepository exerciseRepository;
    private final ExerciseLogRepository exerciseLogRepository;
    private final PatientExerciseRepository patientExerciseRepository;
    private final PatientExerciseScheduleRepository patientExerciseScheduleRepository;

    // ── Read ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ExerciseLibraryDTOs.CategoryDTO> getCategories() {
        return bodyPartRepository.findAllByOrderByDisplayOrderAscNameAsc().stream()
                .map(bp -> {
                    List<Exercise> exercises = exerciseRepository.findByBodyPartOrderByIdAsc(bp);
                    return ExerciseLibraryDTOs.CategoryDTO.builder()
                            .id(bp.getId())
                            .name(bp.getName())
                            .description(bp.getDescription())
                            .bundlePrice(bp.getBundlePrice() != null ? bp.getBundlePrice() : 0)
                            .exerciseCount(exercises.size())
                            .status(bp.getPublishStatus() == BodyPart.PublishStatus.PUBLISHED
                                    ? "published" : "draft")
                            .badgeColor(bp.getBadgeColor() != null ? bp.getBadgeColor() : "#3b82f6")
                            .image(bp.getImageUrl())
                            .exercises(exercises.stream()
                                    .map(this::toExerciseDTO)
                                    .collect(Collectors.toList()))
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ExerciseLibraryDTOs.StatsDTO getStats() {
        List<Exercise> all = exerciseRepository.findAll();
        int published = (int) all.stream()
                .filter(e -> e.getPublishStatus() == Exercise.PublishStatus.PUBLISHED).count();
        int draft = all.size() - published;
        int totalViews = all.stream()
                .mapToInt(e -> e.getViewsCount() != null ? e.getViewsCount() : 0).sum();
        int totalPurchases = all.stream()
                .mapToInt(e -> e.getPurchasesCount() != null ? e.getPurchasesCount() : 0).sum();
        return ExerciseLibraryDTOs.StatsDTO.builder()
                .totalExercises(all.size())
                .published(published)
                .draft(draft)
                .totalViews(totalViews)
                .totalPurchases(totalPurchases)
                .build();
    }

    @Transactional(readOnly = true)
    public ExerciseLibraryDTOs.ExerciseLogsResponse getLogs(Long id) {
        Exercise exercise = findExercise(id);
        List<ExerciseLog> logs = exerciseLogRepository.findByExerciseIdOrderByTimestampDesc(id);
        long version = exerciseLogRepository.countByExerciseIdAndAction(id, ExerciseLog.LogAction.UPDATED);
        String updatedAt = logs.stream()
                .filter(l -> l.getAction() == ExerciseLog.LogAction.UPDATED)
                .map(l -> l.getTimestamp().toString())
                .findFirst()
                .orElse(null);
        List<ExerciseLibraryDTOs.ExerciseLogDTO> logDTOs = logs.stream()
                .map(l -> ExerciseLibraryDTOs.ExerciseLogDTO.builder()
                        .id(l.getId())
                        .action(l.getAction().name())
                        .details(l.getDetails())
                        .timestamp(l.getTimestamp().toString())
                        .build())
                .collect(Collectors.toList());
        return ExerciseLibraryDTOs.ExerciseLogsResponse.builder()
                .exerciseName(exercise.getExerciseName())
                .version((int) version)
                .updatedAt(updatedAt)
                .logs(logDTOs)
                .build();
    }

    // ── Write ─────────────────────────────────────────────────────────────────

    @Transactional
    public ExerciseLibraryDTOs.ExerciseDTO updateExercise(Long id,
                                                           ExerciseLibraryDTOs.UpdateExerciseRequest req) {
        Exercise exercise = findExercise(id);
        if (req.getName() != null)      exercise.setExerciseName(req.getName());
        if (req.getDuration() != null)  exercise.setDuration(req.getDuration());
        if (req.getPrice() != null)     exercise.setPrice(req.getPrice());
        if (req.getDeveloper() != null) exercise.setDeveloper(req.getDeveloper());
        if (req.getStatus() != null) {
            exercise.setPublishStatus("published".equalsIgnoreCase(req.getStatus())
                    ? Exercise.PublishStatus.PUBLISHED : Exercise.PublishStatus.DRAFT);
        }
        if (req.getLevel() != null) {
            exercise.setDifficulty(switch (req.getLevel()) {
                case "Intermediate" -> Exercise.Difficulty.MEDIUM;
                case "Advanced"     -> Exercise.Difficulty.HARD;
                default             -> Exercise.Difficulty.EASY;
            });
        }
        if (req.getCategory() != null) {
            bodyPartRepository.findByNameIgnoreCase(req.getCategory())
                    .ifPresent(exercise::setBodyPart);
        }
        exercise.setUpdatedAt(LocalDateTime.now());
        Exercise saved = exerciseRepository.save(exercise);
        exerciseLogRepository.save(ExerciseLog.builder()
                .exerciseId(saved.getId())
                .exerciseName(saved.getExerciseName())
                .action(ExerciseLog.LogAction.UPDATED)
                .details("Exercise details updated")
                .timestamp(LocalDateTime.now())
                .build());
        return toExerciseDTO(saved);
    }

    @Transactional
    public void deleteExercise(Long id) {
        Exercise exercise = findExercise(id);
        // Save deletion log before removing the exercise
        exerciseLogRepository.save(ExerciseLog.builder()
                .exerciseId(id)
                .exerciseName(exercise.getExerciseName())
                .action(ExerciseLog.LogAction.DELETED)
                .details("Exercise permanently deleted")
                .timestamp(LocalDateTime.now())
                .build());
        // Delete in FK order: schedules → patient_exercises → exercise
        patientExerciseScheduleRepository.deleteByPatientExercise_Exercise_Id(id);
        patientExerciseRepository.deleteByExerciseId(id);
        exerciseRepository.delete(exercise);
    }

    @Transactional
    public ExerciseLibraryDTOs.ExerciseDTO togglePublish(Long id,
                                                          ExerciseLibraryDTOs.PublishRequest req) {
        Exercise exercise = findExercise(id);
        boolean isPublished = exercise.getPublishStatus() == Exercise.PublishStatus.PUBLISHED;

        // ── Schedule mode: store the time, do NOT publish yet ─────────────────
        if (!isPublished && "schedule".equals(req.getMode()) && req.getScheduleDate() != null) {
            LocalDateTime scheduledAt = parseScheduleDate(req.getScheduleDate());
            exercise.setScheduledPublishAt(scheduledAt);
            // Keep status as DRAFT — the scheduler will flip it when the time arrives
            Exercise saved = exerciseRepository.save(exercise);
            exerciseLogRepository.save(ExerciseLog.builder()
                    .exerciseId(saved.getId())
                    .exerciseName(saved.getExerciseName())
                    .action(ExerciseLog.LogAction.PUBLISHED)
                    .details("Exercise scheduled for publishing at " + scheduledAt)
                    .timestamp(LocalDateTime.now())
                    .build());
            return toExerciseDTO(saved);
        }

        // ── Publish now or Unpublish ───────────────────────────────────────────
        exercise.setScheduledPublishAt(null); // clear any pending schedule
        exercise.setPublishStatus(isPublished
                ? Exercise.PublishStatus.DRAFT
                : Exercise.PublishStatus.PUBLISHED);
        Exercise saved = exerciseRepository.save(exercise);
        exerciseLogRepository.save(ExerciseLog.builder()
                .exerciseId(saved.getId())
                .exerciseName(saved.getExerciseName())
                .action(isPublished ? ExerciseLog.LogAction.UNPUBLISHED : ExerciseLog.LogAction.PUBLISHED)
                .details(isPublished ? "Exercise unpublished (moved to draft)" : "Exercise published")
                .timestamp(LocalDateTime.now())
                .build());
        return toExerciseDTO(saved);
    }

    /** Parses datetime-local string from browser ("yyyy-MM-dd'T'HH:mm" or with seconds). */
    private LocalDateTime parseScheduleDate(String raw) {
        try {
            return LocalDateTime.parse(raw, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"));
        } catch (DateTimeParseException e1) {
            try {
                return LocalDateTime.parse(raw, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm"));
            } catch (DateTimeParseException e2) {
                return LocalDateTime.parse(raw); // ISO fallback
            }
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Exercise findExercise(Long id) {
        return exerciseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exercise not found: " + id));
    }

    private ExerciseLibraryDTOs.ExerciseDTO toExerciseDTO(Exercise e) {
        String level = switch (e.getDifficulty() != null ? e.getDifficulty() : Exercise.Difficulty.EASY) {
            case MEDIUM -> "Intermediate";
            case HARD   -> "Advanced";
            default     -> "Beginner";
        };
        // "scheduled" when a future publish time is stored but not yet published
        String status;
        if (e.getPublishStatus() == Exercise.PublishStatus.PUBLISHED) {
            status = "published";
        } else if (e.getScheduledPublishAt() != null && e.getScheduledPublishAt().isAfter(LocalDateTime.now())) {
            status = "scheduled";
        } else {
            status = "draft";
        }
        return ExerciseLibraryDTOs.ExerciseDTO.builder()
                .id(e.getId())
                .name(e.getExerciseName())
                .level(level)
                .duration(e.getDuration())
                .price(e.getPrice() != null ? e.getPrice() : 0)
                .purchased(false)
                .category(e.getBodyPart() != null ? e.getBodyPart().getName() : "")
                .developer(e.getDeveloper() != null ? e.getDeveloper() : "")
                .developerDate(e.getDeveloperDate() != null ? e.getDeveloperDate().toString() : "")
                .views(e.getViewsCount() != null ? e.getViewsCount() : 0)
                .purchases(e.getPurchasesCount() != null ? e.getPurchasesCount() : 0)
                .status(status)
                .updatedAt(e.getUpdatedAt() != null ? e.getUpdatedAt().toString() : null)
                .scheduledAt(e.getScheduledPublishAt() != null ? e.getScheduledPublishAt().toString() : null)
                .build();
    }
}
