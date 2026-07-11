import { apiClient } from './client';
import type { User, TokenResponse, UserRole } from '@/types';

export const authApi = {
  // Sign in with Google — sends Google ID token, receives our JWT
  googleLogin: (credential: string) =>
    apiClient.post<TokenResponse>('/api/v1/auth/google', { credential }),

  // Create a new org + admin using Google ID token
  registerWithGoogle: (data: { credential: string; org_name: string; org_slug: string }) =>
    apiClient.post<User>('/api/v1/auth/register-with-google', data),

  me: () => apiClient.get<User>('/api/v1/auth/me'),

  listUsers: () => apiClient.get<User[]>('/api/v1/auth/users'),

  // Invite a user — they sign in via Google using this email
  createUser: (data: { email: string; role?: UserRole }) =>
    apiClient.post<User>('/api/v1/auth/users', data),

  updateUser: (userId: string, data: { role?: UserRole; is_active?: boolean }) =>
    apiClient.patch<User>(`/api/v1/auth/users/${userId}`, data),
};
