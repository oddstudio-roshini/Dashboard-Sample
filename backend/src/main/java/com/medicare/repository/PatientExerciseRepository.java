package com.medicare.repository;

import com.medicare.entity.PatientExercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface PatientExerciseRepository extends JpaRepository<PatientExercise, Long> {
    boolean existsByPatientIdAndBodyPartId(Long patientId, Long bodyPartId);
    boolean existsByPatientIdAndExerciseId(Long patientId, Long exerciseId);
    Optional<PatientExercise> findByPatientIdAndExerciseId(Long patientId, Long exerciseId);
    List<PatientExercise> findByPatientIdAndBodyPartIdOrderByExerciseIdAsc(Long patientId, Long bodyPartId);
    List<PatientExercise> findByPatientId(Long patientId);
    List<PatientExercise> findByPatientIdAndPublishedToAppTrueOrderByPublishedAtDesc(Long patientId);
    void deleteByPatientIdAndBodyPartId(Long patientId, Long bodyPartId);

    // Used before deleting an exercise — remove all patient links first
    void deleteByExerciseId(Long exerciseId);

    // Mobile: exercises specifically pushed to this patient's app
    List<PatientExercise> findByPatientIdAndPublishedToAppTrue(Long patientId);

    /** Mobile: exercises the patient has purchased whose Exercise.publishStatus = PUBLISHED */
    @Query("SELECT pe FROM PatientExercise pe " +
           "JOIN FETCH pe.exercise e " +
           "JOIN FETCH pe.bodyPart bp " +
           "WHERE pe.patient.id = :patientId " +
           "AND pe.purchased = true " +
           "AND e.publishStatus = 'PUBLISHED' " +
           "ORDER BY e.id ASC")
    List<PatientExercise> findPublishedPurchasedByPatientId(@Param("patientId") Long patientId);
}
