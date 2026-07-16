import { apiClient } from './client';
import type { Shipment, ShipmentDetail, ShipmentStatus } from '@/types';

export const shipmentsApi = {
  create: (invoiceNumber: string) =>
    apiClient.post<ShipmentDetail>('/api/v1/shipments/', { invoice_number: invoiceNumber }),

  list: () => apiClient.get<Shipment[]>('/api/v1/shipments/'),

  get: (id: string) => apiClient.get<ShipmentDetail>(`/api/v1/shipments/${id}`),

  updateStatus: (id: string, status: ShipmentStatus) =>
    apiClient.patch<Shipment>(`/api/v1/shipments/${id}`, { status }),

  reassociateDocument: (documentId: string, shipmentId: string) =>
    apiClient.post(`/api/v1/shipments/documents/${documentId}/reassociate`, {
      shipment_id: shipmentId,
    }),

  delete: (id: string) => apiClient.delete(`/api/v1/shipments/${id}`),
};
