import { apiClient } from './client';
import type { Document, DocumentListItem } from '@/types';

export const documentsApi = {
  upload: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiClient.post<Document>('/api/v1/documents/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  list: (shipmentId?: string) =>
    apiClient.get<DocumentListItem[]>('/api/v1/documents/', {
      params: shipmentId ? { shipment_id: shipmentId } : {},
    }),

  get: (id: string) => apiClient.get<Document>(`/api/v1/documents/${id}`),

  duplicates: (id: string) => apiClient.get<DocumentListItem[]>(`/api/v1/documents/${id}/duplicates`),
};
