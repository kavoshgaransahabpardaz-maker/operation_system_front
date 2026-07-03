import { cn } from '@/lib/utils';
import { FLAG_SEVERITY_COLORS, FLAG_SEVERITY_LABELS } from '@/lib/constants';
import type { FlagSeverity } from '@/types';

interface Props {
  severity: FlagSeverity;
  className?: string;
}

export function SeverityBadge({ severity, className }: Props) {
  return (
    <span
      className={cn(
        'inline-block rounded border px-1.5 py-0.5 text-xs font-medium capitalize',
        FLAG_SEVERITY_COLORS[severity],
        className,
      )}
    >
      {FLAG_SEVERITY_LABELS[severity]}
    </span>
  );
}
