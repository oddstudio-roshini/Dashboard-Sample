import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('medicare_token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Types (mirror the backend DTOs) ──────────────────────────────────────────

export interface ExerciseDTO {
  id: number;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  price: number;
  purchased: boolean;
  category: string;
  developer: string;
  developerDate: string;
  views: number;
  purchases: number;
  status: 'published' | 'draft' | 'scheduled';
  updatedAt?: string | null;
  scheduledAt?: string | null;
}

export interface ExerciseLogEntry {
  id: number;
  action: 'CREATED' | 'UPDATED' | 'PUBLISHED' | 'UNPUBLISHED' | 'DELETED';
  details: string;
  timestamp: string; // ISO datetime string
}

export interface ExerciseLogsResponse {
  exerciseName: string;
  version: number;        // count of UPDATED actions
  updatedAt: string | null;
  logs: ExerciseLogEntry[];
}

export interface CategoryDTO {
  id: number;
  name: string;
  description: string;
  bundlePrice: number;
  exerciseCount: number;
  status: 'published' | 'draft';
  badgeColor: string;
  image: string;
  exercises: ExerciseDTO[];
}

export interface StatsDTO {
  totalExercises: number;
  published: number;
  draft: number;
  totalViews: number;
  totalPurchases: number;
}

export interface UpdateExerciseRequest {
  name?: string;
  level?: string;
  duration?: string;
  price?: number;
  category?: string;
  developer?: string;
  status?: string;
}

export interface PublishRequest {
  mode: 'now' | 'schedule';
  scheduleDate?: string;
}

// ─── API calls ─────────────────────────────────────────────────────────────────

export const exerciseLibraryApi = {
  /** Fetch all body-part categories (each with their exercises) */
  getCategories: (): Promise<CategoryDTO[]> =>
    api.get('/api/exercises/categories').then((r) => r.data),

  /** Fetch admin stats (totals, views, purchases) */
  getStats: (): Promise<StatsDTO> =>
    api.get('/api/exercises/stats').then((r) => r.data),

  /** Update exercise fields */
  updateExercise: (id: number, req: UpdateExerciseRequest): Promise<ExerciseDTO> =>
    api.put(`/api/exercises/${id}`, req).then((r) => r.data),

  /** Permanently delete an exercise */
  deleteExercise: (id: number): Promise<void> =>
    api.delete(`/api/exercises/${id}`).then((r) => r.data),

  /** Toggle published ↔ draft */
  togglePublish: (id: number, req: PublishRequest): Promise<ExerciseDTO> =>
    api.patch(`/api/exercises/${id}/publish`, req).then((r) => r.data),

  /** Pull from cloud (stub) */
  cloudSync: (): Promise<{ success: boolean; message: string }> =>
    api.post('/api/exercises/cloud-sync').then((r) => r.data),

  /** Fetch activity log timeline for one exercise */
  getLogs: (id: number): Promise<ExerciseLogsResponse> =>
    api.get(`/api/exercises/${id}/logs`).then((r) => r.data),
};
