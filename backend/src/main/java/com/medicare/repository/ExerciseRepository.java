package com.medicare.repository;

import com.medicare.entity.BodyPart;
import com.medicare.entity.Exercise;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface ExerciseRepository extends JpaRepository<Exercise, Long> {
    long countByBodyPart(BodyPart bodyPart);
    List<Exercise> findByBodyPartOrderByIdAsc(BodyPart bodyPart);
    List<Exercise> findByBodyPartIdOrderByIdAsc(Long bodyPartId);

    // Mobile: all published exercises visible to any patient
    List<Exercise> findByPublishStatusOrderByIdAsc(Exercise.PublishStatus publishStatus);

    // Scheduler: draft exercises whose scheduled time has arrived
    List<Exercise> findByScheduledPublishAtIsNotNullAndScheduledPublishAtLessThanEqualAndPublishStatus(
            LocalDateTime now, Exercise.PublishStatus status);
}
