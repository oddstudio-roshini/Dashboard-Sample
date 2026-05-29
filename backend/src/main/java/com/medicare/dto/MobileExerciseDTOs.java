package com.medicare.dto;

import lombok.*;

public class MobileExerciseDTOs {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class LoginRequest {
        private Long patientId;
        private String password;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class LoginResponse {
        private Long patientId;
        private String patientName;
        private String token;          // simple Base64 identity token
        private String status;         // patient status e.g. ACTIVE
        private String injury;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class MobileExerciseDTO {
        private Long id;
        private String name;
        private String bodyPart;
        private String description;
        private String duration;
        private String level;          // Beginner | Intermediate | Advanced
        private String difficulty;     // EASY | MEDIUM | HARD (raw)
        private Integer sets;
        private Integer reps;
        private String frequency;
        private String developer;
        private String developerDate;
        private Integer price;
        private String videoUrl;
        private String downloadUrl;    // endpoint to hit for offline download
        private String updatedAt;      // ISO datetime of last edit, null if never edited
        private String poseType;       // e.g. "SHOULDER_FLEXION" — used by MediaPipe on Android
        private String arJsonUrl;      // AR exercise config JSON hosted on Hostinger
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ExerciseDownloadDTO {
        private Long exerciseId;
        private String name;
        private String bodyPart;
        private String description;
        private String duration;
        private String level;
        private Integer sets;
        private Integer reps;
        private String frequency;
        private String developer;
        private String instructions;
        private String poseType;
        private String arJsonUrl;      // AR exercise config JSON hosted on Hostinger
    }
}
