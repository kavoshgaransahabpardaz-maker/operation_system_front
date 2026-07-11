import { apiClient } from './client';
import type { OrgSettings } from '@/types';

export const orgSettingsApi = {
  get: () => apiClient.get<OrgSettings>('/api/v1/org/settings'),

  update: (data: Partial<Pick<OrgSettings,
    | 'weight_qty_tolerance_pct'
    | 'value_tolerance_pct'
    | 'name_match_threshold'
    | 'doc_organization_by'
    | 'auto_fix_threshold'
    | 'email_critical_alerts'
  >>) => apiClient.patch<OrgSettings>('/api/v1/org/settings', data),
};
