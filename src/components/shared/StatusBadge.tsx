import { cn } from '@/lib/utils';
import { DOC_STATUS_COLORS, DOC_STATUS_LABELS, SHIPMENT_STATUS_COLORS, SHIPMENT_STATUS_LABELS } from '@/lib/constants';
import type { DocumentStatus, ShipmentStatus } from '@/types';

interface StatusBadgeProps {
  status: DocumentStatus | ShipmentStatus;
  className?: string;
}

const docStatuses = new Set<string>([
  'uploaded', 'ocr_pending', 'ocr_processing', 'ocr_failed',
  'classified', 'matched', 'unmatched', 'needs_review',
]);

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const isDoc = docStatuses.has(status);
  const colorClass = isDoc
    ? DOC_STATUS_COLORS[status as DocumentStatus]
    : SHIPMENT_STATUS_COLORS[status as ShipmentStatus];
  const label = isDoc
    ? DOC_STATUS_LABELS[status as DocumentStatus]
    : SHIPMENT_STATUS_LABELS[status as ShipmentStatus];

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', colorClass, className)}>
      {label}
    </span>
  );
}
