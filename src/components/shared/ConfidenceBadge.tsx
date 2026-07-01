import { cn } from '@/lib/utils';

interface ConfidenceBadgeProps {
  confidence: number; // 0–1
  className?: string;
}

export function ConfidenceBadge({ confidence, className }: ConfidenceBadgeProps) {
  const pct = Math.round(confidence * 100);
  const barColor =
    confidence >= 0.7 ? 'bg-green-500' : confidence >= 0.5 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative h-2 w-24 overflow-hidden rounded-full bg-gray-200">
        <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
    </div>
  );
}
