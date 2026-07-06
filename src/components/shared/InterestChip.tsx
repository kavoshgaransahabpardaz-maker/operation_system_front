import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { INTEREST_TYPE_LABELS } from '@/lib/constants';
import type { InterestType } from '@/types';

interface InterestChipProps {
  interestType: InterestType;
  value: string;
  isExplicit?: boolean;
  onRemove?: () => void;
  className?: string;
}

export function InterestChip({ interestType, value, isExplicit = true, onRemove, className }: InterestChipProps) {
  const typeLabel = INTEREST_TYPE_LABELS[interestType] ?? interestType;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        isExplicit
          ? 'bg-slate-100 text-slate-700'
          : 'bg-slate-50 text-slate-400 border border-slate-200',
        className,
      )}
      title={!isExplicit ? 'Auto-detected from your shipment history — cannot be removed' : undefined}
    >
      <span className={isExplicit ? 'text-slate-400' : 'text-slate-300'}>{typeLabel}:</span>
      {value}
      {isExplicit && onRemove && (
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
