import { cn } from '@/lib/utils';
import { REF_TYPE_COLORS, REF_TYPE_LABELS } from '@/lib/constants';
import type { ReferenceType } from '@/types';

interface ReferenceChipProps {
  ref_type: ReferenceType;
  ref_value: string;
  className?: string;
}

export function ReferenceChip({ ref_type, ref_value, className }: ReferenceChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs',
        REF_TYPE_COLORS[ref_type],
        className
      )}
    >
      <span className="font-semibold">{REF_TYPE_LABELS[ref_type]}:</span>
      <span>{ref_value}</span>
    </span>
  );
}
