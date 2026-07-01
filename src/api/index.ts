/**
 * api/index.ts — barrel re-export for all API modules.
 *
 * Import from '@/api', never from individual files like '@/api/documents'.
 * Restructuring api/ only requires updating this file, not all consumers.
 */

export { apiClient } from './client';
export { authApi } from './auth';
export { documentsApi } from './documents';
export { classificationsApi } from './classifications';
export { emailsApi } from './emails';
export { shipmentsApi } from './shipments';
export { workspaceApi } from './workspace';
