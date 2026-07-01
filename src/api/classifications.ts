import { apiClient } from './client';
import type { ClassificationResult, DocumentType } from '@/types';

export const classificationsApi = {
  get: (documentId: string) =>
    apiClient.get<ClassificationResult>(`/api/v1/classifications/${documentId}`),

  override: (documentId: string, doc_type: DocumentType) =>
    apiClient.post<ClassificationResult>(`/api/v1/classifications/${documentId}/override`, { doc_type }),
};
