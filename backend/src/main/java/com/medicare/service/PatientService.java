package com.medicare.service;

import com.medicare.dto.PatientDTOs;
import com.medicare.entity.*;
import com.medicare.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PatientService {

    private final ClinicPatientRepository clinicPatientRepository;
    private final BodyPartRepository bodyPartRepository;
    private final ExerciseRepository exerciseRepository;
    private final PatientBodyPartLibraryRepository libraryRepository;
    private final PatientExerciseRepository patientExerciseRepository;
    private final PatientExerciseScheduleRepository scheduleRepository;
    private final PatientHistoryRepository historyRepository;
    private final FileStorageService fileStorageService;
    private final PatientActivityLogRepository activityLogRepository;
    private final JdbcTemplate jdbcTemplate;

    private static final List<String> BODY_PARTS = List.of(
            "Head", "Neck", "Shoulders", "Upper arms (left)", "Upper arms (right)",
            "Elbows", "Forearms", "Wrists", "Hands", "Chest / Torso", "Waist / Hips",
            "Upper legs / Thighs", "Knees", "Lower legs / Calves", "Ankles", "Feet"
    );

    @Transactional
    public int seedInactivePatients() {
        Integer existing = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM clinic_patients WHERE patient_status = 'INACTIVE'", Integer.class);
        if (existing != null && existing > 0) return existing;

        Long doctorId = jdbcTemplate.queryForObject(
            "SELECT id FROM clinic_doctors ORDER BY id ASC LIMIT 1", Long.class);
        if (doctorId == null) return 0;

        String hashed = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh7y";
        Object[][] seed = {
            {"Arjun",   "Verma",    45, "Male",   "9876543210", "Back Pain",               3},
            {"Sunita",  "Rao",      52, "Female", "9876543211", "Knee Osteoarthritis",      4},
            {"Rajan",   "Sharma",   60, "Male",   "9876543212", "Shoulder Impingement",     5},
            {"Meena",   "Pillai",   38, "Female", "9876543213", "Cervical Spondylosis",     6},
            {"Deepak",  "Joshi",    47, "Male",   "9876543214", "Tennis Elbow",             7},
            {"Kavitha", "Nair",     55, "Female", "9876543215", "Hip Replacement Rehab",    8},
            {"Suresh",  "Iyer",     63, "Male",   "9876543216", "Post Fracture Rehab",      9},
            {"Anita",   "Bose",     41, "Female", "9876543217", "Wrist Pain",              10},
            {"Mohan",   "Reddy",    50, "Male",   "9876543218", "Sciatica",                11},
            {"Lakshmi", "Menon",    35, "Female", "9876543219", "Rotator Cuff Injury",     12},
            {"Vikram",  "Singh",    58, "Male",   "9876543220", "Ankle Sprain",            13},
            {"Preethi", "Kumar",    44, "Female", "9876543221", "Plantar Fasciitis",       14},
            {"Harish",  "Naidu",    67, "Male",   "9876543222", "Lumbar Disc Herniation",  15},
            {"Divya",   "Krishnan", 33, "Female", "9876543223", "Frozen Shoulder",         16},
            {"Santosh", "Yadav",    56, "Male",   "9876543224", "Hip Mobility Restriction",17},
        };
        for (Object[] row : seed) {
            java.time.LocalDate joinDate = java.time.LocalDate.now().minusMonths((int) row[6]);
            jdbcTemplate.update(
                "INSERT INTO clinic_patients (clinic_doctor_id, first_name, last_name, age, gender, " +
                "contact_phone, diagnosis, injury, join_date, patient_status, mobile_password, created_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'INACTIVE', ?, NOW())",
                doctorId, row[0], row[1], row[2], row[3], row[4], row[5], row[5], joinDate, hashed);
        }
        return seed.length;
    }

    @Transactional(readOnly = true)
    public List<PatientDTOs.PatientListItem> getPatients() {
        return clinicPatientRepository.findAllByOrderByIdAsc().stream()
                .map(this::toPatientListItem)
                .collect(Collectors.toList());
    }

    @Transactional
    public PatientDTOs.PatientListItem updateStatus(Long id, String statusStr) {
        ClinicPatient patient = getPatient(id);
        ClinicPatient.PatientStatus newStatus;
        try {
            newStatus = ClinicPatient.PatientStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + statusStr);
        }
        patient.setPatientStatus(newStatus);
        clinicPatientRepository.save(patient);
        return toPatientListItem(patient);
    }

    @Transactional
    public PatientDTOs.PatientExerciseLibraryResponse getExerciseLibrary(Long patientId) {
        ClinicPatient patient = getPatient(patientId);
        ensureSeedData();
        ensurePatientLibrary(patient);
        ensurePatientHistoryAndSchedules(patient);
        ensurePatientActivityLogs(patient);

        return PatientDTOs.PatientExerciseLibraryResponse.builder()
                .patient(toPatientProfile(patient))
                .bodyParts(libraryRepository.findByPatientIdOrderByBodyPartDisplayOrderAsc(patientId)
                        .stream().map(this::toBodyPartItem).collect(Collectors.toList()))
                .history(getHistory(patientId))
                .previousExercises(getPreviousExercises(patientId))
                .upcomingExercises(getUpcomingExercises(patientId))
                .activityStats(buildActivityStats(patientId))
                .build();
    }

    @Transactional
    public PatientDTOs.BodyPartExercisesResponse getBodyPartExercises(Long patientId, Long bodyPartId) {
        ClinicPatient patient = getPatient(patientId);
        ensureSeedData();
        ensurePatientLibrary(patient);
        ensurePatientExercises(patient, getBodyPart(bodyPartId));

        PatientBodyPartLibrary library = libraryRepository.findByPatientIdAndBodyPartId(patientId, bodyPartId)
                .orElseThrow(() -> new RuntimeException("Body part library not found"));

        return PatientDTOs.BodyPartExercisesResponse.builder()
                .patient(toPatientProfile(patient))
                .bodyPart(toBodyPartItem(library))
                .exercises(patientExerciseRepository.findByPatientIdAndBodyPartIdOrderByExerciseIdAsc(patientId, bodyPartId)
                        .stream().map(this::toExerciseItem).collect(Collectors.toList()))
                .history(getHistory(patientId))
                .previousExercises(getPreviousExercises(patientId))
                .upcomingExercises(getUpcomingExercises(patientId))
                .build();
    }

    @Transactional
    public PatientDTOs.BodyPartLibraryItem deleteBodyPart(Long patientId, Long bodyPartId) {
        ClinicPatient patient = getPatient(patientId);
        BodyPart bodyPart = getBodyPart(bodyPartId);
        PatientBodyPartLibrary library = libraryRepository.findByPatientIdAndBodyPartId(patientId, bodyPartId)
                .orElseThrow(() -> new RuntimeException("Body part library not found"));

        List<PatientExercise> exercises = patientExerciseRepository.findByPatientIdAndBodyPartIdOrderByExerciseIdAsc(patientId, bodyPartId);
        for (PatientExercise pe : exercises) {
            pe.setPurchased(false);
            pe.setPublishedToApp(false);
            pe.setPublishedAt(null);
            pe.setStatus(PatientExercise.PatientExerciseStatus.INACTIVE);
        }
        // purchaseType intentionally NOT reset — keep Single/Bundle visible even when inactive
        library.setStatus(PatientBodyPartLibrary.LibraryStatus.INACTIVE);
        library.setPublishedToApp(false);
        library.setPublishedAt(null);

        addHistory(patient, "DELETE", "Body part removed", bodyPart.getName() + " was removed from the patient's library.");
        return toBodyPartItem(libraryRepository.save(library));
    }

    @Transactional
    public PatientDTOs.ExerciseItem deletePatientExercise(Long patientId, Long patientExerciseId) {
        ClinicPatient patient = getPatient(patientId);
        PatientExercise pe = patientExerciseRepository.findById(patientExerciseId)
                .orElseThrow(() -> new RuntimeException("Patient exercise not found"));
        if (!Objects.equals(pe.getPatient().getId(), patientId)) {
            throw new RuntimeException("Exercise does not belong to this patient");
        }
        pe.setPurchased(false);
        pe.setPublishedToApp(false);
        pe.setPublishedAt(null);
        pe.setStatus(PatientExercise.PatientExerciseStatus.INACTIVE);
        addHistory(patient, "DELETE", "Exercise removed", pe.getExercise().getExerciseName() + " was removed from the patient's library.");
        return toExerciseItem(patientExerciseRepository.save(pe));
    }

    @Transactional
    public PatientDTOs.ExerciseItem togglePushToMobile(Long patientId, Long patientExerciseId) {
        ClinicPatient patient = getPatient(patientId);
        PatientExercise pe = patientExerciseRepository.findById(patientExerciseId)
                .orElseThrow(() -> new RuntimeException("Patient exercise not found"));
        if (!Objects.equals(pe.getPatient().getId(), patientId)) {
            throw new RuntimeException("Exercise does not belong to this patient");
        }
        boolean nowPushed = !Boolean.TRUE.equals(pe.getPublishedToApp());
        pe.setPublishedToApp(nowPushed);
        pe.setPublishedAt(nowPushed ? LocalDateTime.now() : null);
        String action = nowPushed ? "pushed to" : "removed from";
        addHistory(patient, nowPushed ? "PUBLISH" : "UNPUBLISH",
                "Exercise " + action + " mobile",
                pe.getExercise().getExerciseName() + " was " + action + " patient's mobile app.");
        return toExerciseItem(patientExerciseRepository.save(pe));
    }

    @Transactional
    public PatientDTOs.PatientProfile uploadPrescription(Long patientId, MultipartFile file) {
        ClinicPatient patient = getPatient(patientId);
        FileStorageService.StoredFile storedFile = fileStorageService.storePatientFile(file, patientId, "prescriptions");
        patient.setPrescriptionUrl(storedFile.fileUrl());
        patient.setPrescriptionFileName(storedFile.originalFileName());
        patient.setPrescriptionFileType(storedFile.contentType());
        patient.setPrescription(storedFile.originalFileName());
        addHistory(patient, "UPLOAD", "Prescription uploaded", storedFile.originalFileName() + " was uploaded.");
        return toPatientProfile(clinicPatientRepository.save(patient));
    }

    @Transactional
    public PatientDTOs.PatientProfile uploadReport(Long patientId, MultipartFile file) {
        ClinicPatient patient = getPatient(patientId);
        FileStorageService.StoredFile storedFile = fileStorageService.storePatientFile(file, patientId, "reports");
        patient.setReportUrl(storedFile.fileUrl());
        patient.setReportFileName(storedFile.originalFileName());
        patient.setReportFileType(storedFile.contentType());
        patient.setReport(storedFile.originalFileName());
        addHistory(patient, "UPLOAD", "Report uploaded", storedFile.originalFileName() + " was uploaded.");
        return toPatientProfile(clinicPatientRepository.save(patient));
    }

    @Transactional(readOnly = true)
    public List<PatientDTOs.HistoryItem> getHistory(Long patientId) {
        return historyRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream()
                .map(this::toHistoryItem)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PatientDTOs.ScheduleItem> getPreviousExercises(Long patientId) {
        return scheduleRepository.findByPatientIdAndScheduledDateBeforeOrderByScheduledDateDesc(patientId, LocalDate.now())
                .stream().map(this::toScheduleItem).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PatientDTOs.ScheduleItem> getUpcomingExercises(Long patientId) {
        return scheduleRepository.findByPatientIdAndScheduledDateGreaterThanEqualOrderByScheduledDateAsc(patientId, LocalDate.now())
                .stream().map(this::toScheduleItem).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PatientDTOs.ExerciseItem> getPublishedExercises(Long patientId) {
        return patientExerciseRepository.findByPatientIdAndPublishedToAppTrueOrderByPublishedAtDesc(patientId)
                .stream().map(this::toExerciseItem).collect(Collectors.toList());
    }

    @Transactional
    public PatientDTOs.HistoryItem addManualHistory(Long patientId, PatientDTOs.CreateHistoryRequest request) {
        ClinicPatient patient = getPatient(patientId);
        PatientHistory history = addHistory(patient,
                request.getEventType() == null ? "NOTE" : request.getEventType(),
                request.getTitle() == null ? "Patient note" : request.getTitle(),
                request.getDescription() == null ? "" : request.getDescription());
        return toHistoryItem(history);
    }

    private ClinicPatient getPatient(Long id) {
        return clinicPatientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found: " + id));
    }

    private BodyPart getBodyPart(Long id) {
        return bodyPartRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Body part not found: " + id));
    }

    /** Public entry point so ExerciseLibraryInitializer can eager-seed body parts + exercises on startup. */
    @Transactional
    public void seedBodyPartsAndExercises() {
        ensureSeedData();
    }

    private void ensureSeedData() {
        for (int index = 0; index < BODY_PARTS.size(); index++) {
            String name = BODY_PARTS.get(index);
            int displayOrder = index + 1;
            BodyPart bodyPart = bodyPartRepository.findByNameIgnoreCase(name)
                    .orElseGet(() -> bodyPartRepository.save(BodyPart.builder()
                            .name(name)
                            .displayOrder(displayOrder)
                            .status(BodyPart.BodyPartStatus.ACTIVE)
                            .build()));

            if (exerciseRepository.countByBodyPart(bodyPart) == 0) {
                seedExercises(bodyPart);
            } else {
                backfillExerciseFrequencies(bodyPart);
            }
        }
    }

    private static final String[] FREQUENCIES = {"2× Daily", "Daily", "3× Weekly", "4× Weekly", "5× Weekly", "Daily", "2× Daily", "3× Weekly"};

    private void backfillExerciseFrequencies(BodyPart bodyPart) {
        List<Exercise> exercises = exerciseRepository.findByBodyPartOrderByIdAsc(bodyPart);
        for (int i = 0; i < exercises.size(); i++) {
            Exercise exercise = exercises.get(i);
            if (exercise.getFrequency() == null || exercise.getFrequency().isBlank()) {
                exercise.setFrequency(FREQUENCIES[i % FREQUENCIES.length]);
                exerciseRepository.save(exercise);
            }
        }
    }

    private void seedExercises(BodyPart bodyPart) {
        List<String> names = switch (bodyPart.getName()) {
            case "Head" -> List.of("Head Tilts", "Neck Rotation");
            case "Neck" -> List.of("Neck Stretch", "Neck Side Bend", "Neck Rotation", "Chin Tuck", "Neck Extension");
            case "Shoulders" -> List.of("Shoulder Flexion", "Shoulder Abduction", "Wall Slide", "External Rotation", "Pendulum Swing");
            case "Upper arms (left)", "Upper arms (right)" -> List.of("Bicep Curls", "Tricep Extensions", "Hammer Curls", "Overhead Press", "Lateral Raises");
            case "Elbows" -> List.of("Elbow Flexion", "Elbow Extension", "Forearm Turn");
            case "Forearms" -> List.of("Forearm Pronation", "Forearm Supination", "Grip Hold");
            case "Wrists" -> List.of("Wrist Flexion", "Wrist Extension", "Wrist Circles");
            case "Hands" -> List.of("Finger Spread", "Grip Squeeze", "Thumb Opposition");
            case "Chest / Torso" -> List.of("Thoracic Extension", "Chest Opener", "Torso Rotation");
            case "Waist / Hips" -> List.of("Hip Hinge", "Pelvic Tilt", "Hip Circles");
            case "Upper legs / Thighs" -> List.of("Quad Sets", "Straight Leg Raise", "Hamstring Stretch");
            case "Knees" -> List.of("Knee Extension", "Heel Slides", "Mini Squats", "Step Ups");
            case "Lower legs / Calves" -> List.of("Calf Raises", "Calf Stretch", "Ankle Pumps");
            case "Ankles" -> List.of("Ankle Alphabet", "Ankle Circles", "Heel Raises");
            case "Feet" -> List.of("Toe Curls", "Towel Scrunch", "Arch Lifts");
            default -> List.of(bodyPart.getName() + " Mobility", bodyPart.getName() + " Strengthening");
        };

        int i = 0;
        for (String exerciseName : names) {
            i++;
            Exercise.Difficulty difficulty = i % 3 == 0 ? Exercise.Difficulty.HARD : (i % 2 == 0 ? Exercise.Difficulty.MEDIUM : Exercise.Difficulty.EASY);
            Exercise.ExerciseStatus status = i == names.size() && names.size() > 3 ? Exercise.ExerciseStatus.INACTIVE : Exercise.ExerciseStatus.ACTIVE;
            exerciseRepository.save(Exercise.builder()
                    .bodyPart(bodyPart)
                    .exerciseName(exerciseName)
                    .description("Guided " + exerciseName.toLowerCase() + " for " + bodyPart.getName() + " rehabilitation.")
                    .duration((10 + (i * 3)) + " min")
                    .setsCount(2 + (i % 3))
                    .repsCount(8 + (i * 2))
                    .frequency(FREQUENCIES[(i - 1) % FREQUENCIES.length])
                    .difficulty(difficulty)
                    .status(status)
                    .videoUrl(null)
                    .build());
        }
    }

    // Active body parts — every other body part gets a type too but starts INACTIVE
    private static final java.util.Set<String> ACTIVE_BODY_PARTS = java.util.Set.of(
            "Neck", "Shoulders", "Upper arms (left)", "Upper arms (right)", "Chest / Torso", "Knees"
    );

    private void ensurePatientLibrary(ClinicPatient patient) {
        List<BodyPart> bodyParts = bodyPartRepository.findAllByOrderByDisplayOrderAscNameAsc();
        for (BodyPart bodyPart : bodyParts) {
            PatientBodyPartLibrary.PurchaseType targetType = defaultPurchaseType(bodyPart.getName());
            PatientBodyPartLibrary.LibraryStatus targetStatus = ACTIVE_BODY_PARTS.contains(bodyPart.getName())
                    ? PatientBodyPartLibrary.LibraryStatus.ACTIVE
                    : PatientBodyPartLibrary.LibraryStatus.INACTIVE;

            PatientBodyPartLibrary existing = libraryRepository
                    .findByPatientIdAndBodyPartId(patient.getId(), bodyPart.getId())
                    .orElse(null);

            if (existing == null) {
                jdbcTemplate.update(
                    "INSERT INTO patient_body_part_library " +
                    "(patient_id, body_part_id, library_status, purchase_type, published_to_app, created_at) " +
                    "VALUES (?, ?, ?, ?, false, NOW()) " +
                    "ON CONFLICT ON CONSTRAINT uk_patient_body_part DO NOTHING",
                    patient.getId(), bodyPart.getId(), targetStatus.name(), targetType.name()
                );
            } else if (existing.getPurchaseType() == PatientBodyPartLibrary.PurchaseType.NONE) {
                // Backfill: upgrade NONE rows so every body part has a real type
                existing.setPurchaseType(targetType);
                existing.setStatus(targetStatus);
                libraryRepository.save(existing);
            }
            ensurePatientExercises(patient, bodyPart);
        }
    }

    private PatientBodyPartLibrary.PurchaseType defaultPurchaseType(String bodyPartName) {
        // Every body part is either SINGLE or BUNDLE — NONE is no longer used
        return switch (bodyPartName) {
            case "Neck", "Upper arms (left)", "Knees",
                 "Head", "Elbows", "Forearms", "Hands", "Feet"
                    -> PatientBodyPartLibrary.PurchaseType.SINGLE;
            default -> PatientBodyPartLibrary.PurchaseType.BUNDLE;
        };
    }

    private void ensurePatientExercises(ClinicPatient patient, BodyPart bodyPart) {
        PatientBodyPartLibrary library = libraryRepository.findByPatientIdAndBodyPartId(patient.getId(), bodyPart.getId())
                .orElse(null);
        if (library == null) return;

        boolean libraryInactive = library.getStatus() == PatientBodyPartLibrary.LibraryStatus.INACTIVE;

        List<Exercise> exercises = exerciseRepository.findByBodyPartOrderByIdAsc(bodyPart);
        Map<Long, PatientExercise> existingMap = patientExerciseRepository
                .findByPatientIdAndBodyPartIdOrderByExerciseIdAsc(patient.getId(), bodyPart.getId())
                .stream().collect(Collectors.toMap(pe -> pe.getExercise().getId(), pe -> pe));

        int idx = 0;
        for (Exercise exercise : exercises) {
            idx++;
            boolean purchased = switch (library.getPurchaseType()) {
                case BUNDLE -> true;
                case SINGLE -> idx == 1;
                default    -> false;
            };
            // Inactive library: purchased exercises are INACTIVE with low completedReps
            // so the UI shows "very less" progress explaining why it is inactive
            PatientExercise.PatientExerciseStatus status = (purchased && !libraryInactive && exercise.getStatus() == Exercise.ExerciseStatus.ACTIVE)
                    ? PatientExercise.PatientExerciseStatus.ACTIVE
                    : PatientExercise.PatientExerciseStatus.INACTIVE;

            PatientExercise existing = existingMap.get(exercise.getId());
            if (existing == null) {
                int completedReps = computeCompletedReps(purchased, status, exercise);
                jdbcTemplate.update(
                    "INSERT INTO patient_exercises " +
                    "(patient_id, body_part_id, exercise_id, purchased, exercise_status, completed_reps, published_to_app, created_at) " +
                    "VALUES (?, ?, ?, ?, ?, ?, false, NOW()) " +
                    "ON CONFLICT ON CONSTRAINT uk_patient_exercise DO NOTHING",
                    patient.getId(), bodyPart.getId(), exercise.getId(),
                    purchased, status.name(), completedReps
                );
            } else {
                // Backfill: update if library type changed (e.g. NONE→SINGLE/BUNDLE),
                // or completedReps is null/zero for a purchased exercise (stale seed data)
                boolean purchasedChanged = !Boolean.valueOf(purchased).equals(existing.getPurchased());
                // Only treat 0 completedReps as stale when the exercise is ACTIVE —
                // INACTIVE exercises with 0 reps are intentionally "Not Started" and must not be overwritten.
                boolean repsStale = existing.getCompletedReps() == null
                        || (Boolean.TRUE.equals(purchased)
                            && existing.getCompletedReps() == 0
                            && existing.getStatus() == PatientExercise.PatientExerciseStatus.ACTIVE);
                // Correct exercises that were wrongly seeded with reps > 0 but should be "Not Started"
                boolean notStartedCorrection = status == PatientExercise.PatientExerciseStatus.INACTIVE
                        && exercise.getId() % 3 == 0
                        && existing.getCompletedReps() != null
                        && existing.getCompletedReps() > 0;
                if (purchasedChanged || repsStale || notStartedCorrection) {
                    existing.setPurchased(purchased);
                    existing.setStatus(status);
                    existing.setCompletedReps(computeCompletedReps(purchased, status, exercise));
                    patientExerciseRepository.save(existing);
                }
            }
        }
    }

    private int computeCompletedReps(boolean purchased, PatientExercise.PatientExerciseStatus status, Exercise exercise) {
        if (!purchased) return 0;
        int target = (exercise.getSetsCount() != null ? exercise.getSetsCount() : 3)
                   * (exercise.getRepsCount()  != null ? exercise.getRepsCount()  : 10);
        if (status == PatientExercise.PatientExerciseStatus.ACTIVE) {
            return (exercise.getId() % 3 == 0) ? Math.max(10, target / 2) : target;
        } else {
            // INACTIVE exercises: split into "Not Started" (0 reps) and "Inactive" (some reps done).
            // Every 3rd exercise (by id) is Not Started — patient was assigned but never touched it.
            if (exercise.getId() % 3 == 0) return 0;          // Not Started
            return (int)(exercise.getId() % 8) + 1;            // Inactive — 1–8 reps done then stopped
        }
    }

    private void ensurePatientHistoryAndSchedules(ClinicPatient patient) {
        try {
            ensurePatientHistoryAndSchedulesInternal(patient);
        } catch (Exception e) {
            log.warn("History/schedule seeding skipped for patient {}: {}", patient.getId(), e.getMessage());
        }
    }

    private void ensurePatientHistoryAndSchedulesInternal(ClinicPatient patient) {
        // Join date is the earliest valid date for any history entry
        LocalDate joinDate = patient.getJoinDate() != null ? patient.getJoinDate() : LocalDate.now();

        long histCount = historyRepository.countByPatientId(patient.getId());
        if (histCount == 0) {
            // Profile created + initial assessment — both on/after join date
            addHistoryAt(patient, "CREATED",    "Patient profile created", "Patient was added to the rehabilitation dashboard.", joinDate.atStartOfDay());
            addHistoryAt(patient, "ASSESSMENT", "Initial assessment",      "Injury recorded as " + safe(injury(patient)) + ".", joinDate.atStartOfDay().plusHours(2));
            // Doctor assigns exercises shortly after join — this is the first "Exercises Assigned" calendar marker
            addHistoryAt(patient, "PUBLISH",    "Exercises assigned",      "Initial exercise plan assigned by the doctor.", joinDate.plusDays(3).atStartOfDay());
        }

        // ── Ensure initial exercise assignment event exists near join date ──────
        // This is the first "Exercises Assigned" calendar milestone. Without it,
        // no assignment marker appears and sessions look like they precede assignment.
        boolean hasInitialPublish = historyRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId())
                .stream().anyMatch(h -> "PUBLISH".equals(h.getEventType())
                        && h.getCreatedAt() != null
                        && !h.getCreatedAt().toLocalDate().isAfter(joinDate.plusDays(7)));
        if (!hasInitialPublish) {
            addHistoryAt(patient, "PUBLISH", "Exercises assigned",
                    "Initial exercise plan assigned by the doctor.",
                    joinDate.plusDays(3).atStartOfDay());
        }

        // ── Last-week backfill — only seed if patient was with us 9+ days ago ──
        boolean hasLastWeek = historyRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId())
                .stream().anyMatch(h -> h.getCreatedAt() != null
                        && h.getCreatedAt().isAfter(LocalDateTime.now().minusDays(14))
                        && h.getCreatedAt().isBefore(LocalDateTime.now().minusDays(4)));
        if (!hasLastWeek && !LocalDate.now().minusDays(9).isBefore(joinDate)) {
            addHistoryAt(patient, "NOTE",      "Progress noted",      "Patient showing improvement in range of motion.",        LocalDateTime.now().minusDays(5));
            addHistoryAt(patient, "ASSESSMENT","Weekly assessment",   "Pain score reduced from 7 to 5 after exercise sessions.", LocalDateTime.now().minusDays(6));
            addHistoryAt(patient, "UPLOAD",    "Report uploaded",     "Weekly physiotherapy report submitted by doctor.",        LocalDateTime.now().minusDays(8));
            addHistoryAt(patient, "NOTE",      "Exercise update",     "Doctor reviewed and updated the exercise plan.",          LocalDateTime.now().minusDays(9));
        }

        // ── Last-month backfill — only seed if patient was with us 50+ days ago ──
        boolean hasLastMonth = historyRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId())
                .stream().anyMatch(h -> h.getCreatedAt() != null
                        && h.getCreatedAt().isAfter(LocalDateTime.now().minusDays(60))
                        && h.getCreatedAt().isBefore(LocalDateTime.now().minusDays(30)));
        if (!hasLastMonth && !LocalDate.now().minusDays(50).isBefore(joinDate)) {
            addHistoryAt(patient, "CREATED",   "Prescription added",    "Initial prescription uploaded for " + safe(injury(patient)) + " treatment.", LocalDateTime.now().minusDays(35));
            addHistoryAt(patient, "ASSESSMENT","Monthly review",        "Monthly progress review completed. Treatment plan updated.",                  LocalDateTime.now().minusDays(38));
            addHistoryAt(patient, "NOTE",      "Doctor observation",    "Doctor noted consistent compliance with home exercise program.",              LocalDateTime.now().minusDays(42));
            addHistoryAt(patient, "UPLOAD",    "Report uploaded",       "Monthly physiotherapy progress report uploaded.",                            LocalDateTime.now().minusDays(45));
            addHistoryAt(patient, "NOTE",      "Exercise plan reviewed","Exercise bundle reviewed based on monthly assessment findings.",             LocalDateTime.now().minusDays(50));
        }

        // Backfill: ensure every active purchased exercise has at least 1 session record
        try {
            List<PatientExercise> allExercises = patientExerciseRepository.findByPatientId(patient.getId());
            for (PatientExercise pe : allExercises) {
                if (!Boolean.TRUE.equals(pe.getPurchased())) continue;
                if (pe.getStatus() != PatientExercise.PatientExerciseStatus.ACTIVE) continue;
                if (scheduleRepository.countByPatientExerciseId(pe.getId()) > 0) continue;
                int sessionCount = (int)((pe.getId() % 3) + 1);
                for (int s = 1; s <= sessionCount; s++) {
                    scheduleRepository.save(PatientExerciseSchedule.builder()
                            .patient(patient)
                            .patientExercise(pe)
                            .scheduledDate(LocalDate.now().minusDays(s * 3L))
                            .status(PatientExerciseSchedule.ScheduleStatus.COMPLETED)
                            .notes("Completed session")
                            .completedAt(LocalDateTime.now().minusDays(s * 3L))
                            .build());
                }
            }
        } catch (Exception e) {
            log.warn("Session backfill skipped for patient {}: {}", patient.getId(), e.getMessage());
        }

        if (scheduleRepository.countByPatientId(patient.getId()) == 0) {
            List<PatientBodyPartLibrary> activeLibs = libraryRepository
                    .findByPatientIdOrderByBodyPartDisplayOrderAsc(patient.getId())
                    .stream()
                    .filter(lib -> lib.getStatus() == PatientBodyPartLibrary.LibraryStatus.ACTIVE)
                    .collect(Collectors.toList());

            int dayCounter = 1;
            for (PatientBodyPartLibrary lib : activeLibs) {
                List<PatientExercise> exercises = patientExerciseRepository
                        .findByPatientIdAndBodyPartIdOrderByExerciseIdAsc(patient.getId(), lib.getBodyPart().getId())
                        .stream()
                        .filter(pe -> Boolean.TRUE.equals(pe.getPurchased())
                                   && pe.getStatus() == PatientExercise.PatientExerciseStatus.ACTIVE)
                        .collect(Collectors.toList()); // all active exercises, not just first 2

                if (exercises.isEmpty()) continue;

                // Seed 1–3 completed sessions per exercise so sessionCount is accurate per exercise
                for (int i = 0; i < exercises.size(); i++) {
                    PatientExercise pe = exercises.get(i);
                    int sessionCount = (int)((pe.getId() % 3) + 1); // 1, 2 or 3 sessions
                    for (int s = 1; s <= sessionCount; s++) {
                        scheduleRepository.save(PatientExerciseSchedule.builder()
                                .patient(patient)
                                .patientExercise(pe)
                                .scheduledDate(LocalDate.now().minusDays(dayCounter + s))
                                .status(PatientExerciseSchedule.ScheduleStatus.COMPLETED)
                                .notes("Completed session")
                                .completedAt(LocalDateTime.now().minusDays(dayCounter + s))
                                .build());
                    }
                    // 1 upcoming session per exercise
                    scheduleRepository.save(PatientExerciseSchedule.builder()
                            .patient(patient)
                            .patientExercise(pe)
                            .scheduledDate(LocalDate.now().plusDays(dayCounter + i))
                            .status(PatientExerciseSchedule.ScheduleStatus.UPCOMING)
                            .notes("Upcoming home exercise")
                            .build());
                    dayCounter++;
                }
            }
        }
    }

    private Long findFirstActiveBodyPartId(ClinicPatient patient) {
        return libraryRepository.findByPatientIdOrderByBodyPartDisplayOrderAsc(patient.getId()).stream()
                .filter(l -> l.getPurchaseType() != PatientBodyPartLibrary.PurchaseType.NONE)
                .findFirst()
                .map(l -> l.getBodyPart().getId())
                .orElseGet(() -> bodyPartRepository.findAllByOrderByDisplayOrderAscNameAsc().get(0).getId());
    }

    private PatientHistory addHistory(ClinicPatient patient, String type, String title, String description) {
        return historyRepository.save(PatientHistory.builder()
                .patient(patient)
                .eventType(type)
                .title(title)
                .description(description)
                .build());
    }

    private PatientHistory addHistoryAt(ClinicPatient patient, String type, String title, String description, LocalDateTime at) {
        PatientHistory h = PatientHistory.builder()
                .patient(patient)
                .eventType(type)
                .title(title)
                .description(description)
                .createdAt(at)
                .build();
        return historyRepository.save(h);
    }

    private PatientDTOs.PatientListItem toPatientListItem(ClinicPatient p) {
        return PatientDTOs.PatientListItem.builder()
                .id(p.getId())
                .patient(fullName(p))
                .firstName(p.getFirstName())
                .lastName(p.getLastName())
                .age(p.getAge())
                .gender(p.getGender())
                .joinDate(p.getJoinDate() != null ? p.getJoinDate() : dateOrCreated(p))
                .status(patientStatus(p))
                .paymentStatus(computePaymentStatus(p))
                .injury(injury(p))
                .doctorId(p.getClinicDoctor().getId())
                .doctorAssigned(doctorName(p.getClinicDoctor()))
                .prescription(p.getPrescription())
                .prescriptionUrl(p.getPrescriptionUrl())
                .prescriptionFileName(p.getPrescriptionFileName())
                .prescriptionFileType(p.getPrescriptionFileType())
                .report(p.getReport())
                .reportUrl(p.getReportUrl())
                .reportFileName(p.getReportFileName())
                .reportFileType(p.getReportFileType())
                .build();
    }

    private PatientDTOs.PatientProfile toPatientProfile(ClinicPatient p) {
        return PatientDTOs.PatientProfile.builder()
                .id(p.getId())
                .patient(fullName(p))
                .firstName(p.getFirstName())
                .lastName(p.getLastName())
                .age(p.getAge())
                .gender(p.getGender())
                .contactPhone(p.getContactPhone())
                .contactEmail(p.getContactEmail())
                .joinDate(p.getJoinDate() != null ? p.getJoinDate() : dateOrCreated(p))
                .status(patientStatus(p))
                .injury(injury(p))
                .diagnosis(p.getDiagnosis())
                .doctorId(p.getClinicDoctor().getId())
                .doctorAssigned(doctorName(p.getClinicDoctor()))
                .prescription(p.getPrescription())
                .prescriptionUrl(p.getPrescriptionUrl())
                .prescriptionFileName(p.getPrescriptionFileName())
                .prescriptionFileType(p.getPrescriptionFileType())
                .report(p.getReport())
                .reportUrl(p.getReportUrl())
                .reportFileName(p.getReportFileName())
                .reportFileType(p.getReportFileType())
                .build();
    }

    private PatientDTOs.BodyPartLibraryItem toBodyPartItem(PatientBodyPartLibrary library) {
        List<PatientExercise> patientExercises = patientExerciseRepository.findByPatientIdAndBodyPartIdOrderByExerciseIdAsc(
                library.getPatient().getId(), library.getBodyPart().getId());
        Optional<PatientExercise> firstPurchased = patientExercises.stream().filter(pe -> Boolean.TRUE.equals(pe.getPurchased())).findFirst();
        Optional<PatientExercise> firstAvailable = patientExercises.stream().findFirst();
        boolean isSingle = library.getPurchaseType() == PatientBodyPartLibrary.PurchaseType.SINGLE;
        boolean isNone   = library.getPurchaseType() == PatientBodyPartLibrary.PurchaseType.NONE;
        Optional<PatientExercise> dataSource = isNone ? firstAvailable : firstPurchased;

        // ── Prescribed values (from exercise definition) ──────────────────────
        int prescribedReps     = dataSource.map(pe -> pe.getExercise().getRepsCount()  != null ? pe.getExercise().getRepsCount()  : 10).orElse(10);
        int prescribedSets     = dataSource.map(pe -> pe.getExercise().getSetsCount()  != null ? pe.getExercise().getSetsCount()  : 3).orElse(3);
        int prescribedDurMins  = parseDurationMins(dataSource.map(pe -> pe.getExercise().getDuration()).orElse("10 min"));

        // ── Actual patient progress ───────────────────────────────────────────
        int totalCompletedReps = patientExercises.stream()
                .filter(pe -> Boolean.TRUE.equals(pe.getPurchased()) && pe.getCompletedReps() != null)
                .mapToInt(PatientExercise::getCompletedReps).sum();
        int totalTargetReps = patientExercises.stream()
                .filter(pe -> Boolean.TRUE.equals(pe.getPurchased()))
                .mapToInt(pe -> {
                    Exercise ex = pe.getExercise();
                    return (ex.getSetsCount() != null ? ex.getSetsCount() : 3)
                         * (ex.getRepsCount()  != null ? ex.getRepsCount()  : 10);
                }).sum();

        // completedSets = sum of (completedReps / repsPerSet) per exercise — accurate per exercise
        int completedSets = patientExercises.stream()
                .filter(pe -> Boolean.TRUE.equals(pe.getPurchased()) && pe.getCompletedReps() != null)
                .mapToInt(pe -> {
                    int rps = pe.getExercise().getRepsCount() != null ? pe.getExercise().getRepsCount() : 10;
                    return rps > 0 ? pe.getCompletedReps() / rps : 0;
                }).sum();

        // targetSets = sum of prescribed sets across all purchased exercises
        int targetSets = patientExercises.stream()
                .filter(pe -> Boolean.TRUE.equals(pe.getPurchased()))
                .mapToInt(pe -> pe.getExercise().getSetsCount() != null ? pe.getExercise().getSetsCount() : 3)
                .sum();

        long purchasedCount = patientExercises.stream().filter(pe -> Boolean.TRUE.equals(pe.getPurchased())).count();

        // completedDurationMins = actual time based on progress ratio
        int completedDurMins = totalTargetReps > 0
                ? (int) Math.round((double) totalCompletedReps / totalTargetReps * prescribedDurMins)
                : 0;

        // sessionCount = number of past scheduled sessions for this body part
        long sessionCount = scheduleRepository
                .findByPatientIdAndScheduledDateBeforeOrderByScheduledDateDesc(
                        library.getPatient().getId(), LocalDate.now())
                .stream()
                .filter(s -> library.getBodyPart().getId()
                        .equals(s.getPatientExercise().getBodyPart().getId()))
                .count();

        return PatientDTOs.BodyPartLibraryItem.builder()
                .libraryId(library.getId())
                .bodyPartId(library.getBodyPart().getId())
                .bodyPart(library.getBodyPart().getName())
                .exerciseName(isSingle || isNone
                        ? dataSource.map(pe -> pe.getExercise().getExerciseName()).orElse(null)
                        : library.getBodyPart().getName() + " Bundle")
                .status(library.getStatus().name())
                .type(library.getPurchaseType().name())
                .duration(dataSource.map(pe -> pe.getExercise().getDuration()).orElse("—"))
                .sets(prescribedSets)
                .reps(prescribedReps)
                .frequency(dataSource.map(pe -> pe.getExercise().getFrequency()).orElse(null))
                .difficulty(dataSource.map(pe -> pe.getExercise().getDifficulty() != null ? pe.getExercise().getDifficulty().name() : "EASY").orElse("—"))
                .publishedToApp(Boolean.TRUE.equals(library.getPublishedToApp()))
                .publishedAt(library.getPublishedAt())
                .activePurchasedExerciseCount(patientExercises.stream().filter(pe -> Boolean.TRUE.equals(pe.getPurchased()) && pe.getStatus() == PatientExercise.PatientExerciseStatus.ACTIVE).count())
                .totalExerciseCount((long) patientExercises.size())
                .completedReps(totalCompletedReps)
                .targetReps(totalTargetReps)
                // ── actual patient progress fields ──
                .completedSets(completedSets)
                .targetSets(targetSets)
                .completedDurationMins(completedDurMins)
                .sessionCount(sessionCount)
                .build();
    }

    /** Parses "13 min", "25 min" etc. → integer minutes. Returns 10 as fallback. */
    private int parseDurationMins(String duration) {
        if (duration == null) return 10;
        try {
            return Integer.parseInt(duration.trim().replaceAll("(?i)\\s*min.*", "").trim());
        } catch (NumberFormatException e) {
            return 10;
        }
    }

    private PatientDTOs.ExerciseItem toExerciseItem(PatientExercise pe) {
        Exercise e = pe.getExercise();
        int repsPerSet      = e.getRepsCount()  != null ? e.getRepsCount()  : 10;
        int prescribedSets  = e.getSetsCount()  != null ? e.getSetsCount()  : 3;
        int targetReps      = prescribedSets * repsPerSet;
        int completedRepsVal= pe.getCompletedReps() != null ? pe.getCompletedReps() : 0;

        // Patient progress derived from completedReps — use round for accuracy
        int completedSets    = repsPerSet > 0 ? (int) Math.round((double) completedRepsVal / repsPerSet) : 0;
        int prescribedDurMins= parseDurationMins(e.getDuration());
        int completedDurMins = targetReps > 0
                ? (int) Math.round((double) completedRepsVal / targetReps * prescribedDurMins)
                : 0;

        return PatientDTOs.ExerciseItem.builder()
                .patientExerciseId(pe.getId())
                .exerciseId(e.getId())
                .bodyPartId(pe.getBodyPart().getId())
                .bodyPart(pe.getBodyPart().getName())
                .exerciseName(e.getExerciseName())
                .description(e.getDescription())
                .duration(e.getDuration())
                .sets(prescribedSets)
                .reps(repsPerSet)
                .frequency(e.getFrequency())
                .completedReps(completedRepsVal)
                .targetReps(targetReps)
                .completedSets(completedSets)
                .targetSets(prescribedSets)
                .completedDurationMins(completedDurMins)
                .difficulty(e.getDifficulty() != null ? e.getDifficulty().name() : "EASY")
                .status(pe.getStatus().name())
                .purchased(Boolean.TRUE.equals(pe.getPurchased()))
                .publishedToApp(Boolean.TRUE.equals(pe.getPublishedToApp()))
                .publishedAt(pe.getPublishedAt())
                .videoUrl(e.getVideoUrl())
                .sessionCount(scheduleRepository.countByPatientExerciseId(pe.getId()))
                .build();
    }

    private PatientDTOs.HistoryItem toHistoryItem(PatientHistory h) {
        return PatientDTOs.HistoryItem.builder()
                .id(h.getId())
                .eventType(h.getEventType())
                .title(h.getTitle())
                .description(h.getDescription())
                .createdAt(h.getCreatedAt())
                .build();
    }

    private PatientDTOs.ScheduleItem toScheduleItem(PatientExerciseSchedule s) {
        PatientExercise pe = s.getPatientExercise();
        Exercise e = pe.getExercise();
        return PatientDTOs.ScheduleItem.builder()
                .id(s.getId())
                .patientExerciseId(pe.getId())
                .exerciseId(e.getId())
                .exerciseName(e.getExerciseName())
                .bodyPart(pe.getBodyPart().getName())
                .status(s.getStatus().name())
                .scheduledDate(s.getScheduledDate())
                .notes(s.getNotes())
                .duration(e.getDuration())
                .sets(e.getSetsCount())
                .reps(e.getRepsCount())
                .difficulty(e.getDifficulty() != null ? e.getDifficulty().name() : "EASY")
                .build();
    }

    /**
     * Derives a payment status for display:
     *  RENEWAL_DUE  → FAILED  (subscription expired, payment needed)
     *  ON_HOLD      → PENDING (paused, no active billing)
     *  everything else → PAID
     */
    private String computePaymentStatus(ClinicPatient p) {
        ClinicPatient.PatientStatus s = p.getPatientStatus();
        if (s == ClinicPatient.PatientStatus.RENEWAL_DUE || s == ClinicPatient.PatientStatus.PAYMENT_FAILURE) {
            return "FAILED";
        }
        if (s == ClinicPatient.PatientStatus.ON_HOLD) {
            return "PENDING";
        }
        return "PAID";
    }

    private String fullName(ClinicPatient p) { return safe(p.getFirstName()) + " " + safe(p.getLastName()); }
    private String doctorName(ClinicDoctor d) { return "Dr. " + safe(d.getFirstName()) + " " + safe(d.getLastName()); }
    private String injury(ClinicPatient p) { return p.getInjury() != null && !p.getInjury().isBlank() ? p.getInjury() : p.getDiagnosis(); }
    private String patientStatus(ClinicPatient p) { return p.getPatientStatus() != null ? p.getPatientStatus().name() : "ACTIVE"; }
    private LocalDate dateOrCreated(ClinicPatient p) { return p.getCreatedAt() != null ? p.getCreatedAt().toLocalDate() : LocalDate.now(); }
    private String safe(String value) { return value == null ? "" : value; }

    // ─── PATIENT ACTIVITY LOGS ───────────────────────────────────────────────

    /**
     * Seeds realistic login/logout pairs for the last 30 days if none exist yet.
     * Weekdays get ~2-3 sessions; weekends ~0-1 session.
     */
    private void ensurePatientActivityLogs(ClinicPatient patient) {
        long existingCount = activityLogRepository.countByPatientId(patient.getId());
        if (existingCount > 0) {
            // Re-seed if any log has a future timestamp (stale data from old seeding)
            boolean hasFutureLogs = !activityLogRepository
                    .findByPatientIdAndLoggedAtAfterOrderByLoggedAtDesc(patient.getId(), LocalDateTime.now())
                    .isEmpty();
            if (!hasFutureLogs) return;
            jdbcTemplate.update("DELETE FROM patient_activity_logs WHERE patient_id = ?", patient.getId());
        }

        Random rng      = new Random(patient.getId() * 31L); // deterministic per patient
        String[] devices = {"Mobile App", "Mobile App", "Mobile App", "Web Browser", "Tablet"};
        LocalDateTime now = LocalDateTime.now();

        for (int daysAgo = 59; daysAgo >= 0; daysAgo--) {
            LocalDate day = LocalDate.now().minusDays(daysAgo);
            DayOfWeek dow = day.getDayOfWeek();
            boolean isWeekend = (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY);

            // Probability of activity: 85% weekdays, 50% weekends
            if (rng.nextDouble() > (isWeekend ? 0.50 : 0.85)) continue;

            // 1-3 sessions on active days; realistic time slots (morning / afternoon / evening)
            int sessionsToday = isWeekend ? 1 : (rng.nextInt(10) < 3 ? 3 : 1 + rng.nextInt(2));
            int[][] slots = {
                {7  + rng.nextInt(3), rng.nextInt(60)},  // 07:00–09:59
                {12 + rng.nextInt(3), rng.nextInt(60)},  // 12:00–14:59
                {16 + rng.nextInt(2), rng.nextInt(60)},  // 16:00–17:59
            };

            for (int s = 0; s < Math.min(sessionsToday, slots.length); s++) {
                int hour   = slots[s][0];
                int minute = slots[s][1];
                int duration = 15 + rng.nextInt(46); // 15–60 min
                String device = devices[rng.nextInt(devices.length)];

                LocalDateTime loginTime  = day.atTime(hour, minute);
                LocalDateTime logoutTime = loginTime.plusMinutes(duration);

                // Never log future events
                if (loginTime.isAfter(now)) continue;
                if (logoutTime.isAfter(now)) {
                    logoutTime = now.minusMinutes(5 + rng.nextInt(20));
                    duration   = (int) java.time.Duration.between(loginTime, logoutTime).toMinutes();
                    if (duration <= 0) continue;
                }

                activityLogRepository.save(PatientActivityLog.builder()
                        .patient(patient).eventType("LOGIN")
                        .loggedAt(loginTime).device(device).build());
                activityLogRepository.save(PatientActivityLog.builder()
                        .patient(patient).eventType("LOGOUT")
                        .loggedAt(logoutTime).sessionDurationMins(duration).device(device).build());
            }
        }
    }

    /** Builds activity stats: recent logs + 7-day active dates + 30-day count map. */
    private PatientDTOs.ActivityStats buildActivityStats(Long patientId) {
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        // ── Load patient to get join date ─────────────────────────────────────
        ClinicPatient cp = clinicPatientRepository.findById(patientId).orElse(null);
        LocalDate joinDateLocal = (cp != null && cp.getJoinDate() != null) ? cp.getJoinDate() : null;
        String joinDateStr = joinDateLocal != null ? joinDateLocal.format(dateFmt) : null;

        // Fetch all logs in last 60 days.
        // Activity heatmap and logs show the full 60-day history regardless of join date
        // (a patient may have been exercising for months before the admin joined them to this system).
        // Join-date filtering applies only to calendar milestone markers (blue/amber/purple boxes).
        LocalDateTime since = LocalDateTime.now().minusDays(60);
        List<PatientActivityLog> logs = activityLogRepository
                .findByPatientIdAndLoggedAtAfterOrderByLoggedAtDesc(patientId, since);

        // ── Completed exercise sessions (last 60 days) ───────────────────────
        LocalDate from60 = LocalDate.now().minusDays(59);
        List<PatientExerciseSchedule> completedSchedules = scheduleRepository
                .findByPatientIdAndStatusAndScheduledDateBetweenOrderByScheduledDateDesc(
                        patientId, PatientExerciseSchedule.ScheduleStatus.COMPLETED,
                        from60, LocalDate.now());

        // Build exercise log items (eventType = "EXERCISE") — one entry per completed session
        // Exercise completions are historical data — show all regardless of join date
        List<PatientDTOs.ActivityLogItem> exerciseLogs = completedSchedules.stream()
                .map(s -> {
                    String name = s.getPatientExercise() != null && s.getPatientExercise().getExercise() != null
                            ? s.getPatientExercise().getExercise().getExerciseName() : "Exercise";
                    String bodyPart = s.getPatientExercise() != null && s.getPatientExercise().getBodyPart() != null
                            ? s.getPatientExercise().getBodyPart().getName() : "";
                    String detail = bodyPart.isEmpty() ? name : name + " · " + bodyPart;
                    LocalDateTime loggedAt = s.getCompletedAt() != null
                            ? s.getCompletedAt() : s.getScheduledDate().atTime(8, 0);
                    return PatientDTOs.ActivityLogItem.builder()
                            .id(s.getId())
                            .eventType("EXERCISE")
                            .loggedAt(loggedAt)
                            .device(detail)
                            .build();
                })
                .collect(Collectors.toList());

        // Find the earliest exercise assignment date (first PUBLISH history event on/after join date).
        // Patients can only log in to do exercises AFTER the doctor first assigns them.
        List<com.medicare.entity.PatientHistory> allHistory =
                historyRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
        LocalDate firstAssignDate = allHistory.stream()
                .filter(h -> "PUBLISH".equals(h.getEventType()) && h.getCreatedAt() != null)
                .filter(h -> joinDateLocal == null || !h.getCreatedAt().toLocalDate().isBefore(joinDateLocal))
                .map(h -> h.getCreatedAt().toLocalDate())
                .min(LocalDate::compareTo)
                .orElse(joinDateLocal); // fall back to join date if no PUBLISH event exists

        // Filter login/logout events to the first exercise assignment date onwards —
        // sessions before exercise assignment are meaningless (nothing to do yet).
        List<PatientActivityLog> logsAfterJoin = firstAssignDate != null
                ? logs.stream()
                    .filter(l -> !l.getLoggedAt().toLocalDate().isBefore(firstAssignDate))
                    .collect(Collectors.toList())
                : logs;

        // Merge login/logout + exercise logs, newest first
        List<PatientDTOs.ActivityLogItem> recentLogs = new java.util.ArrayList<>();
        recentLogs.addAll(logsAfterJoin.stream()
                .limit(60)
                .map(l -> PatientDTOs.ActivityLogItem.builder()
                        .id(l.getId())
                        .eventType(l.getEventType())
                        .loggedAt(l.getLoggedAt())
                        .sessionDurationMins(l.getSessionDurationMins())
                        .device(l.getDevice())
                        .build())
                .collect(Collectors.toList()));
        recentLogs.addAll(exerciseLogs);
        recentLogs.sort((a, b) -> b.getLoggedAt().compareTo(a.getLoggedAt())); // newest first

        // 60-day activity map: LOGIN events + completed exercise sessions per date
        Map<String, Integer> activityMap30 = new TreeMap<>();
        for (int i = 59; i >= 0; i--) {
            activityMap30.put(LocalDate.now().minusDays(i).format(dateFmt), 0);
        }
        // Count logins from first assignment date onwards (patient can only exercise after assignment)
        logsAfterJoin.stream()
                .filter(l -> "LOGIN".equals(l.getEventType()))
                .forEach(l -> {
                    String d = l.getLoggedAt().toLocalDate().format(dateFmt);
                    activityMap30.merge(d, 1, Integer::sum);
                });
        // Count all completed exercise sessions (always on/after assignment by definition)
        completedSchedules.forEach(s -> {
            String d = s.getScheduledDate().format(dateFmt);
            if (activityMap30.containsKey(d)) activityMap30.merge(d, 1, Integer::sum);
        });

        // Active days in last 7 (login OR exercise, on or after join date)
        LocalDateTime since7 = LocalDateTime.now().minusDays(7);
        List<String> activeDays7 = recentLogs.stream()
                .filter(l -> ("LOGIN".equals(l.getEventType()) || "EXERCISE".equals(l.getEventType()))
                        && l.getLoggedAt().isAfter(since7))
                .map(l -> l.getLoggedAt().toLocalDate().format(dateFmt))
                .distinct()
                .collect(Collectors.toList());

        // ── Calendar milestone dates ──────────────────────────────────────────
        // Only the EARLIEST PUBLISH event on/after join date is shown as the "Exercises Assigned"
        // calendar marker. Extra PUBLISH rows (from old seeder runs or updates) are ignored.
        List<String> exerciseDates = allHistory.stream()
                .filter(h -> "PUBLISH".equals(h.getEventType()) && h.getCreatedAt() != null)
                .filter(h -> joinDateLocal == null || !h.getCreatedAt().toLocalDate().isBefore(joinDateLocal))
                .map(h -> h.getCreatedAt().toLocalDate())
                .min(LocalDate::compareTo)
                .map(d -> java.util.Collections.singletonList(d.format(dateFmt)))
                .orElse(java.util.Collections.emptyList());

        return PatientDTOs.ActivityStats.builder()
                .recentLogs(recentLogs)
                .activeDays7(activeDays7)
                .activityMap30(activityMap30)
                .joinDate(joinDateStr)
                .exerciseDates(exerciseDates)
                .build();
    }

    // ─── AUTO-INACTIVE: subscription-ended patients ───────────────────────────
    /**
     * Runs every hour.
     * Marks an ACTIVE patient as INACTIVE when their exercise subscription has ended —
     * i.e. they have at least one body-part library record (proof they once had a plan)
     * but zero active purchased exercises left.
     */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void autoMarkInactivePatients() {
        // Patients whose exercise plan ended but were never renewed → ON_HOLD
        int onHold = jdbcTemplate.update(
            "UPDATE clinic_patients SET patient_status = 'ON_HOLD' " +
            "WHERE patient_status = 'ACTIVE' " +
            "AND EXISTS (" +
            "  SELECT 1 FROM patient_body_part_library pbl " +
            "  WHERE pbl.patient_id = clinic_patients.id" +
            ") " +
            "AND NOT EXISTS (" +
            "  SELECT 1 FROM patient_exercises pe " +
            "  WHERE pe.patient_id = clinic_patients.id " +
            "  AND pe.purchased = TRUE " +
            "  AND pe.exercise_status = 'ACTIVE'" +
            ")"
        );
        if (onHold > 0) log.info("Auto-marked {} patients as ON_HOLD (no active exercises)", onHold);
    }

    // ─── WEEKLY PAYMENT FAILURE REFRESH ──────────────────────────────────────
    /**
     * Runs every Monday at 00:00.
     * 1. Restores all current PAYMENT_FAILURE patients back to ACTIVE.
     * 2. Randomly selects ~10% of ACTIVE patients and marks them PAYMENT_FAILURE.
     * This simulates a real weekly billing cycle where payment failures are
     * re-evaluated and a fresh batch of failures is identified each week.
     */
    @Scheduled(cron = "0 0 0 * * MON")
    @Transactional
    public void refreshWeeklyPaymentFailures() {
        LocalDate thisMonday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        List<ClinicPatient> all = clinicPatientRepository.findAll();

        // Step 1 — restore previous week's RENEWAL_DUE patients back to ACTIVE
        List<ClinicPatient> previousRenewal = all.stream()
                .filter(p -> p.getPatientStatus() == ClinicPatient.PatientStatus.RENEWAL_DUE)
                .collect(Collectors.toList());
        previousRenewal.forEach(p -> p.setPatientStatus(ClinicPatient.PatientStatus.ACTIVE));
        clinicPatientRepository.saveAll(previousRenewal);

        // Step 2 — pick ~8% of ACTIVE patients → RENEWAL_DUE (expired subscriptions)
        List<ClinicPatient> active = clinicPatientRepository.findAll().stream()
                .filter(p -> p.getPatientStatus() == ClinicPatient.PatientStatus.ACTIVE)
                .collect(Collectors.toList());
        if (!active.isEmpty()) {
            Collections.shuffle(active, new Random());
            int renewalCount = Math.max(1, active.size() / 12);
            List<ClinicPatient> toRenew = active.subList(0, renewalCount);
            toRenew.forEach(p -> {
                p.setPatientStatus(ClinicPatient.PatientStatus.RENEWAL_DUE);
                p.setPaymentFailureDate(thisMonday);
            });
            clinicPatientRepository.saveAll(toRenew);
        }

        // Step 3 — pick ~5% of ACTIVE patients → EXPIRING_SOON (subscription ending this week)
        List<ClinicPatient> stillActive = clinicPatientRepository.findAll().stream()
                .filter(p -> p.getPatientStatus() == ClinicPatient.PatientStatus.ACTIVE)
                .collect(Collectors.toList());
        if (!stillActive.isEmpty()) {
            Collections.shuffle(stillActive, new Random());
            int expiringCount = Math.max(1, stillActive.size() / 20);
            stillActive.subList(0, expiringCount)
                    .forEach(p -> p.setPatientStatus(ClinicPatient.PatientStatus.EXPIRING_SOON));
            clinicPatientRepository.saveAll(stillActive.subList(0, expiringCount));
        }

        log.info("Weekly refresh (week of {}): cleared {} renewal-due, re-evaluated active patients.", thisMonday, previousRenewal.size());
    }

    // ─── WEEKLY PAYMENT FAILURE STATS ────────────────────────────────────────

    /**
     * Groups all patients that have ever been marked PAYMENT_FAILURE by their
     * paymentFailureDate week (Monday-anchored) and returns the per-week counts
     * sorted oldest → newest.
     */
    public List<PatientDTOs.WeeklyPaymentStat> getWeeklyPaymentFailureStats() {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM d");

        Map<LocalDate, Long> byWeek = clinicPatientRepository.findAll().stream()
                .filter(p -> p.getPaymentFailureDate() != null)
                .collect(Collectors.groupingBy(
                        p -> p.getPaymentFailureDate()
                                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)),
                        Collectors.counting()
                ));

        return byWeek.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> {
                    LocalDate monday = e.getKey();
                    LocalDate sunday = monday.plusDays(6);
                    String label = monday.format(fmt) + " – " + sunday.format(fmt);
                    return PatientDTOs.WeeklyPaymentStat.builder()
                            .weekStart(monday)
                            .weekLabel(label)
                            .count(e.getValue().intValue())
                            .build();
                })
                .collect(Collectors.toList());
    }
}
