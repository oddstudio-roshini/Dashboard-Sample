package com.medicare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "clinic_patients")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClinicPatient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinic_doctor_id", nullable = false)
    private ClinicDoctor clinicDoctor;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    private Integer age;
    private String gender;

    @Column(name = "contact_phone")
    private String contactPhone;

    @Column(name = "contact_email")
    private String contactEmail;

    /** BCrypt-hashed password for mobile app login. Default: "Patient@123" */
    @Column(name = "mobile_password")
    private String mobilePassword;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(columnDefinition = "TEXT")
    private String diagnosis;

    @Column(name = "injury")
    private String injury;

    @Column(name = "join_date")
    private LocalDate joinDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "patient_status")
    @Builder.Default
    private PatientStatus patientStatus = PatientStatus.ACTIVE;

    @Column(name = "appointment_date")
    private LocalDate appointmentDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "appointment_status")
    @Builder.Default
    private AppointmentStatus appointmentStatus = AppointmentStatus.SCHEDULED;

    @Column(name = "visit_type")
    private String visitType;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "prescription", columnDefinition = "TEXT")
    private String prescription;

    @Column(name = "report", columnDefinition = "TEXT")
    private String report;

    @Column(name = "prescription_url", columnDefinition = "TEXT")
    private String prescriptionUrl;

    @Column(name = "prescription_file_name")
    private String prescriptionFileName;

    @Column(name = "prescription_file_type")
    private String prescriptionFileType;

    @Column(name = "report_url", columnDefinition = "TEXT")
    private String reportUrl;

    @Column(name = "report_file_name")
    private String reportFileName;

    @Column(name = "report_file_type")
    private String reportFileType;

    /** Set every time this patient is marked PAYMENT_FAILURE (weekly scheduler). Kept after restoration so history is preserved. */
    @Column(name = "payment_failure_date")
    private LocalDate paymentFailureDate;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (joinDate == null) joinDate = LocalDate.now();
        if (patientStatus == null) patientStatus = PatientStatus.ACTIVE;
        if (appointmentStatus == null) appointmentStatus = AppointmentStatus.SCHEDULED;
    }

    public enum AppointmentStatus { SCHEDULED, COMPLETED, CANCELLED }
    // INACTIVE kept for DB backward-compatibility; ensurePatientStatusDistribution() replaces it on startup
    public enum PatientStatus { ACTIVE, INACTIVE, COMPLETED, PAYMENT_FAILURE }
}
