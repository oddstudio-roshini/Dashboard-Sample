package com.medicare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "patient_activity_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PatientActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private ClinicPatient patient;

    /** LOGIN or LOGOUT */
    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column(name = "logged_at", nullable = false)
    @Builder.Default
    private LocalDateTime loggedAt = LocalDateTime.now();

    /** Only populated on LOGOUT — duration of the session in minutes. */
    @Column(name = "session_duration_mins")
    private Integer sessionDurationMins;

    /** e.g. "Mobile App", "Web Browser", "Tablet" */
    @Column(name = "device")
    private String device;

    @PrePersist
    public void prePersist() {
        if (loggedAt == null) loggedAt = LocalDateTime.now();
    }
}
