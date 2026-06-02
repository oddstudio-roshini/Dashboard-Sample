/**
 * types/index.ts — UPDATED
 * ─────────────────────────
 * CHANGES:
 *   - Added 'DEACTIVATED' to LogAction (for system auto-deactivation events)
 *   - All existing types preserved
 */

export interface Admin {
  name: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  adminName: string;
  adminEmail: string;
  role: string;
}

export type DoctorStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export type LogAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'FORCE_LOGOUT'
  | 'SUSPENDED'
  | 'ACTIVATED'
  | 'BLOCKED'
  | 'PASSWORD_RESET'
  | 'PROFILE_UPDATED'
  | 'DEACTIVATED'
  | 'RECEPTIONIST_LOGIN';

export interface Doctor {
  id: number;
  arthomoveId?: string;  // ARTH-001 — permanent unique company ID
  clinicalId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  birthYear: number;
  username: string;
  temporaryPassword: string;
  email: string;
  mobileNumber?: string;
  specialization?: string;
  clinicHospital?: string;
  hospitalId?: string;      // e.g. HOSP-001
  status: string;
  notes?: string;
  requirePasswordChange?: boolean;
  lastLogin?: string | null;
  lastLogout?: string | null;
  device?: string | null;
  fps?: number | null;
  createdAt: string;
  isOnline?: boolean;      // true = doctor is currently in their dashboard
  isSuspended?: boolean;   // true = admin has suspended this account
  patientCount?: number;   // total patients assigned to this doctor
}

export interface DoctorStats {
  totalDoctors: number;
  activeDoctors: number;
  inactiveDoctors: number;
}

export interface CreateDoctorForm {
  // clinicalId removed — now auto-generated as ARTH-CLN-XXXXX by backend
  firstName: string;
  lastName: string;
  birthYear?: number | '';
  mobileNumber?: string;
  email: string;
  specialization?: string;
  clinicHospital?: string;
  status: DoctorStatus;
  notes?: string;
}

export interface UpdateDoctorForm {
  firstName: string;
  lastName: string;
  birthYear?: number | '';
  mobileNumber?: string;
  email: string;
  specialization?: string;
  clinicHospital?: string;
  status: DoctorStatus;
  notes?: string;
}

export interface ResetPasswordResponse {
  doctorId: number;
  doctorName: string;
  username: string;
  newTemporaryPassword: string;
}

export interface DoctorLog {
  id: number;
  doctorId: number;
  doctorName: string;
  clinicalId: string;
  clinic?: string;
  action: LogAction;
  actionLabel: string;
  /**
   * Who triggered this action:
   *   "ADMIN"  — admin-initiated (force logout, suspend, etc.)
   *   "DOCTOR" — doctor-initiated (login, self-logout from dashboard)
   *   "SYSTEM" — automated (3-day inactivity auto-deactivation)
   */
  performedBy: string;
  device?: string;
  ipAddress?: string;
  notes?: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
