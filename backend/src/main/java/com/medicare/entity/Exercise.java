package com.medicare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "exercises")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Exercise {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "body_part_id", nullable = false)
    private BodyPart bodyPart;

    @Column(name = "exercise_name", nullable = false)
    private String exerciseName;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String duration;

    @Column(name = "sets_count")
    private Integer setsCount;

    @Column(name = "reps_count")
    private Integer repsCount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Difficulty difficulty = Difficulty.EASY;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ExerciseStatus status = ExerciseStatus.ACTIVE;

    @Column(name = "frequency")
    private String frequency;

    @Column(name = "video_url", columnDefinition = "TEXT")
    private String videoUrl;

    @Column(name = "pose_type")
    private String poseType;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    // ── Exercise Library fields ───────────────────────────────────────────────
    @Column(name = "price")
    @Builder.Default
    private Integer price = 0;

    @Column(name = "views_count")
    @Builder.Default
    private Integer viewsCount = 0;

    @Column(name = "purchases_count")
    @Builder.Default
    private Integer purchasesCount = 0;

    @Column(name = "developer")
    private String developer;

    @Column(name = "developer_date")
    private LocalDate developerDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "publish_status", columnDefinition = "VARCHAR(255) DEFAULT 'DRAFT'")
    @Builder.Default
    private PublishStatus publishStatus = PublishStatus.DRAFT;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "scheduled_publish_at")
    private LocalDateTime scheduledPublishAt;

    @Column(name = "ar_json_url", columnDefinition = "TEXT")
    private String arJsonUrl;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = ExerciseStatus.ACTIVE;
        if (difficulty == null) difficulty = Difficulty.EASY;
        if (publishStatus == null) publishStatus = PublishStatus.DRAFT;
        if (price == null) price = 0;
        if (viewsCount == null) viewsCount = 0;
        if (purchasesCount == null) purchasesCount = 0;
    }

    public enum ExerciseStatus { ACTIVE, INACTIVE }
    public enum Difficulty { EASY, MEDIUM, HARD }
    public enum PublishStatus { PUBLISHED, DRAFT }
}
