import axios from 'axios';
import { saSession } from '@/lib/sa_session';

export const saClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
});

saClient.interceptors.request.use((config) => {
  const token = saSession.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

saClient.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      saSession.clearToken();
      window.location.href = '/sa/login';
    }
    return Promise.reject(err);
  },
);
