package com.medicare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * DoctorLog.java (Entity) — UPDATED
 * ────────────────────────────────────
 * CHANGES:
 *   - Added DEACTIVATED to LogAction enum for auto-deactivation events
 *   - performedBy default changed to "SYSTEM" builder default removed
 *     (now set explicitly in service for ADMIN/DOCTOR/SYSTEM)
 *   - description field preserved for extra context
 *
 * performedBy values:
 *   "ADMIN"  — admin-initiated action (force logout, suspend, etc.)
 *   "DOCTOR" — doctor-initiated action (login, logout from dashboard)
 *   "SYSTEM" — auto-triggered (scheduled auto-deactivation)
 */
@Entity
@Table(name = "doctor_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "doctor_id")
    private Long doctorId;

    private String doctorName;

    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LogAction action;

    /**
     * Who triggered this action:
     *   "ADMIN"  — admin clicked force logout / suspend / etc.
     *   "DOCTOR" — doctor logged in or out from their own dashboard
     *   "SYSTEM" — automated scheduler (e.g., 3-day inactivity deactivation)
     */
    @Column(name = "performed_by")
    private String performedBy;

    private String clinic;

    @Column(name = "ip_address")
    private String ipAddress;

    private String device;

    private String notes;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    public enum LogAction {
        LOGIN,
        LOGOUT,
        FORCE_LOGOUT,
        SUSPENDED,
        ACTIVATED,
        BLOCKED,
        PASSWORD_RESET,
        PROFILE_UPDATED,
        DEACTIVATED  // NEW: auto-deactivated by system scheduler
    }
}
