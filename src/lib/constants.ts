import type {
  DocumentStatus, DocumentType, ShipmentStatus, ReferenceType, UserRole,
  FieldName, FieldStatus, FlagType, FlagSeverity,
} from '@/types';

export const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  commercial_invoice: 'Commercial Invoice',
  packing_list: 'Packing List',
  bill_of_lading: 'Bill of Lading',
  air_waybill: 'Air Waybill',
  certificate_of_origin: 'Certificate of Origin',
  insurance_certificate: 'Insurance Certificate',
  customs_declaration: 'Customs Declaration',
  purchase_order: 'Purchase Order',
  delivery_order: 'Delivery Order',
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
  admin: 'Admin',
  manager: 'Manager',
  operator: 'Operator',
};

export const FIELD_NAME_LABELS: Record<FieldName, string> = {
  party_shipper: 'Shipper',
  party_consignee: 'Consignee',
  invoice_value: 'Invoice Value',
  currency: 'Currency',
  gross_weight: 'Gross Weight',
  net_weight: 'Net Weight',
  quantity: 'Quantity',
  hs_code: 'HS Code',
  stated_origin: 'Country of Origin',
  incoterm: 'Incoterm',
  invoice_date: 'Invoice Date',
  shipment_date: 'Shipment Date',
  reference: 'Reference Number',
};

// Zero-tolerance fields — any mismatch is always critical
export const ZERO_TOLERANCE_FIELDS = new Set<FieldName>([
  'hs_code', 'stated_origin', 'currency', 'incoterm',
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

export const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB

export const ACCEPTED_FILE_TYPES = 'application/pdf,image/*';
