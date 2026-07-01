import { apiClient } from './client';
import type { DashboardStats, ShipmentDetail, ActivityLog } from '@/types';

export const workspaceApi = {
  dashboard: () => apiClient.get<DashboardStats>('/api/v1/workspace/dashboard'),

  shipmentDetail: (shipmentId: string) =>
    apiClient.get<ShipmentDetail>(`/api/v1/workspace/shipments/${shipmentId}`),

  activityLog: (shipmentId: string, limit = 50) =>
    apiClient.get<ActivityLog[]>(`/api/v1/workspace/shipments/${shipmentId}/activity`, {
      params: { limit },
    }),
};
