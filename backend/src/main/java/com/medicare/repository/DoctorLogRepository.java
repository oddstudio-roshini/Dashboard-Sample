package com.medicare.repository;

import com.medicare.entity.DoctorLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * DoctorLogRepository.java (Repository)
 * ───────────────────────────────────────
 * Spring Data JPA repository for DoctorLog entity.
 *
 * findByDoctorIdOrderByTimestampDesc → fetch all logs for a specific doctor,
 *   newest first. Used by the "View Logs" panel in the frontend.
 *
 * findAllByOrderByTimestampDesc → fetch all logs across all doctors for
 *   a global audit trail view.
 */
@Repository
public interface DoctorLogRepository extends JpaRepository<DoctorLog, Long> {

    List<DoctorLog> findByDoctorIdOrderByTimestampDesc(Long doctorId);

    List<DoctorLog> findAllByOrderByTimestampDesc();
}