import { apiClient } from './client';
import type { User, TokenResponse, UserRole } from '@/types';

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<TokenResponse>('/api/v1/auth/login', { email, password }),

  register: (data: { email: string; password: string; org_name: string; org_slug: string }) =>
    apiClient.post<User>('/api/v1/auth/register', data),

  me: () => apiClient.get<User>('/api/v1/auth/me'),

  listUsers: () => apiClient.get<User[]>('/api/v1/auth/users'),

  createUser: (data: { email: string; password: string; role?: UserRole }) =>
    apiClient.post<User>('/api/v1/auth/users', data),

  updateUser: (userId: string, data: { role?: UserRole; is_active?: boolean }) =>
    apiClient.patch<User>(`/api/v1/auth/users/${userId}`, data),

  requestPasswordReset: (email: string) =>
    apiClient.post<{ reset_token: string; message: string }>('/api/v1/auth/password-reset', { email }),

  confirmPasswordReset: (token: string, new_password: string) =>
    apiClient.post<{ status: string }>('/api/v1/auth/password-reset/confirm', { token, new_password }),
};
