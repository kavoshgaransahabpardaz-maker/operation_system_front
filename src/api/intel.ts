import { apiClient } from './client';
import type {
  IntelFeedItem, IntelArticle, IntelEnrichment, IntelSource, UserInterest,
  AlertDelivery, IntelMatch, InterestType,
} from '@/types';

export interface IntelFeedParams {
  hs_chapter?: string;
  hs_heading?: string;
  country?: string;
  event_type?: string;
  date_from?: string;
  date_to?: string;
  skip?: number;
  limit?: number;
}

export interface IntelArticleDetail {
  article: IntelArticle;
  enrichment: IntelEnrichment | null;
  matches: IntelMatch[];
}

export const intelApi = {
  feed: (params?: IntelFeedParams) =>
    apiClient.get<IntelFeedItem[]>('/api/v1/intel/feed', { params }),

  search: (q: string, params?: Omit<IntelFeedParams, 'skip' | 'limit'> & { skip?: number; limit?: number }) =>
    apiClient.get<IntelFeedItem[]>('/api/v1/intel/search', { params: { q, ...params } }),

  article: (articleId: string) =>
    apiClient.get<IntelArticleDetail>(`/api/v1/intel/articles/${articleId}`),

  shipmentIntel: (shipmentId: string) =>
    apiClient.get<IntelFeedItem[]>(`/api/v1/shipments/${shipmentId}/intel`),

  listInterests: () =>
    apiClient.get<UserInterest[]>('/api/v1/intel/interests'),

  addInterest: (data: { interest_type: InterestType; value: string }) =>
    apiClient.post<UserInterest>('/api/v1/intel/interests', data),

  deleteInterest: (interestId: string) =>
    apiClient.delete(`/api/v1/intel/interests/${interestId}`),

  listAlerts: (params?: { skip?: number; limit?: number }) =>
    apiClient.get<AlertDelivery[]>('/api/v1/intel/alerts', { params }),

  listSources: () =>
    apiClient.get<IntelSource[]>('/api/v1/intel/sources'),

  pollSource: (sourceId: string) =>
    apiClient.post(`/api/v1/intel/sources/${sourceId}/poll`),
};
