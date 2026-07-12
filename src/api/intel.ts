import { apiClient } from './client';
import type {
  IntelFeedItem, IntelSource, UserInterest, AlertDelivery, InterestType,
  IntelJob, TrendingTopic, KnowledgeRelation, NotificationPreference,
  HeatmapEntry, EventTypeCount, ImpactTimelineEntry, IntelEventType,
  FilterOptions, MyFeedback, ArticleFeedback, InterestTypeOption,
  OrgSourcePreference, PersonalizedSummary,
} from '@/types';

export interface IntelFeedParams {
  limit?: number;
  offset?: number;
  event_type?: IntelEventType;
  min_impact?: number;
  country?: string;
  industry?: string;
  matched_only?: boolean;
}

export const intelApi = {
  // ── Feed & Search ─────────────────────────────────────────────────────────

  feed: (params?: IntelFeedParams) =>
    apiClient.get<IntelFeedItem[]>('/api/v1/intel/feed', { params }),

  search: (q: string, limit = 20) =>
    apiClient.get<IntelFeedItem[]>('/api/v1/intel/search', { params: { q, limit } }),

  article: (articleId: string) =>
    apiClient.get<IntelFeedItem>(`/api/v1/intel/articles/${articleId}`),

  shipmentIntel: (shipmentId: string) =>
    apiClient.get<IntelFeedItem[]>(`/api/v1/shipments/${shipmentId}/intel`),

  tagsAutocomplete: (prefix: string) =>
    apiClient.get<string[]>('/api/v1/intel/tags/autocomplete', { params: { prefix } }),

  hsAutocomplete: (q: string) =>
    apiClient.get<{ results: { code: string; description: string }[] }>('/api/v1/intel/hs/autocomplete', { params: { q } }),

  // ── Interests ─────────────────────────────────────────────────────────────

  listInterests: () =>
    apiClient.get<UserInterest[]>('/api/v1/intel/interests'),

  addInterest: (data: { interest_type: InterestType; value: string }) =>
    apiClient.post<UserInterest>('/api/v1/intel/interests', data),

  deleteInterest: (interestId: string) =>
    apiClient.delete(`/api/v1/intel/interests/${interestId}`),

  // ── Alerts ────────────────────────────────────────────────────────────────

  listAlerts: (limit = 50) =>
    apiClient.get<AlertDelivery[]>('/api/v1/intel/alerts', { params: { limit } }),

  // ── Notification Preferences ──────────────────────────────────────────────

  getNotificationPreferences: () =>
    apiClient.get<NotificationPreference>('/api/v1/intel/notifications/preferences'),

  updateNotificationPreferences: (data: Partial<Pick<NotificationPreference,
    'min_impact_score' | 'event_types' | 'delivery_channels' | 'is_active'
  >>) =>
    apiClient.patch<NotificationPreference>('/api/v1/intel/notifications/preferences', data),

  // ── Analytics ─────────────────────────────────────────────────────────────

  trendingTopics: (params?: { limit?: number; topic_type?: string }) =>
    apiClient.get<TrendingTopic[]>('/api/v1/intel/analytics/trending', { params }),

  countryHeatmap: (days = 30) =>
    apiClient.get<HeatmapEntry[]>('/api/v1/intel/analytics/heatmap', { params: { days } }),

  byEventType: (days = 30) =>
    apiClient.get<EventTypeCount[]>('/api/v1/intel/analytics/by-event-type', { params: { days } }),

  impactTimeline: (days = 30) =>
    apiClient.get<ImpactTimelineEntry[]>('/api/v1/intel/analytics/impact-timeline', { params: { days } }),

  // ── Knowledge Graph ───────────────────────────────────────────────────────

  knowledgeGraph: (subjectType: string, subjectValue: string) =>
    apiClient.get<KnowledgeRelation[]>('/api/v1/intel/knowledge-graph', {
      params: { subject_type: subjectType, subject_value: subjectValue },
    }),

  // ── Sources (Admin) ───────────────────────────────────────────────────────

  listSources: () =>
    apiClient.get<IntelSource[]>('/api/v1/intel/sources'),

  createSource: (data: {
    name: string; source_type?: string; category?: string;
    url: string; poll_cadence_minutes?: number; is_active?: boolean;
    priority?: number; config?: Record<string, unknown>;
  }) => apiClient.post<IntelSource>('/api/v1/intel/sources', data),

  updateSource: (sourceId: string, data: Partial<Omit<IntelSource, 'id' | 'created_at' | 'articles_collected' | 'health_status'>>) =>
    apiClient.patch<IntelSource>(`/api/v1/intel/sources/${sourceId}`, data),

  deactivateSource: (sourceId: string) =>
    apiClient.delete(`/api/v1/intel/sources/${sourceId}`),

  pollSource: (sourceId: string) =>
    apiClient.post<{ status: string; source_id: string; source_name: string }>(
      `/api/v1/intel/sources/${sourceId}/poll`
    ),

  // ── Jobs (Admin) ──────────────────────────────────────────────────────────

  listJobs: (params?: { limit?: number; status?: string; job_type?: string }) =>
    apiClient.get<IntelJob[]>('/api/v1/intel/jobs', { params }),

  // ── Admin: Reprocess ─────────────────────────────────────────────────────

  reprocessArticle: (articleId: string) =>
    apiClient.post<{ status: string; article_id: string; title: string }>(
      `/api/v1/intel/admin/reprocess/${articleId}`
    ),

  // ── Feed filter options ───────────────────────────────────────────────────

  getFilterOptions: () =>
    apiClient.get<FilterOptions>('/api/v1/intel/filter-options'),

  // ── Article feedback ──────────────────────────────────────────────────────

  getMyFeedback: (articleId: string) =>
    apiClient.get<MyFeedback>(`/api/v1/intel/articles/${articleId}/feedback`),

  submitFeedback: (articleId: string, data: { feedback: 'like' | 'dislike'; comment?: string }) =>
    apiClient.post<ArticleFeedback>(`/api/v1/intel/articles/${articleId}/feedback`, data),

  deleteFeedback: (articleId: string) =>
    apiClient.delete(`/api/v1/intel/articles/${articleId}/feedback`),

  // ── Personalized summary ──────────────────────────────────────────────────

  getPersonalizedSummary: (articleId: string) =>
    apiClient.get<PersonalizedSummary>(`/api/v1/intel/articles/${articleId}/personalized-summary`),

  // ── Interest type catalogue ───────────────────────────────────────────────

  listInterestTypes: () =>
    apiClient.get<InterestTypeOption[]>('/api/v1/intel/interest-types'),

  // ── Knowledge graph stats ─────────────────────────────────────────────────

  knowledgeGraphStats: () =>
    apiClient.get<{ total_relations: number; by_predicate: Record<string, number>; by_subject_type: Record<string, number> }>(
      '/api/v1/intel/knowledge-graph/stats'
    ),

  // ── Source preferences ────────────────────────────────────────────────────

  listMySourcePreferences: () =>
    apiClient.get<OrgSourcePreference[]>('/api/v1/intel/sources/my-preferences'),

  updateSourcePreference: (sourceId: string, is_enabled: boolean) =>
    apiClient.patch<OrgSourcePreference>(`/api/v1/intel/sources/${sourceId}/preference`, { is_enabled }),
};
