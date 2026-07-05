import { cn } from '@/lib/utils';
import { INTEL_EVENT_TYPE_COLORS, INTEL_EVENT_TYPE_LABELS } from '@/lib/constants';
import type { IntelEventType } from '@/types';

interface IntelEventBadgeProps {
  eventType: IntelEventType | null;
  className?: string;
}

export function IntelEventBadge({ eventType, className }: IntelEventBadgeProps) {
  if (!eventType) return null;
  const colors = INTEL_EVENT_TYPE_COLORS[eventType] ?? 'bg-gray-100 text-gray-700 border-gray-200';
  const label = INTEL_EVENT_TYPE_LABELS[eventType] ?? eventType;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        colors,
        className,
      )}
    >
      {label}
    </span>
  );
}
