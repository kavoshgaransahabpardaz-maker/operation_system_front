import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { INTEREST_TYPE_LABELS } from '@/lib/constants';
import type { InterestType } from '@/types';

interface InterestChipProps {
  interestType: InterestType;
  value: string;
  onRemove?: () => void;
  className?: string;
}

export function InterestChip({ interestType, value, onRemove, className }: InterestChipProps) {
  const typeLabel = INTEREST_TYPE_LABELS[interestType] ?? interestType;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700',
        className,
      )}
    >
      <span className="text-slate-400">{typeLabel}:</span>
      {value}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 rounded-full p-0.5 hover:bg-slate-200 transition-colors"
          aria-label={`Remove ${value}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
