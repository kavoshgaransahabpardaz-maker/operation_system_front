// ── Enums ──────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'manager' | 'operator';

export type DocumentSource = 'email' | 'upload';

export type DocumentStatus =
  | 'uploaded'
  | 'ocr_pending'
  | 'ocr_processing'
  | 'ocr_failed'
  | 'classified'
  | 'matched'
  | 'unmatched'
  | 'needs_review';

export type DocumentType =
  | 'commercial_invoice'
  | 'packing_list'
  | 'bill_of_lading'
  | 'air_waybill'
  | 'certificate_of_origin'
  | 'insurance_certificate'
  | 'customs_declaration'
  | 'purchase_order'
  | 'delivery_order'
  | 'other';

export type EmailProvider = 'gmail' | 'microsoft365' | 'outlook' | 'imap';

export type ReferenceType = 'bl' | 'awb' | 'invoice' | 'po' | 'container' | 'internal';

export type ShipmentStatus = 'active' | 'complete' | 'on_hold';

export type ActivityAction =
  | 'document_uploaded'
  | 'document_classified'
  | 'classification_overridden'
  | 'document_matched'
  | 'document_reassociated'
  | 'shipment_created'
  | 'shipment_status_updated'
  | 'email_synced'
  | 'field_extracted'
  | 'field_confirmed'
  | 'field_corrected'
  | 'flag_created'
  | 'flag_resolved'
  | 'comparison_run'
  | 'settings_updated';

// ── Field extraction ───────────────────────────────────────────────────────

export type FieldName =
  | 'party_shipper'
  | 'party_consignee'
  | 'invoice_value'
  | 'currency'
  | 'gross_weight'
  | 'net_weight'
  | 'quantity'
  | 'hs_code'
  | 'stated_origin'
  | 'incoterm'
  | 'invoice_date'
  | 'shipment_date'
  | 'reference';

export type FieldStatus = 'extracted' | 'confirmed' | 'corrected';

export type FieldType = 'string' | 'decimal' | 'date' | 'iso_code';

export interface ExtractedField {
  id: string;
  document_id: string;
  shipment_id: string | null;
  org_id: string;
  field_name: FieldName;
  value_raw: string;
  value_normalized: string | null;
  field_type: FieldType;
  confidence: number;
  page_number: number | null;
  status: FieldStatus;
  confirmed_at: string | null;
  confirmed_by: string | null;
  corrected_value: string | null;
  corrected_by: string | null;
  corrected_at: string | null;
  created_at: string;
}

// ── Flags & mismatches ─────────────────────────────────────────────────────

export type FlagType =
  | 'missing_document'
  | 'missing_field'
  | 'mismatch'
  | 'low_confidence'
  | 'hs_inconsistency';

export type FlagSeverity = 'critical' | 'warning' | 'info';

export type FlagStatus = 'open' | 'resolved';

export type FlagDecision = 'accepted' | 'overridden' | 'dismissed';

export interface ConflictingValue {
  document_id: string;
  field_name: FieldName;
  value_raw: string;
  page_number: number | null;
}

export interface Flag {
  id: string;
  shipment_id: string;
  org_id: string;
  flag_type: FlagType;
  severity: FlagSeverity;
  title: string;
  description: string;
  conflicting_values: ConflictingValue[] | null;
  status: FlagStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface FlagResolution {
  id: string;
  flag_id: string;
  resolved_by: string;
  decision: FlagDecision;
  chosen_value: string | null;
  note: string | null;
  created_at: string;
}

// ── Org settings ───────────────────────────────────────────────────────────

export interface OrgSettings {
  id: string;
  org_id: string;
  weight_qty_tolerance_pct: number;
  value_tolerance_pct: number;
  name_match_threshold: number;
  created_at: string;
  updated_at: string;
}

// ── Existing models ────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  org_id: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: 'bearer';
}

export interface Document {
  id: string;
  org_id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  source: DocumentSource;
  status: DocumentStatus;
  shipment_id: string | null;
  uploaded_by: string | null;
  created_at: string;
  download_url?: string | null;
}

export interface DocumentListItem {
  id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  source: DocumentSource;
  status: DocumentStatus;
  shipment_id: string | null;
  created_at: string;
}

export interface ClassificationResult {
  id: string;
  document_id: string;
  doc_type: DocumentType;
  confidence: number;
  is_manual_override: boolean;
  classified_by: string | null;
  classified_at: string;
}

export interface MailboxConnection {
  id: string;
  org_id: string;
  provider: EmailProvider;
  email_address: string;
  last_synced_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ShipmentReference {
  id: string;
  ref_type: ReferenceType;
  ref_value: string;
}

// Workspace endpoint returns references without id
export interface ShipmentReferenceOut {
  ref_type: ReferenceType;
  ref_value: string;
}

export interface Shipment {
  id: string;
  org_id: string;
  status: ShipmentStatus;
  created_at: string;
  updated_at: string;
  references: ShipmentReference[];
}

export interface DocumentSummary {
  id: string;
  filename: string;
  content_type: string;
  source: DocumentSource;
  status: DocumentStatus;
  doc_type: DocumentType | null;
  confidence: number | null;
  created_at: string;
}

export interface ShipmentDetail {
  id: string;
  org_id: string;
  status: ShipmentStatus;
  created_at: string;
  updated_at: string;
  references: ShipmentReferenceOut[];
  documents: DocumentSummary[];
}

export interface RecentEmailImport {
  id: string;
  subject: string | null;
  sender: string | null;
  provider: EmailProvider;
  received_at: string | null;
  attachment_count: number;
}

export interface DashboardStats {
  total_shipments: number;
  documents_imported_today: number;
  unclassified_documents: number;
  shipments_requiring_review: number;
  recent_email_imports: RecentEmailImport[];
}

export interface ActivityLog {
  id: string;
  action: ActivityAction;
  actor_id: string | null;
  document_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}
