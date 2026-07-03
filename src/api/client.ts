import axios from 'axios';
import { session } from '@/lib/session';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
});

apiClient.interceptors.request.use((config) => {
  const token = session.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      session.clearToken();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
