package com.medicare.dto;

import lombok.*;
import java.util.List;

public class ExerciseLibraryDTOs {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ExerciseLogDTO {
        private Long id;
        private String action;    // CREATED | UPDATED | PUBLISHED | UNPUBLISHED | DELETED
        private String details;
        private String timestamp; // ISO datetime string
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ExerciseLogsResponse {
        private String exerciseName;
        private Integer version;  // count of UPDATED actions
        private String updatedAt; // ISO string of last update, null if never updated
        private List<ExerciseLogDTO> logs;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CategoryDTO {
        private Long id;
        private String name;
        private String description;
        private Integer bundlePrice;
        private Integer exerciseCount;
        private String status;          // "published" | "draft"
        private String badgeColor;
        private String image;
        private List<ExerciseDTO> exercises;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ExerciseDTO {
        private Long id;
        private String name;
        private String level;           // "Beginner" | "Intermediate" | "Advanced"
        private String duration;
        private Integer price;
        private Boolean purchased;      // always false in library context
        private String category;
        private String developer;
        private String developerDate;
        private Integer views;
        private Integer purchases;
        private String status;          // "published" | "draft" | "scheduled"
        private String updatedAt;       // ISO datetime of last edit, null if never edited
        private String scheduledAt;     // ISO datetime of scheduled publish, null if not scheduled
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class StatsDTO {
        private Integer totalExercises;
        private Integer published;
        private Integer draft;
        private Integer totalViews;
        private Integer totalPurchases;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateExerciseRequest {
        private String name;
        private String level;
        private String duration;
        private Integer price;
        private String category;
        private String developer;
        private String status;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class PublishRequest {
        private String mode;            // "now" | "schedule"
        private String scheduleDate;
    }
}
