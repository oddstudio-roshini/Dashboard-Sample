package com.medicare.repository;

import com.medicare.entity.ExerciseLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExerciseLogRepository extends JpaRepository<ExerciseLog, Long> {
    List<ExerciseLog> findByExerciseIdOrderByTimestampDesc(Long exerciseId);
    long countByExerciseIdAndAction(Long exerciseId, ExerciseLog.LogAction action);
}
