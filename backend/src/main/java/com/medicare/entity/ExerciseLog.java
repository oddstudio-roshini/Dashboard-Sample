package com.medicare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "exercise_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExerciseLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Plain column — not a FK so logs survive exercise deletion */
    @Column(name = "exercise_id", nullable = false)
    private Long exerciseId;

    @Column(name = "exercise_name")
    private String exerciseName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LogAction action;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    public enum LogAction {
        CREATED, UPDATED, PUBLISHED, UNPUBLISHED, DELETED
    }
}
