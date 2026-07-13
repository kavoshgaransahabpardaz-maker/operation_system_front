import { apiClient } from './client';
import type { MailboxConnection } from '@/types';


export const emailsApi = {
  createImap: (data: {
    email_address: string;
    imap_host: string;
    imap_port?: number;
    password: string;
  }) => apiClient.post<MailboxConnection>('/api/v1/email/connections/imap', data),

  list: () => apiClient.get<MailboxConnection[]>('/api/v1/email/connections'),

  sync: (connectionId: string) =>
    apiClient.post<Record<string, never>>(
      `/api/v1/email/connections/${connectionId}/sync`
    ),

  disconnect: (connectionId: string) =>
    apiClient.delete(`/api/v1/email/connections/${connectionId}`),

  updateKeywords: (connectionId: string, keywords: string[] | null) =>
    apiClient.patch<MailboxConnection>(`/api/v1/email/connections/${connectionId}/keywords`, { keywords }),
};
