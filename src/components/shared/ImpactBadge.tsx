import { cn } from '@/lib/utils';
import { IMPACT_SCORE_COLORS } from '@/lib/constants';

interface ImpactBadgeProps {
  score: number | null;
  className?: string;
}

export function ImpactBadge({ score, className }: ImpactBadgeProps) {
  if (score === null) return null;
  const clamped = Math.max(1, Math.min(5, Math.round(score)));
  const colors = IMPACT_SCORE_COLORS[clamped] ?? 'bg-gray-100 text-gray-600';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        colors,
        className,
      )}
      title="Model-estimated impact score — not a verified compliance flag"
    >
      Impact {clamped}/5
    </span>
  );
}
