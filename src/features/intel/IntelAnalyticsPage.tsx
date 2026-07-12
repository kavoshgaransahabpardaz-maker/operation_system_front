import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { intelApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Spinner } from '@/components/shared/Spinner';
import { INTEL_EVENT_TYPE_LABELS, INTEL_EVENT_TYPE_COLORS, IMPACT_SCORE_COLORS } from '@/lib/constants';
import { cn, countryFlag } from '@/lib/utils';

const DAY_OPTIONS = [7, 30, 90, 365] as const;
type Days = typeof DAY_OPTIONS[number];

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export function IntelAnalyticsPage() {
  const navigate = useNavigate();
  const [days, setDays] = useState<Days>(30);

  const { data: heatmap, isLoading: heatLoading } = useQuery({
    queryKey: queryKeys.intelHeatmap(days),
    queryFn: () => intelApi.countryHeatmap(days).then((r) => r.data),
  });

  const { data: byType, isLoading: typeLoading } = useQuery({
    queryKey: queryKeys.intelByEventType(days),
    queryFn: () => intelApi.byEventType(days).then((r) => r.data),
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: queryKeys.intelTimeline(days),
    queryFn: () => intelApi.impactTimeline(days).then((r) => r.data),
  });

  const { data: trending } = useQuery({
    queryKey: queryKeys.intelTrending(),
    queryFn: () => intelApi.trendingTopics({ limit: 30 }).then((r) => r.data),
  });

  const maxHeatmap = Math.max(1, ...(heatmap?.map((h) => h.article_count) ?? [0]));
  const maxType = Math.max(1, ...(byType?.map((b) => b.article_count) ?? [0]));
  const maxTimeline = Math.max(1, ...(timeline?.map((t) => t.article_count) ?? [0]));

  return (
    <div className="space-y-8">
      {/* Date range selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Period:</span>
        {DAY_OPTIONS.map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              days === d ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 hover:bg-slate-50'
            )}
          >
            {d === 365 ? '1y' : `${d}d`}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Country Heatmap */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <SectionHeader title="Activity by Country" subtitle="Articles mentioning each country" />
          {heatLoading ? <Spinner size="sm" /> : !heatmap?.length ? (
            <p className="text-xs text-muted-foreground">No data</p>
          ) : (
            <div className="space-y-2">
              {heatmap.slice(0, 15).map((h) => (
                <button
                  key={h.country}
                  className="flex w-full items-center gap-3 group"
                  onClick={() => navigate(`/tradewatch?country=${h.country}`)}
                >
                  <span className="w-14 text-right text-xs shrink-0 flex items-center justify-end gap-1">
                    <span>{countryFlag(h.country)}</span>
                    <span className="font-mono text-slate-500">{h.country}</span>
                  </span>
                  <div className="flex-1 h-4 rounded bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded bg-blue-400 group-hover:bg-blue-500 transition-colors"
                      style={{ width: `${(h.article_count / maxHeatmap) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-xs tabular-nums text-slate-500 shrink-0">{h.article_count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* By Event Type */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <SectionHeader title="By Event Type" subtitle="Distribution of article types" />
          {typeLoading ? <Spinner size="sm" /> : !byType?.length ? (
            <p className="text-xs text-muted-foreground">No data</p>
          ) : (
            <div className="space-y-2">
              {byType.map((b) => {
                const colorClass = INTEL_EVENT_TYPE_COLORS[b.event_type] ?? 'bg-gray-100 text-gray-700';
                const bgOnly = colorClass.split(' ')[0];
                return (
                  <div key={b.event_type} className="flex items-center gap-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold w-32 text-center shrink-0', colorClass)}>
                      {INTEL_EVENT_TYPE_LABELS[b.event_type] ?? b.event_type}
                    </span>
                    <div className="flex-1 h-4 rounded bg-slate-100 overflow-hidden">
                      <div
                        className={cn('h-full rounded', bgOnly)}
                        style={{ width: `${(b.article_count / maxType) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-xs tabular-nums text-slate-500 shrink-0">{b.article_count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Impact Timeline */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <SectionHeader title="Impact Timeline" subtitle="Average impact score and article volume per day" />
        {timelineLoading ? <Spinner size="sm" /> : !timeline?.length ? (
          <p className="text-xs text-muted-foreground">No data</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex items-end gap-1 min-w-max" style={{ minHeight: 80 }}>
              {timeline.map((t) => {
                const scoreIdx = Math.max(1, Math.min(5, Math.round(t.avg_impact_score)));
                const scoreColor = IMPACT_SCORE_COLORS[scoreIdx]?.split(' ')[0] ?? 'bg-slate-300';
                const heightPct = (t.article_count / maxTimeline) * 72;
                return (
                  <div key={t.date} className="flex flex-col items-center gap-1 group" title={`${t.date}: ${t.article_count} articles, avg impact ${t.avg_impact_score.toFixed(1)}`}>
                    <div
                      className={cn('w-4 rounded-t transition-colors', scoreColor, 'group-hover:opacity-80')}
                      style={{ height: Math.max(4, heightPct) }}
                    />
                    <span className="text-[9px] text-slate-400 rotate-45 origin-left">{t.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[10px] text-slate-400 italic">Bar color = average impact score. Bar height = article count.</p>
          </div>
        )}
      </div>

      {/* Trending Topics */}
      {trending && trending.length > 0 && (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <SectionHeader title="Trending Topics" subtitle="Most-cited entities across recent articles" />
          <div className="flex flex-wrap gap-2">
            {trending.map((t) => (
              <button
                key={t.id}
                onClick={() => navigate(`/tradewatch/search?q=${encodeURIComponent(t.topic)}`)}
                className="inline-flex items-center gap-1.5 rounded-full border bg-slate-50 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 transition-colors"
              >
                {t.topic}
                <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold">{t.article_count}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
