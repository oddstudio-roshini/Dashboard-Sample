package com.medicare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "patient_exercise_schedules")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PatientExerciseSchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private ClinicPatient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_exercise_id", nullable = false)
    private PatientExercise patientExercise;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ScheduleStatus status = ScheduleStatus.UPCOMING;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = ScheduleStatus.UPCOMING;
    }

    public enum ScheduleStatus { UPCOMING, COMPLETED, CANCELLED }
}
