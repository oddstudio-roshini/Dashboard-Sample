package com.medicare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "clinic_doctors")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClinicDoctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    private String specialization;

    @Column(name = "highest_qualification")
    private String highestQualification;

    @Column(name = "registration_number")
    private String registrationNumber;

    @Column(name = "experience_years")
    private Integer experienceYears;

    @Column(name = "contact_phone")
    private String contactPhone;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "consultation_fee")
    private Integer consultationFee;

    @Column(name = "available_days")
    private String availableDays;

    @Column(name = "consultation_hours")
    private String consultationHours;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DoctorStatus status = DoctorStatus.ACTIVE;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum DoctorStatus { ACTIVE, INACTIVE }
}
