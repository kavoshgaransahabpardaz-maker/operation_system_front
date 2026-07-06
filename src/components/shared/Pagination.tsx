import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;        // total items returned (use for has-more heuristic)
  hasMore: boolean;     // true when current page returned a full page
  onPage: (p: number) => void;
  className?: string;
}

export function Pagination({ page, pageSize, total, hasMore, onPage, className }: PaginationProps) {
  const from = (page - 1) * pageSize + 1;
  const to = (page - 1) * pageSize + total;

  return (
    <div className={cn('flex items-center justify-between text-xs text-slate-500', className)}>
      <span>
        {total === 0 ? 'No results' : `Showing ${from}–${to}`}
      </span>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="flex h-7 w-7 items-center justify-center rounded-md border bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="px-2 font-medium text-slate-700">Page {page}</span>
        <button
          disabled={!hasMore}
          onClick={() => onPage(page + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-md border bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
