import { apiClient } from './client';
import type { ExtractedField } from '@/types';

export const fieldsApi = {
  listByShipment: (shipmentId: string) =>
    apiClient.get<ExtractedField[]>(`/api/v1/shipments/${shipmentId}/fields`),

  listByDocument: (documentId: string) =>
    apiClient.get<ExtractedField[]>(`/api/v1/documents/${documentId}/fields`),

  confirm: (fieldId: string) =>
    apiClient.post<ExtractedField>(`/api/v1/fields/${fieldId}/confirm`),

  correct: (fieldId: string, corrected_value: string) =>
    apiClient.post<ExtractedField>(`/api/v1/fields/${fieldId}/correct`, { corrected_value }),
};
