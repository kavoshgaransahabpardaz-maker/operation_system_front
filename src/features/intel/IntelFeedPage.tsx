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

const PAGE_SIZE = 20;

export function IntelFeedPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const eventType = searchParams.get('event_type') as IntelEventType | null;
  const minImpact = searchParams.get('min_impact') ? Number(searchParams.get('min_impact')) : undefined;
  const country = searchParams.get('country') ?? undefined;
  const industry = searchParams.get('industry') ?? undefined;
  const matchedOnly = searchParams.get('matched_only') === 'true';

  // Load filter options for dynamic country/industry lists
  const { data: filterOptions } = useQuery({
    queryKey: queryKeys.intelFilterOptions,
    queryFn: () => intelApi.getFilterOptions().then((r) => r.data),
  });

  const params = {
    event_type: eventType ?? undefined,
    min_impact: minImpact,
    country,
    industry,
    matched_only: matchedOnly || undefined,
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
    setPage(1);
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

        {/* Filter bar */}
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {/* Event type */}
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

          {/* Country */}
          {filterOptions && filterOptions.countries.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Country:</span>
              <select
                value={country ?? ''}
                onChange={(e) => setFilter('country', e.target.value || null)}
                className="rounded-md border bg-white px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="">All countries</option>
                {filterOptions.countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* Industry */}
          {filterOptions && filterOptions.industries.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Industry:</span>
              <select
                value={industry ?? ''}
                onChange={(e) => setFilter('industry', e.target.value || null)}
                className="rounded-md border bg-white px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="">All industries</option>
                {filterOptions.industries.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
          )}

          {/* Min impact */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Impact:</span>
            {[
              { label: 'All', value: undefined },
              { label: '≥3', value: 3 },
              { label: '≥4', value: 4 },
              { label: '5 only', value: 5 },
            ].map((opt) => (
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

          {/* Matched only */}
          <button
            onClick={() => setFilter('matched_only', matchedOnly ? null : 'true')}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              matchedOnly ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            My shipments only
          </button>
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
              { label: 'Manage Sources', path: '/intel/sources/preferences' },
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
            <strong>Impact scores</strong> are model estimates — not verified compliance flags. Sanctions hits appear as critical flags in each shipment&apos;s Flags tab.
          </p>
        </div>
      </aside>
    </div>
  );
}
