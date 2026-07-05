import { apiClient } from './client';
import type { Flag, FlagDecision, Suggestion } from '@/types';

export const flagsApi = {
  listByShipment: (shipmentId: string, status?: 'open' | 'resolved') =>
    apiClient.get<Flag[]>(`/api/v1/shipments/${shipmentId}/flags`, {
      params: status ? { status } : {},
    }),

  resolve: (flagId: string, data: { decision: FlagDecision; chosen_value?: string; note?: string }) =>
    apiClient.post<Flag>(`/api/v1/flags/${flagId}/resolve`, data),

  suggestions: (flagId: string) =>
    apiClient.get<Suggestion[]>(`/api/v1/flags/${flagId}/suggestions`),
};
