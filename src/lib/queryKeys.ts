export const queryKeys = {
  me: ['me'] as const,
  users: ['users'] as const,

  documents: (filters?: object) => ['documents', filters] as const,
  document: (id: string) => ['document', id] as const,
  classification: (docId: string) => ['classification', docId] as const,
  duplicates: (docId: string) => ['duplicates', docId] as const,
  documentFields: (docId: string) => ['documentFields', docId] as const,

  shipments: ['shipments'] as const,
  shipment: (id: string) => ['shipment', id] as const,
  shipmentDetail: (id: string) => ['shipmentDetail', id] as const,
  shipmentFields: (id: string) => ['shipmentFields', id] as const,
  shipmentFlags: (id: string, status?: string) => ['shipmentFlags', id, status] as const,
  activityLog: (id: string) => ['activityLog', id] as const,

  emailConnections: ['emailConnections'] as const,
  dashboard: ['dashboard'] as const,
  orgSettings: ['orgSettings'] as const,
};
