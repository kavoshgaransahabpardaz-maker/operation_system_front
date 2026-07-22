import { apiClient } from './client';
import type { HsGenieRunOut } from '@/types';

export const classificationApi = {
  verify: (productId: string) =>
    apiClient.post<HsGenieRunOut>(`/api/v1/products/${productId}/hs-verify`),

  classify: (productId: string) =>
    apiClient.post<HsGenieRunOut>(`/api/v1/products/${productId}/hs-classify`),

  select: (productId: string, runId: string, code: string) =>
    apiClient.post<HsGenieRunOut>(`/api/v1/products/${productId}/hs-select`, {
      run_id: runId,
      code,
    }),

  feedback: (
    productId: string,
    runId: string,
    isCorrect: boolean,
    correctCode?: string,
    reason?: string,
  ) =>
    apiClient.post<HsGenieRunOut>(`/api/v1/products/${productId}/hs-feedback`, {
      run_id: runId,
      is_correct: isCorrect,
      correct_code: correctCode ?? null,
      reason: reason ?? null,
    }),
};
