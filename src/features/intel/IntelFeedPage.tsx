import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Newspaper } from 'lucide-react';
import { intelApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { IntelArticleCard } from './components/IntelArticleCard';
import { IntelInterestsPanel } from './components/IntelInterestsPanel';
import { INTEL_EVENT_TYPE_LABELS } from '@/lib/constants';
import type { IntelEventType } from '@/types';

const EVENT_TYPES: IntelEventType[] = [
  'tariff_change', 'sanctions', 'regulation', 'trade_agreement', 'market_notice', 'other',
];

export function IntelFeedPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState('');
  const eventType = searchParams.get('event_type') as IntelEventType | null;

  const params = {
    event_type: eventType ?? undefined,
    limit: 50,
  };

  const { data: feed, isLoading } = useQuery({
    queryKey: queryKeys.intelFeed(params),
    queryFn: () => intelApi.feed(params).then((r) => r.data),
  });

  function setFilter(key: string, val: string | null) {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val); else next.delete(key);
    setSearchParams(next, { replace: true });
  }

  return (
    <div className="flex gap-6">
      {/* Main feed */}
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && q.trim()) navigate(`/intel/search?q=${encodeURIComponent(q)}`);
              }}
              placeholder="Search trade intelligence…"
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => { if (q.trim()) navigate(`/intel/search?q=${encodeURIComponent(q)}`); }}
          >
            Search
          </Button>
        </div>

        {/* Event type filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('event_type', null)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              !eventType
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            All
          </button>
          {EVENT_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setFilter('event_type', t === eventType ? null : t)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                eventType === t
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {INTEL_EVENT_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {isLoading ? (
          <Spinner size="lg" className="py-16" />
        ) : !feed?.length ? (
          <EmptyState
            icon={Newspaper}
            title="No intelligence events yet"
            description="Add followed topics or connect more shipments to see matched events."
          />
        ) : (
          <div className="space-y-3">
            {feed.map((item) => (
              <IntelArticleCard
                key={item.article.id}
                item={item}
                onClick={() => navigate(`/intel/articles/${item.article.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside className="w-72 shrink-0 space-y-4">
        <IntelInterestsPanel />
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">
            <strong>Impact scores</strong> are model estimates — not verified compliance flags. Sanctions hits appear as critical flags in each shipment's Flags tab.
          </p>
        </div>
      </aside>
    </div>
  );
}
