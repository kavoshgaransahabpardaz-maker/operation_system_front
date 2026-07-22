import { apiClient } from './client';
import type { DocumentProduct, HsGenieRunOut } from '@/types';

export interface ProductUpdateData {
  product_name?: string | null;
  material?: string | null;
  intended_use?: string | null;
  description?: string | null;
  quantity?: string | null;
  unit_price?: string | null;
  line_total?: string | null;
  currency?: string | null;
  ship_from?: string | null;
  origin_country?: string | null;
  destination_country?: string | null;
  existing_hs_code?: string | null;
  existing_national_code?: string | null;
  lot_number?: string | null;
  expiry_date?: string | null;
  net_weight?: string | null;
  gross_weight?: string | null;
}

export const classificationApi = {
  getProduct: (productId: string) =>
    apiClient.get<DocumentProduct>(`/api/v1/products/${productId}`),

  updateProduct: (productId: string, data: ProductUpdateData) =>
    apiClient.patch<DocumentProduct>(`/api/v1/products/${productId}`, data),

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
