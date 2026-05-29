// lib/clinicsApi.ts
import axios from 'axios';
import type { Hospital, Branch, ClinicDoctor, ClinicPatient, ClinicStats, BodyPartCount } from '@/types/clinics';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('medicare_token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const clinicsApi = {
  getStats: (): Promise<ClinicStats> =>
    api.get('/api/clinics/stats').then(r => r.data),

  getBodyPartCounts: (): Promise<BodyPartCount[]> =>
    api.get('/api/clinics/body-part-counts').then(r => r.data),

  // bodyPart absent = all hospitals (Hospitals Directory)
 getHospitals: async (params?: {
  bodyPart?: string;
  status?: string;
  pincode?: string;
  search?: string;
  hospitalName?: string;
  area?: string;
}) :
  Promise<Hospital[]> =>
    api.get('/api/clinics/hospitals', { params }).then(r => r.data),

  getHospital: (id: number): Promise<Hospital> =>
    api.get(`/api/clinics/hospitals/${id}`).then(r => r.data),

  getAllBranches: (params?: { search?: string; status?: string }): Promise<Branch[]> =>
    api.get('/api/clinics/branches', { params }).then(r => r.data),

  getBranches: (hospitalId: number, params?: { status?: string; search?: string }): Promise<Branch[]> =>
    api.get(`/api/clinics/hospitals/${hospitalId}/branches`, { params }).then(r => r.data),

  getBranch: (id: number): Promise<Branch> =>
    api.get(`/api/clinics/branches/${id}`).then(r => r.data),

  getDoctorsByHospital: (hospitalId: number, params?: { search?: string }): Promise<ClinicDoctor[]> =>
    api.get(`/api/clinics/hospitals/${hospitalId}/doctors`, { params }).then(r => r.data),

  getDoctors: (branchId: number, params?: { status?: string; search?: string }): Promise<ClinicDoctor[]> =>
    api.get(`/api/clinics/branches/${branchId}/doctors`, { params }).then(r => r.data),

  getDoctor: (id: number): Promise<ClinicDoctor> =>
    api.get(`/api/clinics/doctors/${id}`).then(r => r.data),

  getPatients: (doctorId: number, params?: {
    status?: string;
    gender?: string;
    search?: string;
  }): Promise<ClinicPatient[]> =>
    api.get(`/api/clinics/doctors/${doctorId}/patients`, { params }).then(r => r.data),
};
