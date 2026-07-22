import { saClient } from './sa_client';

interface SaTokenResponse {
  access_token: string;
  token_type: string;
}

interface SaUser {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
}

export const saAuthApi = {
  login: (username: string, password: string) =>
    saClient.post<SaTokenResponse>('/api/v1/sa/auth/login', { username, password }),

  me: () =>
    saClient.get<SaUser>('/api/v1/sa/auth/me'),
};
