package com.medicare.repository;

import com.medicare.entity.PatientExerciseSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface PatientExerciseScheduleRepository extends JpaRepository<PatientExerciseSchedule, Long> {
    long countByPatientId(Long patientId);
    long countByPatientExerciseId(Long patientExerciseId);
    List<PatientExerciseSchedule> findByPatientIdAndScheduledDateBeforeOrderByScheduledDateDesc(Long patientId, LocalDate date);
    List<PatientExerciseSchedule> findByPatientIdAndScheduledDateGreaterThanEqualOrderByScheduledDateAsc(Long patientId, LocalDate date);
    List<PatientExerciseSchedule> findByPatientIdAndStatusAndScheduledDateBetweenOrderByScheduledDateDesc(
            Long patientId, PatientExerciseSchedule.ScheduleStatus status, LocalDate from, LocalDate to);
    void deleteByPatientId(Long patientId);

    // Delete all schedules linked to a specific exercise (needed before deleting the exercise)
    void deleteByPatientExercise_Exercise_Id(Long exerciseId);
}
