package com.medicare.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

public class PatientDTOs {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class PatientListItem {
        private Long id;
        private String patient;
        private String firstName;
        private String lastName;
        private Integer age;
        private String gender;
        private LocalDate joinDate;
        private String status;
        private String paymentStatus;   // PAID | PENDING | FAILED
        private String injury;
        private Long doctorId;
        private String doctorAssigned;
        private String prescription;
        private String prescriptionUrl;
        private String prescriptionFileName;
        private String prescriptionFileType;
        private String report;
        private String reportUrl;
        private String reportFileName;
        private String reportFileType;
    }

    /** One row in the weekly payment failure breakdown. */
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class WeeklyPaymentStat {
        private LocalDate weekStart;   // Monday of that week
        private String weekLabel;      // e.g. "May 19 – May 25"
        private int count;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class PatientProfile {
        private Long id;
        private String patient;
        private String firstName;
        private String lastName;
        private Integer age;
        private String gender;
        private String contactPhone;
        private String contactEmail;
        private LocalDate joinDate;
        private String status;
        private String injury;
        private String diagnosis;
        private Long doctorId;
        private String doctorAssigned;
        private String prescription;
        private String prescriptionUrl;
        private String prescriptionFileName;
        private String prescriptionFileType;
        private String report;
        private String reportUrl;
        private String reportFileName;
        private String reportFileType;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class BodyPartLibraryItem {
        private Long libraryId;
        private Long bodyPartId;
        private String bodyPart;
        private String exerciseName;
        private String status;
        private String type;
        private String duration;
        private Integer sets;
        private Integer reps;
        private String frequency;
        private String difficulty;
        private Boolean publishedToApp;
        private LocalDateTime publishedAt;
        private Long activePurchasedExerciseCount;
        private Long totalExerciseCount;
        private Integer completedReps;
        private Integer targetReps;
        // ── Actual patient progress (derived from completedReps + schedule) ──
        private Integer completedSets;      // sets the patient has actually finished
        private Integer targetSets;         // total target sets across all exercises
        private Integer completedDurationMins; // actual minutes spent (progress ratio × prescribed)
        private Long    sessionCount;       // number of completed workout sessions
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ExerciseItem {
        private Long patientExerciseId;
        private Long exerciseId;
        private Long bodyPartId;
        private String bodyPart;
        private String exerciseName;
        private String description;
        private String duration;
        private Integer sets;
        private Integer reps;
        private String frequency;
        private Integer completedReps;
        private Integer targetReps;
        // ── Actual patient progress ──
        private Integer completedSets;
        private Integer targetSets;
        private Integer completedDurationMins;
        private String difficulty;
        private String status;
        private Boolean purchased;
        private Boolean publishedToApp;
        private LocalDateTime publishedAt;
        private String videoUrl;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class PatientExerciseLibraryResponse {
        private PatientProfile patient;
        private List<BodyPartLibraryItem> bodyParts;
        private List<HistoryItem> history;
        private List<ScheduleItem> previousExercises;
        private List<ScheduleItem> upcomingExercises;
        private ActivityStats activityStats;
    }

    // ── Activity Logs ─────────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ActivityLogItem {
        private Long id;
        private String eventType;          // LOGIN | LOGOUT
        private LocalDateTime loggedAt;
        private Integer sessionDurationMins; // only on LOGOUT
        private String device;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ActivityStats {
        private List<ActivityLogItem> recentLogs;    // last 30 events (LOGIN + LOGOUT)
        private List<String>          activeDays7;   // YYYY-MM-DD dates with ≥1 login in last 7 days
        private Map<String, Integer>  activityMap30; // YYYY-MM-DD → login count, last 30 days
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class BodyPartExercisesResponse {
        private PatientProfile patient;
        private BodyPartLibraryItem bodyPart;
        private List<ExerciseItem> exercises;
        private List<HistoryItem> history;
        private List<ScheduleItem> previousExercises;
        private List<ScheduleItem> upcomingExercises;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class HistoryItem {
        private Long id;
        private String eventType;
        private String title;
        private String description;
        private LocalDateTime createdAt;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ScheduleItem {
        private Long id;
        private Long patientExerciseId;
        private Long exerciseId;
        private String exerciseName;
        private String bodyPart;
        private String status;
        private LocalDate scheduledDate;
        private String notes;
        private String duration;
        private Integer sets;
        private Integer reps;
        private String difficulty;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateHistoryRequest {
        private String eventType;
        private String title;
        private String description;
    }
}
