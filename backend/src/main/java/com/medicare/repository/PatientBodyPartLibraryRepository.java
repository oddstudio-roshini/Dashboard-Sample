package com.medicare.repository;

import com.medicare.entity.BodyPart;
import com.medicare.entity.ClinicPatient;
import com.medicare.entity.PatientBodyPartLibrary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface PatientBodyPartLibraryRepository extends JpaRepository<PatientBodyPartLibrary, Long> {
    boolean existsByPatientAndBodyPart(ClinicPatient patient, BodyPart bodyPart);
    Optional<PatientBodyPartLibrary> findByPatientIdAndBodyPartId(Long patientId, Long bodyPartId);

    @Query("SELECT l FROM PatientBodyPartLibrary l JOIN FETCH l.bodyPart WHERE l.patient.id = :patientId ORDER BY l.bodyPart.displayOrder ASC, l.bodyPart.name ASC")
    List<PatientBodyPartLibrary> findByPatientIdOrderByBodyPartDisplayOrderAsc(@Param("patientId") Long patientId);

    void deleteByPatientIdAndBodyPartId(Long patientId, Long bodyPartId);
}
