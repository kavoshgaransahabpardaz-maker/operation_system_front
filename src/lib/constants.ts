import type {
  DocumentStatus, DocumentType, ShipmentStatus, ReferenceType, UserRole,
  FieldName, FieldStatus, FlagType, FlagSeverity, IntelEventType, InterestType,
} from '@/types';

export const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  commercial_invoice: 'Commercial Invoice',
  packing_list: 'Packing List',
  bill_of_material: 'Bill of Material',
  bill_of_lading: 'Bill of Lading',
  certificate_of_origin: 'Certificate of Origin',
  phytosanitary_certificate: 'Phytosanitary Certificate',
  product_specification: 'Product Specification',
  air_waybill: 'Airway Bill',
  insurance_certificate: 'Insurance Certificate',
  customs_declaration: 'Customs Declaration',
  purchase_order: 'Purchase Order',
  delivery_order: 'Delivery Order',
  mill_certificate: 'Mill Certificate',
  suppliers_declaration: "Supplier's Declaration",
  cmr: 'CMR Consignment Note',
  other: 'Other',
};

export const DOC_STATUS_LABELS: Record<DocumentStatus, string> = {
  uploaded: 'Uploaded',
  ocr_pending: 'OCR Pending',
  ocr_processing: 'Processing',
  ocr_failed: 'OCR Failed',
  classified: 'Classified',
  matched: 'Matched',
  unmatched: 'Unmatched',
  needs_review: 'Needs Review',
};

export const DOC_STATUS_COLORS: Record<DocumentStatus, string> = {
  uploaded: 'bg-gray-100 text-gray-700',
  ocr_pending: 'bg-blue-50 text-blue-700',
  ocr_processing: 'bg-blue-100 text-blue-800',
  ocr_failed: 'bg-red-100 text-red-700',
  classified: 'bg-green-100 text-green-700',
  matched: 'bg-emerald-100 text-emerald-700',
  unmatched: 'bg-orange-100 text-orange-700',
  needs_review: 'bg-yellow-100 text-yellow-800',
};

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  active: 'Active',
  complete: 'Complete',
  on_hold: 'On Hold',
};

export const SHIPMENT_STATUS_COLORS: Record<ShipmentStatus, string> = {
  active: 'bg-blue-100 text-blue-700',
  complete: 'bg-green-100 text-green-700',
  on_hold: 'bg-amber-100 text-amber-800',
};

export const REF_TYPE_LABELS: Record<ReferenceType, string> = {
  bl: 'B/L',
  awb: 'AWB',
  invoice: 'Invoice',
  po: 'PO',
  container: 'Container',
  internal: 'Internal',
};

export const REF_TYPE_COLORS: Record<ReferenceType, string> = {
  bl: 'bg-blue-100 text-blue-700',
  awb: 'bg-blue-100 text-blue-700',
  invoice: 'bg-purple-100 text-purple-700',
  po: 'bg-purple-100 text-purple-700',
  container: 'bg-teal-100 text-teal-700',
  internal: 'bg-gray-100 text-gray-700',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  operator: 'Operator',
};

export const FIELD_NAME_LABELS: Record<FieldName, string> = {
  party_shipper: 'Seller / Consignor',
  vat_number_seller: 'Seller VAT / EIK',
  rex_number_seller: 'Seller REX Number',
  party_consignee: 'Buyer / Consignee',
  vat_number_buyer: 'Buyer VAT Number',
  rex_number_buyer: 'Buyer REX Number',
  eori_number: 'EORI Number',
  invoice_value: 'Invoice Value',
  vat_value: 'VAT Amount',
  freight_value: 'Freight Value',
  insurance_value: 'Insurance Value',
  currency: 'Currency',
  gross_weight: 'Gross Weight',
  net_weight: 'Net Weight',
  quantity: 'Quantity',
  total_packages: 'Total Packages',
  hs_code: 'HS / Commodity Code',
  commodity_description: 'Product Description',
  lot_number: 'Lot Number',
  product_registration_number: 'Product Reg. No.',
  product_serial_number: 'Serial Number',
  stated_origin: 'Country of Origin',
  destination_country: 'Destination Country',
  place_of_loading: 'Place of Loading',
  incoterm: 'Incoterm',
  preferential_duty: 'Preferential Duty',
  invoice_date: 'Invoice Date',
  due_date: 'Payment Due Date',
  shipment_date: 'Shipment Date',
  expiry_date: 'Expiry Date',
  reference: 'Reference / Invoice No.',
  local_reference: 'Local Reference',
  point_of_entry: 'Point of Entry',
  port_of_discharge: 'Port of Discharge',
};

// Zero-tolerance (error severity) fields per §4.5 — any mismatch is always an error
export const ZERO_TOLERANCE_FIELDS = new Set<FieldName>([
  'gross_weight', 'net_weight', 'currency', 'hs_code', 'invoice_value', 'stated_origin',
]);

export const FLAG_TYPE_LABELS: Record<FlagType, string> = {
  missing_document: 'Missing Document',
  missing_field: 'Missing Field',
  mismatch: 'Value Mismatch',
  low_confidence: 'Low Confidence',
  hs_inconsistency: 'HS Code Inconsistency',
};

export const FLAG_SEVERITY_COLORS: Record<FlagSeverity, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
};

export const FLAG_SEVERITY_ICON_COLORS: Record<FlagSeverity, string> = {
  critical: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-400',
};

export const FLAG_SEVERITY_LABELS: Record<FlagSeverity, string> = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
};

export const FIELD_STATUS_LABELS: Record<FieldStatus, string> = {
  extracted: 'Extracted',
  confirmed: 'Confirmed',
  corrected: 'Corrected',
};

export const FIELD_STATUS_COLORS: Record<FieldStatus, string> = {
  extracted: 'bg-gray-100 text-gray-600',
  confirmed: 'bg-green-100 text-green-700',
  corrected: 'bg-purple-100 text-purple-700',
};

export const MAX_FILE_BYTES = 1024 * 1024 * 1024; // 1 GB

export const MAX_BATCH_FILES = 15;

export const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'image/*',
  '.doc', '.docx',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls', '.xlsx',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv', 'text/csv',
  '.xml', 'application/xml', 'text/xml',
].join(',');

export const ACCEPTED_FILE_LABEL = 'PDF, Word, Excel, CSV, XML, or image';

// ── Trade Intelligence ─────────────────────────────────────────────────────

export const INTEL_EVENT_TYPE_LABELS: Record<IntelEventType, string> = {
  tariff_change: 'Tariff Change',
  sanctions: 'Sanctions',
  regulation: 'Regulation Update',
  trade_agreement: 'Trade Agreement',
  market_notice: 'Market Notice',
  other: 'Other',
};

export const INTEL_EVENT_TYPE_COLORS: Record<IntelEventType, string> = {
  tariff_change: 'bg-orange-100 text-orange-700 border-orange-200',
  sanctions: 'bg-red-100 text-red-700 border-red-200',
  regulation: 'bg-blue-100 text-blue-700 border-blue-200',
  trade_agreement: 'bg-green-100 text-green-700 border-green-200',
  market_notice: 'bg-slate-100 text-slate-700 border-slate-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
};

/** Impact score 1–5 → Tailwind color classes */
export const IMPACT_SCORE_COLORS: Record<number, string> = {
  1: 'bg-slate-100 text-slate-600',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-amber-100 text-amber-700',
  4: 'bg-orange-100 text-orange-700',
  5: 'bg-red-100 text-red-700',
};

export const INTEREST_TYPE_LABELS: Record<InterestType, string> = {
  hs_chapter: 'HS Chapter',
  hs_heading: 'HS Heading',
  hs_code: 'HS Code',
  country: 'Country',
  party_name: 'Party Name',
  industry: 'Industry',
};

export const INTEREST_TYPE_FORMAT_HINTS: Record<InterestType, string> = {
  hs_chapter: '2-digit number, e.g. 72',
  hs_heading: '4-digit number, e.g. 7208',
  hs_code: '6–10 digit number, e.g. 720851',
  country: '2-letter ISO alpha-2 code, e.g. GB',
  party_name: 'Free text, e.g. Acme Steel Ltd',
  industry: 'Free text, e.g. Automotive',
};
