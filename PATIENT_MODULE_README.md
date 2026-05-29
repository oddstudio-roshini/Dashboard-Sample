# Patient Module Update

This project includes the updated Patient Management module with:

- Patient list table: Patient, Join Date, Status, Injury, Doctor Assigned, Prescription, Report, Exercise Library
- Prescription/report upload and inline browser viewing for image/PDF files
- Patient Exercise Library screen
- Body parts list: Head, Neck, Shoulders, Upper arms (left/right), Elbows, Forearms, Wrists, Hands, Chest / Torso, Waist / Hips, Upper legs / Thighs, Knees, Lower legs / Calves, Ankles, Feet
- SINGLE purchase type: Push/Delete directly on the body-part row
- BUNDLE purchase type: View bundle and manage individual exercises
- Patient history
- Previous exercises
- Upcoming exercises
- Android published exercises API

## Important DB reset for older broken patient module tables

If you previously created patient module tables and got 500 errors, run this SQL once before starting the backend:

```sql
\i backend/src/main/resources/patient-module-reset.sql
```

Or manually run the contents of:

```text
backend/src/main/resources/patient-module-reset.sql
```

This resets only the exercise-library module tables. It does not delete your doctors, hospitals, branches, or clinic_patients.

## Run backend

```bash
cd backend
mvn spring-boot:run
```

## Run frontend

```bash
cd frontend
npm install
npm run dev
```

## Main screens

```text
/dashboard/patients
/dashboard/patients/{patientId}/library
/dashboard/patients/{patientId}/library/{bodyPartId}
```

## Main APIs

```text
GET    /api/patients
GET    /api/patients/{patientId}/exercise-library
GET    /api/patients/{patientId}/body-parts/{bodyPartId}/exercises
POST   /api/patients/{patientId}/body-parts/{bodyPartId}/push
DELETE /api/patients/{patientId}/body-parts/{bodyPartId}
POST   /api/patients/{patientId}/patient-exercises/{patientExerciseId}/push
DELETE /api/patients/{patientId}/patient-exercises/{patientExerciseId}
POST   /api/patients/{patientId}/prescription
POST   /api/patients/{patientId}/report
GET    /api/patients/{patientId}/history
GET    /api/patients/{patientId}/previous-exercises
GET    /api/patients/{patientId}/upcoming-exercises
GET    /api/patients/{patientId}/published-exercises
```
