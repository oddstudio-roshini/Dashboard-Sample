package com.medicare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "patient_body_part_library", uniqueConstraints = {
        @UniqueConstraint(name = "uk_patient_body_part", columnNames = {"patient_id", "body_part_id"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PatientBodyPartLibrary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private ClinicPatient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "body_part_id", nullable = false)
    private BodyPart bodyPart;

    @Enumerated(EnumType.STRING)
    @Column(name = "library_status", nullable = false)
    @Builder.Default
    private LibraryStatus status = LibraryStatus.INACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(name = "purchase_type", nullable = false)
    @Builder.Default
    private PurchaseType purchaseType = PurchaseType.NONE;

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
        if (status == null) status = LibraryStatus.INACTIVE;
        if (purchaseType == null) purchaseType = PurchaseType.NONE;
        if (publishedToApp == null) publishedToApp = false;
    }

    public enum LibraryStatus { ACTIVE, INACTIVE }
    public enum PurchaseType { NONE, SINGLE, BUNDLE }
}
