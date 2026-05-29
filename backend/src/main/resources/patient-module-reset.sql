-- Development reset for patient exercise-library module.
-- Run this only if you previously created broken patient module tables.
DROP TABLE IF EXISTS patient_exercise_schedules CASCADE;
DROP TABLE IF EXISTS patient_history CASCADE;
DROP TABLE IF EXISTS patient_exercises CASCADE;
DROP TABLE IF EXISTS patient_body_part_library CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS body_parts CASCADE;

ALTER TABLE clinic_patients ADD COLUMN IF NOT EXISTS injury VARCHAR(255);
ALTER TABLE clinic_patients ADD COLUMN IF NOT EXISTS join_date DATE;
ALTER TABLE clinic_patients ADD COLUMN IF NOT EXISTS patient_status VARCHAR(255);
ALTER TABLE clinic_patients ADD COLUMN IF NOT EXISTS prescription TEXT;
ALTER TABLE clinic_patients ADD COLUMN IF NOT EXISTS report TEXT;
ALTER TABLE clinic_patients ADD COLUMN IF NOT EXISTS prescription_url TEXT;
ALTER TABLE clinic_patients ADD COLUMN IF NOT EXISTS prescription_file_name VARCHAR(255);
ALTER TABLE clinic_patients ADD COLUMN IF NOT EXISTS prescription_file_type VARCHAR(100);
ALTER TABLE clinic_patients ADD COLUMN IF NOT EXISTS report_url TEXT;
ALTER TABLE clinic_patients ADD COLUMN IF NOT EXISTS report_file_name VARCHAR(255);
ALTER TABLE clinic_patients ADD COLUMN IF NOT EXISTS report_file_type VARCHAR(100);
