export type PatientStatus = 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'PAYMENT_FAILURE';
export type LibraryStatus = 'ACTIVE' | 'INACTIVE';
export type PurchaseType = 'NONE' | 'SINGLE' | 'BUNDLE';
export type ExerciseStatus = 'ACTIVE' | 'INACTIVE';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | '—';

export interface PatientListItem {
  id: number;
  patient: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  gender?: string;
  joinDate?: string;
  status: PatientStatus | string;
  paymentStatus?: string;   // PAID | PENDING | FAILED
  injury?: string;
  doctorId?: number;
  doctorAssigned?: string;
  prescription?: string;
  prescriptionUrl?: string;
  prescriptionFileName?: string;
  prescriptionFileType?: string;
  report?: string;
  reportUrl?: string;
  reportFileName?: string;
  reportFileType?: string;
}

export interface PatientProfile extends PatientListItem {
  contactPhone?: string;
  contactEmail?: string;
  diagnosis?: string;
}

export interface BodyPartLibraryItem {
  libraryId: number;
  bodyPartId: number;
  bodyPart: string;
  exerciseName?: string | null;
  status: LibraryStatus | string;
  type: PurchaseType | string;
  duration?: string;
  sets?: number | null;
  reps?: number | null;
  frequency?: string | null;
  difficulty?: Difficulty | string;
  publishedToApp?: boolean;
  publishedAt?: string | null;
  activePurchasedExerciseCount?: number;
  totalExerciseCount?: number;
  completedReps?: number | null;
  targetReps?: number | null;
  // Actual patient progress (computed by backend)
  completedSets?: number | null;
  targetSets?: number | null;
  completedDurationMins?: number | null;
  sessionCount?: number | null;
}

export interface ExerciseItem {
  patientExerciseId: number;
  exerciseId: number;
  bodyPartId: number;
  bodyPart: string;
  exerciseName: string;
  description?: string;
  duration?: string;
  sets?: number | null;
  reps?: number | null;
  frequency?: string | null;
  completedReps?: number | null;
  targetReps?: number | null;
  completedSets?: number | null;
  targetSets?: number | null;
  completedDurationMins?: number | null;
  difficulty?: Difficulty | string;
  status: ExerciseStatus | string;
  purchased: boolean;
  publishedToApp?: boolean;
  publishedAt?: string | null;
  videoUrl?: string | null;
}

export interface HistoryItem {
  id: number;
  eventType: string;
  title: string;
  description?: string;
  createdAt: string;
}

export interface ScheduleItem {
  id: number;
  patientExerciseId: number;
  exerciseId: number;
  exerciseName: string;
  bodyPart: string;
  status: string;
  scheduledDate: string;
  notes?: string;
  duration?: string;
  sets?: number | null;
  reps?: number | null;
  difficulty?: string;
}

export interface ActivityLogItem {
  id: number;
  eventType: 'LOGIN' | 'LOGOUT' | string;
  loggedAt: string;
  sessionDurationMins?: number | null;
  device?: string | null;
}

export interface ActivityStats {
  recentLogs: ActivityLogItem[];
  activeDays7: string[];                // YYYY-MM-DD dates with ≥1 login in last 7 days
  activityMap30: Record<string, number>; // YYYY-MM-DD → login count
}

export interface PatientExerciseLibraryResponse {
  patient: PatientProfile;
  bodyParts: BodyPartLibraryItem[];
  history: HistoryItem[];
  previousExercises: ScheduleItem[];
  upcomingExercises: ScheduleItem[];
  activityStats?: ActivityStats;
}

export interface BodyPartExercisesResponse {
  patient: PatientProfile;
  bodyPart: BodyPartLibraryItem;
  exercises: ExerciseItem[];
  history: HistoryItem[];
  previousExercises: ScheduleItem[];
  upcomingExercises: ScheduleItem[];
}
