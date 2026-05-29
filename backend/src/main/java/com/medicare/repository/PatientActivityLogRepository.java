package com.medicare.repository;

import com.medicare.entity.PatientActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PatientActivityLogRepository extends JpaRepository<PatientActivityLog, Long> {

    long countByPatientId(Long patientId);

    List<PatientActivityLog> findByPatientIdOrderByLoggedAtDesc(Long patientId);

    List<PatientActivityLog> findByPatientIdAndLoggedAtAfterOrderByLoggedAtDesc(
            Long patientId, LocalDateTime after);
}
