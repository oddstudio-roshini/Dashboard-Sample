import axios from 'axios';
import type { SalesProvider, SalesStats, SalesFilters, SalesTask, CrmUpdateRequest } from '@/types/sales';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('medicare_token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const salesApi = {
  getProviders: (params?: {
    search?: string;
    category?: string;
    area?: string;
    pincode?: string;
    whaleOnly?: boolean;
  }): Promise<SalesProvider[]> =>
    api.get('/api/sales/providers', { params }).then(r => r.data),

  updateCrm: (id: number, req: CrmUpdateRequest): Promise<SalesProvider> =>
    api.put(`/api/sales/providers/${id}/crm`, req).then(r => r.data),

  getStats: (): Promise<SalesStats> =>
    api.get('/api/sales/stats').then(r => r.data),

  getFilters: (): Promise<SalesFilters> =>
    api.get('/api/sales/filters').then(r => r.data),

  getTasks: (): Promise<SalesTask[]> =>
    api.get('/api/sales/tasks').then(r => r.data),
};
