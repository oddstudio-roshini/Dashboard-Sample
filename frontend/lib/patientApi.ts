import axios from 'axios';
import type {
  PatientListItem,
  PatientExerciseLibraryResponse,
  BodyPartExercisesResponse,
  BodyPartLibraryItem,
  ExerciseItem,
  HistoryItem,
  ScheduleItem,
  PatientProfile,
} from '@/types/patients';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('medicare_token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getFileUrl(path?: string | null) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
}

export interface WeeklyPaymentStat {
  weekStart: string;
  weekLabel: string;
  count: number;
}

export const patientApi = {
  getPatients: (): Promise<PatientListItem[]> =>
    api.get('/api/patients').then((r) => r.data),

  getWeeklyPaymentStats: (): Promise<WeeklyPaymentStat[]> =>
    api.get('/api/patients/payment-failure-weekly').then((r) => r.data),

  getExerciseLibrary: (patientId: number): Promise<PatientExerciseLibraryResponse> =>
    api.get(`/api/patients/${patientId}/exercise-library`).then((r) => r.data),

  getBodyPartExercises: (patientId: number, bodyPartId: number): Promise<BodyPartExercisesResponse> =>
    api.get(`/api/patients/${patientId}/body-parts/${bodyPartId}/exercises`).then((r) => r.data),

  deleteBodyPart: (patientId: number, bodyPartId: number): Promise<BodyPartLibraryItem> =>
    api.delete(`/api/patients/${patientId}/body-parts/${bodyPartId}`).then((r) => r.data),

  deletePatientExercise: (patientId: number, patientExerciseId: number): Promise<ExerciseItem> =>
    api.delete(`/api/patients/${patientId}/patient-exercises/${patientExerciseId}`).then((r) => r.data),

  pushToMobile: (patientId: number, patientExerciseId: number): Promise<ExerciseItem> =>
    api.patch(`/api/patients/${patientId}/patient-exercises/${patientExerciseId}/push-to-mobile`).then((r) => r.data),

  uploadPrescription: (patientId: number, file: File): Promise<PatientProfile> => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/api/patients/${patientId}/prescription`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  uploadReport: (patientId: number, file: File): Promise<PatientProfile> => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/api/patients/${patientId}/report`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  getHistory: (patientId: number): Promise<HistoryItem[]> =>
    api.get(`/api/patients/${patientId}/history`).then((r) => r.data),

  getPreviousExercises: (patientId: number): Promise<ScheduleItem[]> =>
    api.get(`/api/patients/${patientId}/previous-exercises`).then((r) => r.data),

  getUpcomingExercises: (patientId: number): Promise<ScheduleItem[]> =>
    api.get(`/api/patients/${patientId}/upcoming-exercises`).then((r) => r.data),

  getPublishedExercises: (patientId: number): Promise<ExerciseItem[]> =>
    api.get(`/api/patients/${patientId}/published-exercises`).then((r) => r.data),

  updateStatus: (patientId: number, status: string): Promise<PatientListItem> =>
    api.patch(`/api/patients/${patientId}/status`, { status }).then((r) => r.data),
};
