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

    @Transactional(readOnly = true)
    public List<PatientDTOs.PatientListItem> getPatients() {
        return clinicPatientRepository.findAllByOrderByIdAsc().stream()
                .map(this::toPatientListItem)
                .collect(Collectors.toList());
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
                boolean repsStale = existing.getCompletedReps() == null
                        || (Boolean.TRUE.equals(purchased) && existing.getCompletedReps() == 0);
                if (purchasedChanged || repsStale) {
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
            return (int)(exercise.getId() % 8) + 1; // 1–8, always < 10
        }
    }

    private void ensurePatientHistoryAndSchedules(ClinicPatient patient) {
        if (historyRepository.countByPatientId(patient.getId()) == 0) {
            addHistory(patient, "CREATED", "Patient profile created", "Patient was added to the rehabilitation dashboard.");
            addHistory(patient, "ASSESSMENT", "Initial assessment", "Injury recorded as " + safe(injury(patient)) + ".");
        }

        if (scheduleRepository.countByPatientId(patient.getId()) == 0) {
            // Create sessions for EVERY active body part so sessionCount shows
            // realistic per-body-part numbers in the exercise library view.
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
                        .limit(2)
                        .collect(Collectors.toList());

                if (exercises.isEmpty()) continue;

                // Vary past sessions per body part: 1–3 based on library id
                int pastCount = (int)(lib.getId() % 3) + 1;
                for (int p = 1; p <= pastCount; p++) {
                    PatientExercise pe = exercises.get((p - 1) % exercises.size());
                    scheduleRepository.save(PatientExerciseSchedule.builder()
                            .patient(patient)
                            .patientExercise(pe)
                            .scheduledDate(LocalDate.now().minusDays(dayCounter + p))
                            .status(PatientExerciseSchedule.ScheduleStatus.COMPLETED)
                            .notes("Completed session")
                            .completedAt(LocalDateTime.now().minusDays(dayCounter + p))
                            .build());
                }
                // 1 upcoming session per body part
                scheduleRepository.save(PatientExerciseSchedule.builder()
                        .patient(patient)
                        .patientExercise(exercises.get(0))
                        .scheduledDate(LocalDate.now().plusDays(dayCounter))
                        .status(PatientExerciseSchedule.ScheduleStatus.UPCOMING)
                        .notes("Upcoming home exercise")
                        .build());
                dayCounter++;
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

        long purchasedCount = patientExercises.stream().filter(pe -> Boolean.TRUE.equals(pe.getPurchased())).count();

        // completedSets = how many full sets the patient has done
        int completedSets = prescribedReps > 0 ? (int)(totalCompletedReps / prescribedReps) : 0;
        int targetSets    = (int)(prescribedSets * Math.max(purchasedCount, 1));

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

        // Patient progress derived from completedReps
        int completedSets    = repsPerSet > 0 ? completedRepsVal / repsPerSet : 0;
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
        if (activityLogRepository.countByPatientId(patient.getId()) > 0) return;

        Random rng = new Random(patient.getId() * 31L); // deterministic per patient
        LocalDateTime now = LocalDateTime.now();
        String[] devices = {"Mobile App", "Mobile App", "Mobile App", "Web Browser", "Tablet"};

        for (int daysAgo = 29; daysAgo >= 0; daysAgo--) {
            LocalDate day = LocalDate.now().minusDays(daysAgo);
            DayOfWeek dow = day.getDayOfWeek();
            boolean isWeekend = (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY);

            // Probability of activity: 80% weekdays, 40% weekends
            if (rng.nextDouble() > (isWeekend ? 0.40 : 0.80)) continue;

            // 1-2 sessions on active days
            int sessionsToday = isWeekend ? 1 : (1 + rng.nextInt(2));
            int startHour = 7;
            for (int s = 0; s < sessionsToday; s++) {
                // Space sessions across the day
                int hour = startHour + rng.nextInt(isWeekend ? 10 : 12);
                int minute = rng.nextInt(60);
                int duration = 15 + rng.nextInt(46); // 15-60 min
                String device = devices[rng.nextInt(devices.length)];

                LocalDateTime loginTime  = day.atTime(Math.min(hour, 22), minute);
                LocalDateTime logoutTime = loginTime.plusMinutes(duration);

                activityLogRepository.save(PatientActivityLog.builder()
                        .patient(patient).eventType("LOGIN")
                        .loggedAt(loginTime).device(device).build());
                activityLogRepository.save(PatientActivityLog.builder()
                        .patient(patient).eventType("LOGOUT")
                        .loggedAt(logoutTime).sessionDurationMins(duration).device(device).build());

                startHour = hour + duration / 60 + 2; // gap before next session
            }
        }
    }

    /** Builds activity stats: recent logs + 7-day active dates + 30-day count map. */
    private PatientDTOs.ActivityStats buildActivityStats(Long patientId) {
        LocalDateTime since = LocalDateTime.now().minusDays(30);
        List<PatientActivityLog> logs = activityLogRepository
                .findByPatientIdAndLoggedAtAfterOrderByLoggedAtDesc(patientId, since);

        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        // Recent events (last 30, newest first)
        List<PatientDTOs.ActivityLogItem> recentLogs = logs.stream()
                .limit(30)
                .map(l -> PatientDTOs.ActivityLogItem.builder()
                        .id(l.getId())
                        .eventType(l.getEventType())
                        .loggedAt(l.getLoggedAt())
                        .sessionDurationMins(l.getSessionDurationMins())
                        .device(l.getDevice())
                        .build())
                .collect(Collectors.toList());

        // 30-day activity map (LOGIN count per date), all 30 days initialised to 0
        Map<String, Integer> activityMap30 = new TreeMap<>();
        for (int i = 29; i >= 0; i--) {
            activityMap30.put(LocalDate.now().minusDays(i).format(dateFmt), 0);
        }
        logs.stream()
                .filter(l -> "LOGIN".equals(l.getEventType()))
                .forEach(l -> {
                    String d = l.getLoggedAt().toLocalDate().format(dateFmt);
                    activityMap30.merge(d, 1, Integer::sum);
                });

        // Active days in last 7
        LocalDateTime since7 = LocalDateTime.now().minusDays(7);
        List<String> activeDays7 = logs.stream()
                .filter(l -> "LOGIN".equals(l.getEventType()) && l.getLoggedAt().isAfter(since7))
                .map(l -> l.getLoggedAt().toLocalDate().format(dateFmt))
                .distinct()
                .collect(Collectors.toList());

        return PatientDTOs.ActivityStats.builder()
                .recentLogs(recentLogs)
                .activeDays7(activeDays7)
                .activityMap30(activityMap30)
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
