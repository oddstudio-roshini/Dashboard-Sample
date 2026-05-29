package com.medicare.config;

import com.medicare.entity.BodyPart;
import com.medicare.entity.Exercise;
import com.medicare.repository.BodyPartRepository;
import com.medicare.repository.ExerciseRepository;
import com.medicare.service.PatientService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * ExerciseLibraryInitializer
 * ──────────────────────────
 * Runs after ClinicDataInitializer (@Order 2) to ensure:
 *   1. All body parts + their exercises exist in the DB (eager-seed, not lazy).
 *   2. Extra fields added for the Exercise Library UI are backfilled:
 *        BodyPart  — description, bundlePrice, badgeColor, imageUrl, publishStatus
 *        Exercise  — price, viewsCount, purchasesCount, developer, developerDate, publishStatus
 */
@Component
@Order(3)
@RequiredArgsConstructor
@Slf4j
public class ExerciseLibraryInitializer implements CommandLineRunner {

    private final PatientService patientService;
    private final BodyPartRepository bodyPartRepository;
    private final ExerciseRepository exerciseRepository;

    // ── Body-part seed data ───────────────────────────────────────────────────

    private record BodyPartSeed(String description, int bundlePrice, String badgeColor,
                                String imageUrl, BodyPart.PublishStatus publishStatus) {}

    private static final Map<String, BodyPartSeed> BP_SEEDS = Map.ofEntries(
        Map.entry("Head",
            new BodyPartSeed("Exercises for head and TMJ rehabilitation",
                1999, "#8b5cf6",
                "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=500&q=80",
                BodyPart.PublishStatus.PUBLISHED)),
        Map.entry("Neck",
            new BodyPartSeed("Exercises for neck pain and cervical mobility",
                2999, "#22c55e",
                "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500&q=80",
                BodyPart.PublishStatus.PUBLISHED)),
        Map.entry("Shoulders",
            new BodyPartSeed("Exercises for shoulder pain and mobility",
                3999, "#22c55e",
                "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80",
                BodyPart.PublishStatus.PUBLISHED)),
        Map.entry("Upper arms (left)",
            new BodyPartSeed("Left arm strengthening and recovery exercises",
                2499, "#3b82f6",
                "https://images.unsplash.com/photo-1581009137042-c552e485697a?w=500&q=80",
                BodyPart.PublishStatus.PUBLISHED)),
        Map.entry("Upper arms (right)",
            new BodyPartSeed("Right arm strengthening and recovery exercises",
                2499, "#3b82f6",
                "https://images.unsplash.com/photo-1581009137042-c552e485697a?w=500&q=80",
                BodyPart.PublishStatus.PUBLISHED)),
        Map.entry("Elbows",
            new BodyPartSeed("Exercises for elbow strength and recovery",
                2999, "#f97316",
                "https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?w=500&q=80",
                BodyPart.PublishStatus.PUBLISHED)),
        Map.entry("Forearms",
            new BodyPartSeed("Exercises for forearm strength and endurance",
                2499, "#f97316",
                "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&q=80",
                BodyPart.PublishStatus.PUBLISHED)),
        Map.entry("Wrists",
            new BodyPartSeed("Exercises for wrist flexibility and pain relief",
                2499, "#14b8a6",
                "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&q=80",
                BodyPart.PublishStatus.PUBLISHED)),
        Map.entry("Hands",
            new BodyPartSeed("Exercises for hand mobility and grip strength",
                1999, "#14b8a6",
                "https://images.unsplash.com/photo-1527719327859-c6ce80353573?w=500&q=80",
                BodyPart.PublishStatus.PUBLISHED)),
        Map.entry("Chest / Torso",
            new BodyPartSeed("Core and chest rehabilitation exercises",
                4799, "#a855f7",
                "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&q=80",
                BodyPart.PublishStatus.PUBLISHED)),
        Map.entry("Waist / Hips",
            new BodyPartSeed("Exercises for hip mobility and stability",
                3599, "#ec4899",
                "https://images.unsplash.com/photo-1607962837359-5e7e89f86776?w=500&q=80",
                BodyPart.PublishStatus.DRAFT)),
        Map.entry("Upper legs / Thighs",
            new BodyPartSeed("Exercises for quad and hamstring strength",
                3999, "#3b82f6",
                "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=500&q=80",
                BodyPart.PublishStatus.PUBLISHED)),
        Map.entry("Knees",
            new BodyPartSeed("Exercises for knee rehabilitation and strength",
                4399, "#22c55e",
                "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500&q=80",
                BodyPart.PublishStatus.PUBLISHED)),
        Map.entry("Lower legs / Calves",
            new BodyPartSeed("Calf strengthening and ankle stability exercises",
                2499, "#14b8a6",
                "https://images.unsplash.com/photo-1544135280-a1d3fb1add34?w=500&q=80",
                BodyPart.PublishStatus.PUBLISHED)),
        Map.entry("Ankles",
            new BodyPartSeed("Exercises for ankle stability and range of motion",
                2499, "#f97316",
                "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80",
                BodyPart.PublishStatus.PUBLISHED)),
        Map.entry("Feet",
            new BodyPartSeed("Exercises for foot arch and plantar fascia",
                1999, "#8b5cf6",
                "https://images.unsplash.com/photo-1571844307880-751c6d86f3f3?w=500&q=80",
                BodyPart.PublishStatus.PUBLISHED))
    );

    // ── Developer pool ────────────────────────────────────────────────────────

    private static final String[] DEVELOPERS = {
        "Dr. Sarah Johnson", "Dr. Mike Chen", "Dr. Lisa Park", "Dr. David Park"
    };
    private static final int[] DEV_DAYS_AGO = { 5, 8, 12, 15 };

    // ── Entry point ───────────────────────────────────────────────────────────

    @Override
    public void run(String... args) {
        // 1. Make sure body parts + exercises exist (runs lazily in PatientService otherwise)
        patientService.seedBodyPartsAndExercises();

        // 2. Backfill body-part library fields (only sets null / zero values)
        backfillBodyParts();

        // 3. Backfill exercise library fields
        backfillExercises();
    }

    // ── Body-part backfill ────────────────────────────────────────────────────

    private void backfillBodyParts() {
        List<BodyPart> bodyParts = bodyPartRepository.findAll();
        int updated = 0;
        for (BodyPart bp : bodyParts) {
            BodyPartSeed seed = BP_SEEDS.get(bp.getName());
            if (seed == null) continue;

            boolean changed = false;

            // Always apply seed data — body-part library fields are not edited via UI
            if (!seed.description().equals(bp.getDescription())) {
                bp.setDescription(seed.description()); changed = true;
            }
            if (!Integer.valueOf(seed.bundlePrice()).equals(bp.getBundlePrice())) {
                bp.setBundlePrice(seed.bundlePrice()); changed = true;
            }
            if (!seed.badgeColor().equals(bp.getBadgeColor())) {
                bp.setBadgeColor(seed.badgeColor()); changed = true;
            }
            if (!seed.imageUrl().equals(bp.getImageUrl())) {
                bp.setImageUrl(seed.imageUrl()); changed = true;
            }
            if (bp.getPublishStatus() == null || bp.getPublishStatus() != seed.publishStatus()) {
                bp.setPublishStatus(seed.publishStatus()); changed = true;
            }
            if (changed) { bodyPartRepository.save(bp); updated++; }
        }
        if (updated > 0) log.info("Backfilled exercise-library fields for {} body parts", updated);
    }

    // ── Exercise backfill ─────────────────────────────────────────────────────

    private void backfillExercises() {
        List<Exercise> exercises = exerciseRepository.findAll();
        int updated = 0;
        for (Exercise e : exercises) {
            boolean changed = false;
            long id = e.getId();

            if (e.getDifficulty() == null) {
                e.setDifficulty(Exercise.Difficulty.EASY); changed = true;
            }

            if (e.getPrice() == null || e.getPrice() == 0) {
                int base = switch (e.getDifficulty() != null ? e.getDifficulty() : Exercise.Difficulty.EASY) {
                    case HARD   -> 600 + (int)(id % 100);
                    case MEDIUM -> 450 + (int)(id % 100);
                    default     -> 300 + (int)(id % 100);
                };
                e.setPrice(roundTo50(base)); changed = true;
            }

            if (e.getDeveloper() == null || e.getDeveloper().isBlank()) {
                e.setDeveloper(DEVELOPERS[(int)(id % DEVELOPERS.length)]); changed = true;
            }

            if (e.getDeveloperDate() == null) {
                e.setDeveloperDate(LocalDate.now().minusDays(DEV_DAYS_AGO[(int)(id % DEV_DAYS_AGO.length)]));
                changed = true;
            }

            if (e.getViewsCount() == null || e.getViewsCount() == 0) {
                e.setViewsCount((int)((id * 137L) % 1400) + 100); changed = true;
            }

            if (e.getPurchasesCount() == null || e.getPurchasesCount() == 0) {
                e.setPurchasesCount(e.getViewsCount() / 4); changed = true;
            }

            if (e.getPublishStatus() == null) {
                e.setPublishStatus(e.getStatus() == Exercise.ExerciseStatus.ACTIVE
                        ? Exercise.PublishStatus.PUBLISHED : Exercise.PublishStatus.DRAFT);
                changed = true;
            }

            if (changed) { exerciseRepository.save(e); updated++; }
        }
        if (updated > 0) log.info("Backfilled exercise-library fields for {} exercises", updated);
    }

    private static int roundTo50(int n) {
        return (n / 50) * 50;
    }
}
