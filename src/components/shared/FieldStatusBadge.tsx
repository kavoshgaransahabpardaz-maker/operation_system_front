import { cn } from '@/lib/utils';
import { FIELD_STATUS_COLORS, FIELD_STATUS_LABELS } from '@/lib/constants';
import type { FieldStatus } from '@/types';

interface Props {
  status: FieldStatus;
  className?: string;
}

export function FieldStatusBadge({ status, className }: Props) {
  return (
    <span
      className={cn(
        'inline-block rounded px-1.5 py-0.5 text-xs font-medium',
        FIELD_STATUS_COLORS[status],
        className,
      )}
    >
      {FIELD_STATUS_LABELS[status]}
    </span>
  );
}
