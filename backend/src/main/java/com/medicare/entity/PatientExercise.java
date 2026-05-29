package com.medicare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "patient_exercises", uniqueConstraints = {
        @UniqueConstraint(name = "uk_patient_exercise", columnNames = {"patient_id", "exercise_id"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PatientExercise {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private ClinicPatient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "body_part_id", nullable = false)
    private BodyPart bodyPart;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id", nullable = false)
    private Exercise exercise;

    @Column(nullable = false)
    @Builder.Default
    private Boolean purchased = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "exercise_status", nullable = false)
    @Builder.Default
    private PatientExerciseStatus status = PatientExerciseStatus.INACTIVE;

    @Column(name = "completed_reps")
    private Integer completedReps;

    @Column(name = "published_to_app")
    @Builder.Default
    private Boolean publishedToApp = false;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (purchased == null) purchased = false;
        if (status == null) status = PatientExerciseStatus.INACTIVE;
        if (publishedToApp == null) publishedToApp = false;
    }

    public enum PatientExerciseStatus { ACTIVE, INACTIVE }
}
