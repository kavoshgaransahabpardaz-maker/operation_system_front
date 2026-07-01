/**
 * queryKeys.ts — single registry for all TanStack Query cache keys.
 *
 * Modules import from here to invalidate each other's cache.
 * Never hardcode query key arrays in feature files.
 */

export const queryKeys = {
  me: ['me'] as const,
  users: ['users'] as const,

  documents: (filters?: object) => ['documents', filters] as const,
  document: (id: string) => ['document', id] as const,
  classification: (docId: string) => ['classification', docId] as const,
  duplicates: (docId: string) => ['duplicates', docId] as const,

  shipments: ['shipments'] as const,
  shipment: (id: string) => ['shipment', id] as const,
  shipmentDetail: (id: string) => ['shipmentDetail', id] as const,
  activityLog: (id: string) => ['activityLog', id] as const,

  emailConnections: ['emailConnections'] as const,
  dashboard: ['dashboard'] as const,
};
