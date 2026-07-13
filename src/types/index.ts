// ── Enums ──────────────────────────────────────────────────────────────────

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'operator';

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
  | 'mill_certificate'
  | 'suppliers_declaration'
  | 'cmr'
  | 'phytosanitary_certificate'
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
  | 'reference'
  | 'local_reference'
  | 'destination_country'
  | 'point_of_entry'
  | 'commodity_description';

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

// ── Suggestions ────────────────────────────────────────────────────────────

export interface Suggestion {
  field_name: FieldName;
  suggested_value: string;
  cited_document_ids: string[];
  rationale: string;
}

// ── Org settings ───────────────────────────────────────────────────────────

export interface OrgSettings {
  id: string;
  org_id: string;
  weight_qty_tolerance_pct: number;
  value_tolerance_pct: number;
  name_match_threshold: number;
  doc_organization_by: 'shipment' | 'client' | 'lane' | 'date';
  auto_fix_threshold: number;
  email_critical_alerts: boolean;
  ocr_languages?: string;
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
  onboarding_complete?: boolean;
  created_at: string;
}

export interface UserOutWithOrg {
  id: string;
  email: string;
  org_id: string;
  org_name: string;
  org_slug: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface OrgOutWithStats {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  user_count: number;
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
  doc_type?: DocumentType | null;
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
  email_keywords?: string[] | null;
  created_at: string;
}

export interface ShipmentReference {
  id: string;
  ref_type: ReferenceType;
  ref_value: string;
}

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

export interface AttentionShipment {
  id: string;
  short_id: string;
  flag_count: number;
}

export interface DashboardStats {
  total_shipments: number;
  documents_imported_today: number;
  unclassified_documents: number;
  shipments_requiring_review: number;
  open_flags_critical?: number;
  pending_field_reviews?: number;
  attention_queue?: AttentionShipment[];
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

// ── Trade Intelligence ─────────────────────────────────────────────────────

export type IntelEventType =
  | 'tariff_change'
  | 'sanctions'
  | 'regulation'
  | 'trade_agreement'
  | 'market_notice'
  | 'other';

export type InterestType = 'hs_chapter' | 'hs_heading' | 'hs_code' | 'country' | 'party_name' | 'industry';

export type AlertDeliveryType = 'email';

export type AlertDeliveryStatus = 'sent' | 'failed';

export interface IntelArticle {
  id: string;
  source_id: string;
  url: string | null;
  title: string;
  content_raw: string;
  published_at: string | null;
  ingested_at: string;
  language: string | null;
  author: string | null;
  image_url: string | null;
  word_count: number | null;
  is_duplicate: boolean;
  processing_status: 'raw' | 'parsed' | 'enriched' | 'failed';
}

export interface IntelEnrichment {
  id: string;
  article_id: string;
  summary: string | null;
  event_type: IntelEventType | null;
  countries: string[] | null;
  hs_chapters: string[] | null;
  hs_headings: string[] | null;
  regulation_refs: string[] | null;
  impact_score: number | null;
  impact_rationale: string | null;
  model_version: string;
  enriched_at: string;
  // Extended fields
  industries: string[] | null;
  companies: string[] | null;
  commodities: string[] | null;
  topics: string[] | null;
  trade_agreements: string[] | null;
  ports: string[] | null;
  currencies: string[] | null;
  severity: string | null;
  urgency: string | null;
  supply_chain_impact: string | null;
  price_effect: string | null;
  affected_industries: string[] | null;
  affected_countries: string[] | null;
}

export interface IntelMatch {
  id: string;
  article_id: string;
  shipment_id: string | null;
  org_id: string;
  match_reason: string;
  match_score: number | null;
  created_at: string;
}

export interface IntelFeedItem {
  article: IntelArticle;
  enrichment: IntelEnrichment | null;
  matches: IntelMatch[];
  match_reason: string | null;
}

export interface IntelSource {
  id: string;
  name: string;
  source_type: string | null;
  category: string | null;
  url: string;
  poll_cadence_minutes: number;
  is_active: boolean;
  last_polled_at: string | null;
  last_error: string | null;
  health_status: string;
  articles_collected: number;
  priority: number;
  config: Record<string, unknown> | null;
  created_at: string;
}

export interface IntelJob {
  id: string;
  source_id: string | null;
  job_type: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  articles_processed: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface TrendingTopic {
  id: string;
  topic: string;
  topic_type: string;
  article_count: number;
  period_start: string;
  period_end: string;
  created_at: string;
}

export interface KnowledgeRelation {
  id: string;
  subject_type: string;
  subject_value: string;
  predicate: string;
  object_type: string;
  object_value: string;
  article_id: string | null;
  confidence: number;
  created_at: string;
}

export interface NotificationPreference {
  id: string;
  org_id: string;
  user_id: string;
  min_impact_score: number;
  event_types: IntelEventType[];
  delivery_channels: ('email')[];
  is_active: boolean;
  created_at: string;
}

export interface HeatmapEntry {
  country: string;
  article_count: number;
}

export interface EventTypeCount {
  event_type: IntelEventType;
  article_count: number;
}

export interface ImpactTimelineEntry {
  date: string;
  avg_impact_score: number;
  article_count: number;
}

export interface SearchResult {
  article_id: string;
  title: string;
  url: string | null;
  published_at: string | null;
  ingested_at: string | null;
  processing_status: string;
  rank: number;
  match_source: string;
}

export interface UserInterest {
  id: string;
  org_id: string;
  interest_type: InterestType;
  value: string;
  is_explicit: boolean;
  created_at: string;
}

export interface AlertDelivery {
  id: string;
  org_id: string;
  article_id: string | null;
  delivery_type: AlertDeliveryType;
  subject: string | null;
  body_summary: string | null;
  delivered_at: string;
  status: AlertDeliveryStatus;
}

// ── Article feedback ───────────────────────────────────────────────────────

export interface ArticleFeedback {
  id: string;
  article_id: string;
  user_id: string;
  feedback: 'like' | 'dislike';
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface MyFeedback {
  feedback: 'like' | 'dislike' | null;
  comment: string | null;
}

// ── Interest type catalogue ────────────────────────────────────────────────

export interface InterestTypeOption {
  type: InterestType;
  label: string;
  description: string;
  example: string;
  format_hint: string;
}

// ── Source preference per org ──────────────────────────────────────────────

export interface OrgSourcePreference {
  id: string;
  source_id: string;
  source_name: string;
  is_enabled: boolean;
  created_at: string;
}

// ── Feed filter options ────────────────────────────────────────────────────

export interface ImpactLevel {
  level: number;
  label: string;
  description: string;
}

export interface EventTypeOption {
  value: IntelEventType;
  label: string;
  description: string;
}

export interface FilterOptions {
  countries: string[];
  industries: string[];
  event_types: EventTypeOption[];
  impact_scale: ImpactLevel[];
}

// ── Personalized summary ───────────────────────────────────────────────────

export interface PersonalizedSummary {
  article_id: string;
  summary: string;
  relevant_interests: string[];
  general_summary: string | null;
}
