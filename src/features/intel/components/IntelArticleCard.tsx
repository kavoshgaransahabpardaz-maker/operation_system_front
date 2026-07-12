import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { formatRelative, shortId, countryFlag } from '@/lib/utils';
import { ImpactBadge } from '@/components/shared/ImpactBadge';
import { IntelEventBadge } from '@/components/shared/IntelEventBadge';
import type { IntelFeedItem } from '@/types';

interface IntelArticleCardProps {
  item: IntelFeedItem;
  onClick?: () => void;
}


export function IntelArticleCard({ item, onClick }: IntelArticleCardProps) {
  const { article, enrichment, matches, match_reason } = item;
  const isMatched = matches.length > 0 || !!match_reason;

  return (
    <div
      className={`rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
        isMatched ? 'border-blue-200' : 'border-slate-200 opacity-80'
      } ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <IntelEventBadge eventType={enrichment?.event_type ?? null} />
              <ImpactBadge score={enrichment?.impact_score ?? null} />
              {isMatched && (
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
                  Matched
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">
              {article.title}
            </h3>
            {enrichment?.summary && (
              <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                {enrichment.summary.length > 150
                  ? enrichment.summary.slice(0, 150) + '…'
                  : enrichment.summary}
              </p>
            )}
          </div>
          {article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-muted-foreground hover:text-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>

        {/* Entity chips — countries with flag emojis, HS codes */}
        {(enrichment?.countries?.length || enrichment?.hs_chapters?.length || enrichment?.hs_headings?.length) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {enrichment?.countries?.map((c) => (
              <span key={c} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                <span>{countryFlag(c)}</span>
                <span>{c}</span>
              </span>
            ))}
            {enrichment?.hs_chapters?.map((ch) => (
              <span key={ch} className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">
                HS ch.{ch}
              </span>
            ))}
            {enrichment?.hs_headings?.map((h) => (
              <span key={h} className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">
                HS {h}
              </span>
            ))}
          </div>
        )}

        {/* Matched shipments */}
        {matches.length > 0 && (
          <div
            className="mt-3 text-xs text-slate-600"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-medium">Matched to your shipments: </span>
            {matches
              .filter((m) => m.shipment_id)
              .map((m, i) => (
                <span key={m.id}>
                  {i > 0 && ', '}
                  <Link
                    to={`/shipments/${m.shipment_id}`}
                    className="font-mono text-blue-600 hover:underline"
                  >
                    {shortId(m.shipment_id!)}
                  </Link>
                </span>
              ))}
            {match_reason && (
              <p className="mt-0.5 text-slate-400 italic">{match_reason}</p>
            )}
          </div>
        )}

        {/* Match reason only (no individual shipment matches) */}
        {matches.length === 0 && match_reason && (
          <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
            <span className="font-semibold">Why this matters: </span>
            {match_reason}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{article.published_at ? formatRelative(article.published_at) : 'Date unknown'}</span>
          {enrichment?.impact_rationale && (
            <span className="italic text-right max-w-[60%] truncate" title={enrichment.impact_rationale}>
              {enrichment.impact_rationale}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
