package com.medicare.repository;

import com.medicare.entity.PatientHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PatientHistoryRepository extends JpaRepository<PatientHistory, Long> {
    long countByPatientId(Long patientId);
    List<PatientHistory> findByPatientIdOrderByCreatedAtDesc(Long patientId);
}
