import { cn } from '@/lib/utils';

interface ConfidenceBadgeProps {
  confidence: number; // 0–1
  compact?: boolean;
  className?: string;
}

export function ConfidenceBadge({ confidence, compact, className }: ConfidenceBadgeProps) {
  const pct = Math.round(confidence * 100);
  const barColor =
    confidence >= 0.7 ? 'bg-green-500' : confidence >= 0.5 ? 'bg-amber-500' : 'bg-red-500';

  if (compact) {
    return (
      <span
        className={cn(
          'inline-block rounded px-1.5 py-0.5 text-xs font-medium tabular-nums',
          confidence >= 0.7
            ? 'bg-green-100 text-green-700'
            : confidence >= 0.5
              ? 'bg-amber-100 text-amber-700'
              : 'bg-red-100 text-red-700',
          className,
        )}
      >
        {pct}%
      </span>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative h-2 w-24 overflow-hidden rounded-full bg-gray-200">
        <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
    </div>
  );
}
