import { saClient as apiClient } from './sa_client';
import type { UserRole, UserOutWithOrg, OrgOutWithStats, IntelSource, IntelJob } from '@/types';

interface IntelSourceCreate {
  name: string;
  url: string;
  category?: string;
  source_type?: string;
  poll_cadence_minutes?: number;
  priority?: number;
  is_active?: boolean;
}

interface SuperAdminAnalytics {
  organizations: { total: number };
  users: { total: number; active: number; by_role: Record<string, number> };
  intel_sources: { total: number; active: number };
  intel_articles: { total: number; enriched: number };
  intel_jobs: { total: number; failed: number };
  generated_at: string;
}

export const superAdminApi = {
  // Users
  listUsers: (filters?: { is_active?: boolean; role?: UserRole; org_id?: string }) =>
    apiClient.get<UserOutWithOrg[]>('/api/v1/admin/users', { params: filters }),

  updateUser: (userId: string, data: { role?: UserRole; is_active?: boolean }) =>
    apiClient.patch<UserOutWithOrg>(`/api/v1/admin/users/${userId}`, data),

  // Organisations
  listOrgs: () =>
    apiClient.get<OrgOutWithStats[]>('/api/v1/admin/organizations'),

  createOrg: (data: { name: string; slug: string }) =>
    apiClient.post<OrgOutWithStats>('/api/v1/admin/organizations', data),

  updateOrg: (orgId: string, data: { name?: string; slug?: string }) =>
    apiClient.patch<OrgOutWithStats>(`/api/v1/admin/organizations/${orgId}`, data),

  // Sources
  listSources: () =>
    apiClient.get<IntelSource[]>('/api/v1/admin/sources'),

  createSource: (data: IntelSourceCreate) =>
    apiClient.post<IntelSource>('/api/v1/admin/sources', data),

  updateSource: (sourceId: string, data: Partial<IntelSourceCreate>) =>
    apiClient.patch<IntelSource>(`/api/v1/admin/sources/${sourceId}`, data),

  deleteSource: (sourceId: string) =>
    apiClient.delete(`/api/v1/admin/sources/${sourceId}`),

  // Jobs
  listJobs: (filters?: { status?: string; source_id?: string; limit?: number }) =>
    apiClient.get<IntelJob[]>('/api/v1/admin/jobs', { params: filters }),

  // Analytics
  analytics: () =>
    apiClient.get<SuperAdminAnalytics>('/api/v1/admin/analytics'),
};
