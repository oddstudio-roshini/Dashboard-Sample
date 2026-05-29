package com.medicare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "body_parts", uniqueConstraints = {
        @UniqueConstraint(name = "uk_body_parts_name", columnNames = "name")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BodyPart {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BodyPartStatus status = BodyPartStatus.ACTIVE;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    // ── Exercise Library fields ───────────────────────────────────────────────
    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "bundle_price")
    @Builder.Default
    private Integer bundlePrice = 0;

    @Column(name = "badge_color")
    @Builder.Default
    private String badgeColor = "#3b82f6";

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "publish_status", columnDefinition = "VARCHAR(255) DEFAULT 'PUBLISHED'")
    @Builder.Default
    private PublishStatus publishStatus = PublishStatus.PUBLISHED;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = BodyPartStatus.ACTIVE;
        if (publishStatus == null) publishStatus = PublishStatus.PUBLISHED;
        if (bundlePrice == null) bundlePrice = 0;
        if (badgeColor == null) badgeColor = "#3b82f6";
    }

    public enum BodyPartStatus { ACTIVE, INACTIVE }
    public enum PublishStatus { PUBLISHED, DRAFT }
}
