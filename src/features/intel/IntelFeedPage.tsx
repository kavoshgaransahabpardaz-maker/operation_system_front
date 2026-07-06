import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Newspaper, BookOpen } from 'lucide-react';
import { intelApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { IntelArticleCard } from './components/IntelArticleCard';
import { IntelInterestsPanel } from './components/IntelInterestsPanel';
import { INTEL_EVENT_TYPE_LABELS } from '@/lib/constants';
import type { IntelEventType } from '@/types';

const EVENT_TYPES: IntelEventType[] = [
  'tariff_change', 'sanctions', 'regulation', 'trade_agreement', 'market_notice', 'other',
];

const IMPACT_OPTIONS = [
  { label: 'All', value: undefined },
  { label: 'High (≥4)', value: 4 },
  { label: 'Critical (5)', value: 5 },
];

const PAGE_SIZE = 20;

export function IntelFeedPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const eventType = searchParams.get('event_type') as IntelEventType | null;
  const minImpact = searchParams.get('min_impact') ? Number(searchParams.get('min_impact')) : undefined;

  const params = {
    event_type: eventType ?? undefined,
    min_impact: minImpact,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };

  const { data: feed, isLoading } = useQuery({
    queryKey: queryKeys.intelFeed(params),
    queryFn: () => intelApi.feed(params).then((r) => r.data),
    refetchInterval: 300_000,
    placeholderData: (prev) => prev,
  });

  function setFilter(key: string, val: string | null) {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val); else next.delete(key);
    setSearchParams(next, { replace: true });
    setPage(1); // reset page on filter change
  }

  const matched = feed?.filter((item) => item.matches.length > 0) ?? [];
  const unmatched = feed?.filter((item) => item.matches.length === 0) ?? [];
  const total = feed?.length ?? 0;
  const hasMore = total === PAGE_SIZE;

  return (
    <div className="flex gap-6">
      {/* Main feed */}
      <div className="min-w-0 flex-1 space-y-4">
        {/* Search */}
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
          <Button variant="outline" onClick={() => { if (q.trim()) navigate(`/intel/search?q=${encodeURIComponent(q)}`); }}>
            Search
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilter('event_type', null)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                !eventType ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              All types
            </button>
            {EVENT_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setFilter('event_type', t === eventType ? null : t)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  eventType === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {INTEL_EVENT_TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Impact:</span>
            {IMPACT_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => setFilter('min_impact', opt.value ? String(opt.value) : null)}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  minImpact === opt.value ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <Spinner size="lg" className="py-16" />
        ) : !feed?.length ? (
          <EmptyState
            icon={Newspaper}
            title="No intelligence events yet"
            description="Add followed topics or connect more shipments to see matched events."
            action={
              <Button variant="outline" onClick={() => navigate('/intel/interests')}>
                <BookOpen className="h-4 w-4 mr-2" /> Manage interests
              </Button>
            }
          />
        ) : (
          <>
            <div className="space-y-4">
              {matched.length > 0 && (
                <div className="space-y-3">
                  {matched.map((item) => (
                    <IntelArticleCard
                      key={item.article.id}
                      item={item}
                      onClick={() => navigate(`/intel/articles/${item.article.id}`)}
                    />
                  ))}
                </div>
              )}

              {unmatched.length > 0 && (
                <>
                  {matched.length > 0 && (
                    <div className="flex items-center gap-3 py-2">
                      <div className="flex-1 h-px bg-slate-200" />
                      <span className="text-xs text-slate-400 font-medium">Other trade news</span>
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>
                  )}
                  <div className="space-y-3">
                    {unmatched.map((item) => (
                      <IntelArticleCard
                        key={item.article.id}
                        item={item}
                        onClick={() => navigate(`/intel/articles/${item.article.id}`)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              hasMore={hasMore}
              onPage={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            />
          </>
        )}
      </div>

      {/* Sidebar */}
      <aside className="w-72 shrink-0 space-y-4">
        <IntelInterestsPanel />
        <div className="rounded-xl border bg-white p-4 shadow-sm space-y-2">
          <p className="text-xs font-semibold text-slate-600">Quick links</p>
          <div className="space-y-1">
            {[
              { label: 'My interests', path: '/intel/interests' },
              { label: 'Analytics', path: '/intel/analytics' },
              { label: 'Alerts', path: '/intel/alerts' },
              { label: 'Notifications', path: '/intel/notifications' },
            ].map(({ label, path }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="block w-full text-left text-xs text-blue-600 hover:underline py-0.5"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">
            <strong>Impact scores</strong> are model estimates — not verified compliance flags. Sanctions hits appear as critical flags in each shipment's Flags tab.
          </p>
        </div>
      </aside>
    </div>
  );
}
