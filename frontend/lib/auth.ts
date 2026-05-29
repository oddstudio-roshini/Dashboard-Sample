/**
 * lib/auth.ts
 * ────────────
 * Auth utility functions for storing/reading login state.
 *
 * After successful login:
 *   - JWT token is stored in localStorage as "medicare_token"
 *   - Admin info is stored as "medicare_admin" (JSON)
 *
 * On logout or token expiry:
 *   - Both keys are cleared from localStorage
 *   - User is redirected to /login
 *
 * isAuthenticated() → true if a token exists in localStorage
 * getToken()        → returns the raw JWT string
 * getAdmin()        → returns the parsed admin object
 * logout()          → clears auth and redirects
 */

import { LoginResponse } from '@/types';

const TOKEN_KEY = 'medicare_token';
const ADMIN_KEY = 'medicare_admin';

export const saveAuth = (data: LoginResponse) => {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(ADMIN_KEY, JSON.stringify({
    name: data.adminName,
    email: data.adminEmail,
    role: data.role,
  }));
};

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const getAdmin = () => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(ADMIN_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
  window.location.href = '/login';
};
