import axios from 'axios';
import {
  LoginResponse, Doctor, DoctorStats, CreateDoctorForm,
  UpdateDoctorForm, ResetPasswordResponse, DoctorLog, ApiResponse
} from '@/types';

const apiClient = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081') + '/api',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('medicare_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (!error.response) {
      // Network error — server is down, don't redirect, let each caller handle it
      return Promise.reject(error);
    }
    if (error.response.status === 401) {
      // Only redirect to login if we're NOT already on the login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('medicare_token');
        localStorage.removeItem('medicare_admin');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email: string, password: string): Promise<ApiResponse<LoginResponse>> => {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  },
  verifyPassword: async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await apiClient.post('/auth/verify-password', { email, password });
      return res.data?.success === true;
    } catch {
      return false;
    }
  },
};

// ─── PASSKEY API ──────────────────────────────────────────────────────────────
//
// Thin wrappers around the four WebAuthn endpoints.
// The heavy lifting (navigator.credentials calls, base64url encoding) is done
// in the PasskeyButton component — these just handle HTTP transport.
//
export const passkeyAPI = {

  // ── Registration ────────────────────────────────────────────────────────────

  /** Step 1 – get PublicKeyCredentialCreationOptions from the server */
  registrationStart: async (email: string): Promise<ApiResponse<any>> => {
    const res = await apiClient.post('/auth/passkey/register/start', { email });
    return res.data;
  },

  /** Step 2 – send the authenticator response back to the server */
  registrationFinish: async (payload: {
    email: string;
    credentialId: string;
    clientDataJSON: string;
    attestationObject: string;
  }): Promise<ApiResponse<null>> => {
    const res = await apiClient.post('/auth/passkey/register/finish', payload);
    return res.data;
  },

  // ── Authentication ───────────────────────────────────────────────────────────

  /** Step 1 – get PublicKeyCredentialRequestOptions from the server */
  authStart: async (email: string): Promise<ApiResponse<any>> => {
    const res = await apiClient.post('/auth/passkey/auth/start', { email });
    return res.data;
  },

  /** Step 2 – send the authenticator assertion back and receive a JWT */
  authFinish: async (payload: {
    email: string;
    credentialId: string;
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle: string | null;
  }): Promise<ApiResponse<LoginResponse>> => {
    const res = await apiClient.post('/auth/passkey/auth/finish', payload);
    return res.data;
  },
};

// ─── Helpers (used by PasskeyButton) ─────────────────────────────────────────

/** Encode a Uint8Array (or ArrayBuffer) to Base64url without padding */
export function bufferToBase64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/** Decode a Base64url string to Uint8Array */
export function base64urlToBuffer(b64url: string): Uint8Array {
  const base64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ─── Doctors API (unchanged) ──────────────────────────────────────────────────

export const doctorsAPI = {
  getAll: async (search?: string, status?: string): Promise<ApiResponse<Doctor[]>> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (status && status !== 'ALL') params.status = status;
    const res = await apiClient.get('/doctors', { params });
    return res.data;
  },

  getById: async (id: number): Promise<ApiResponse<Doctor>> => {
    const res = await apiClient.get(`/doctors/${id}`);
    return res.data;
  },

  create: async (data: CreateDoctorForm): Promise<ApiResponse<Doctor>> => {
    const res = await apiClient.post('/doctors', data);
    return res.data;
  },

  update: async (id: number, data: UpdateDoctorForm): Promise<ApiResponse<Doctor>> => {
    const res = await apiClient.put(`/doctors/${id}`, data);
    return res.data;
  },

  getStats: async (): Promise<ApiResponse<DoctorStats>> => {
    const res = await apiClient.get('/doctors/stats');
    return res.data;
  },

  updateStatus: async (id: number, status: string): Promise<ApiResponse<Doctor>> => {
    const res = await apiClient.patch(`/doctors/${id}/status`, null, { params: { status } });
    return res.data;
  },

  resetPassword: async (id: number, newPassword: string): Promise<ApiResponse<string>> => {
    const res = await apiClient.post(`/doctors/${id}/reset-password`, { newPassword });
    return res.data;
  },

  suspend: async (id: number, reason?: string): Promise<ApiResponse<Doctor>> => {
    const res = await apiClient.post(`/doctors/${id}/suspend`, null, {
      params: reason ? { reason } : {}
    });
    return res.data;
  },

  unsuspend: async (id: number): Promise<ApiResponse<Doctor>> => {
    const res = await apiClient.post(`/doctors/${id}/unsuspend`);
    return res.data;
  },

  forceLogout: async (id: number): Promise<ApiResponse<Doctor>> => {
    const res = await apiClient.post(`/doctors/${id}/force-logout`);
    return res.data;
  },

  getLogs: async (id: number): Promise<ApiResponse<DoctorLog[]>> => {
    const res = await apiClient.get(`/doctors/${id}/logs`);
    return res.data;
  },

  getAllLogs: async (): Promise<ApiResponse<DoctorLog[]>> => {
    const res = await apiClient.get('/doctors/logs');
    return res.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const res = await apiClient.delete(`/doctors/${id}`);
    return res.data;
  },

  getClinicProfile: async (id: number) => {
    const res = await apiClient.get(`/doctors/${id}/clinic-profile`);
    return res.data;
  },

  getDoctorPatients: async (id: number, params?: { search?: string; gender?: string; status?: string }) => {
    const res = await apiClient.get(`/doctors/${id}/patients`, { params });
    return res.data;
  },

  importCsv: async (file: File): Promise<ApiResponse<{ created: number; skipped: number; errors: string[] }>> => {
    const form = new FormData();
    form.append('file', file);
    const token = typeof window !== 'undefined' ? localStorage.getItem('medicare_token') : null;
    // Use a raw axios call — bypasses the apiClient default 'Content-Type: application/json'
    // so axios can auto-set 'multipart/form-data; boundary=...' correctly for FormData
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/api/doctors/import-csv`,
      form,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          // No Content-Type here — browser/axios sets it automatically with boundary
        },
      }
    );
    return res.data;
  },

  changePassword: async (id: number, currentPassword: string, newPassword: string): Promise<ApiResponse<null>> => {
    const res = await apiClient.post(`/doctors/${id}/change-password`, { currentPassword, newPassword });
    return res.data;
  },

  getCredentials: async (username: string): Promise<ApiResponse<{ username: string; temporaryPassword: string; clinicalId: string; fullName: string; email: string; hasHashedPassword: string }>> => {
    const res = await apiClient.get(`/doctors/debug-credentials`, { params: { username } });
    return res.data;
  },
};

export const doctorAuthAPI = {
  login: async (username: string, password: string) => {
    const res = await apiClient.post('/doctors/doctor-login', { username, password });
    return res.data;
  },
};

export const doctorSetupAPI = {
  validateToken: async (token: string) => {
    const res = await apiClient.get('/doctors/setup-password/validate', { params: { token } });
    return res.data;
  },
  completeSetup: async (token: string, password: string) => {
    const res = await apiClient.post('/doctors/setup-password/complete', { token, password });
    return res.data;
  },
  resendLink: async (doctorId: number) => {
    const res = await apiClient.post(`/doctors/${doctorId}/resend-setup-link`);
    return res.data;
  },
};

export default apiClient;
