package com.medicare.service;

import com.medicare.entity.Exercise;
import com.medicare.entity.ExerciseLog;
import com.medicare.repository.ExerciseLogRepository;
import com.medicare.repository.ExerciseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExerciseSchedulerService {

    private final ExerciseRepository exerciseRepository;
    private final ExerciseLogRepository exerciseLogRepository;

    /**
     * Runs every 30 seconds. Finds draft exercises whose scheduledPublishAt
     * has arrived and flips them to PUBLISHED.
     */
    @Scheduled(fixedRate = 30_000)
    @Transactional
    public void publishDueExercises() {
        LocalDateTime now = LocalDateTime.now();
        List<Exercise> due = exerciseRepository
                .findByScheduledPublishAtIsNotNullAndScheduledPublishAtLessThanEqualAndPublishStatus(
                        now, Exercise.PublishStatus.DRAFT);

        for (Exercise ex : due) {
            ex.setPublishStatus(Exercise.PublishStatus.PUBLISHED);
            ex.setScheduledPublishAt(null);
            exerciseRepository.save(ex);

            exerciseLogRepository.save(ExerciseLog.builder()
                    .exerciseId(ex.getId())
                    .exerciseName(ex.getExerciseName())
                    .action(ExerciseLog.LogAction.PUBLISHED)
                    .details("Automatically published at scheduled time")
                    .timestamp(now)
                    .build());

            log.info("Auto-published exercise '{}' (id={})", ex.getExerciseName(), ex.getId());
        }
    }
}
