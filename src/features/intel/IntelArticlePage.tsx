import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, Ship } from 'lucide-react';
import { intelApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared/Spinner';
import { ImpactBadge } from '@/components/shared/ImpactBadge';
import { IntelEventBadge } from '@/components/shared/IntelEventBadge';
import { formatRelative, shortId } from '@/lib/utils';

export function IntelArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.intelArticle(id!),
    queryFn: () => intelApi.article(id!).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading) return <Spinner size="lg" className="mt-20" />;
  if (!data) return <p className="text-sm text-muted-foreground p-6">Article not found.</p>;

  const { article, enrichment, matches } = data;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Button>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <IntelEventBadge eventType={enrichment?.event_type ?? null} />
          <ImpactBadge score={enrichment?.impact_score ?? null} />
          <span className="text-xs text-muted-foreground">
            {article.published_at ? formatRelative(article.published_at) : 'Date unknown'}
          </span>
        </div>

        <h1 className="text-xl font-bold text-slate-900">{article.title}</h1>

        {article.url && (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            View source <ExternalLink className="h-3 w-3" />
          </a>
        )}

        {enrichment?.summary && (
          <div className="mt-4 rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">AI Summary</p>
            <p className="text-sm text-slate-700">{enrichment.summary}</p>
            <p className="mt-2 text-[11px] italic text-muted-foreground">
              Model estimate — not a verified compliance determination.
            </p>
          </div>
        )}

        {enrichment?.impact_rationale && (
          <div className="mt-3 text-sm text-slate-600">
            <span className="font-medium">Impact rationale: </span>
            {enrichment.impact_rationale}
          </div>
        )}

        <div className="mt-4 border-t pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Full Content</p>
          <pre className="whitespace-pre-wrap text-xs text-slate-700 font-sans leading-relaxed">
            {article.content_raw}
          </pre>
        </div>
      </div>

      {/* Entity tags */}
      {(enrichment?.countries?.length || enrichment?.hs_chapters?.length || enrichment?.hs_headings?.length || enrichment?.regulation_refs?.length) && (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold">Entities & References</h2>
          <div className="flex flex-wrap gap-2">
            {enrichment?.countries?.map((c) => (
              <span key={c} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                {c}
              </span>
            ))}
            {enrichment?.hs_chapters?.map((ch) => (
              <span key={ch} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
                HS ch. {ch}
              </span>
            ))}
            {enrichment?.hs_headings?.map((h) => (
              <span key={h} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
                HS {h}
              </span>
            ))}
            {enrichment?.regulation_refs?.map((r) => (
              <span key={r} className="rounded-full bg-purple-50 px-2.5 py-1 text-xs text-purple-700">
                {r}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Shipment matches */}
      {matches.length > 0 && (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold">Matched Shipments</h2>
          <div className="space-y-2">
            {matches.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2">
                <div className="flex items-center gap-2 text-xs">
                  <Ship className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-blue-900">{m.match_reason}</span>
                </div>
                {m.shipment_id && (
                  <Link
                    to={`/shipments/${m.shipment_id}`}
                    className="text-xs font-mono text-blue-600 hover:underline"
                  >
                    {shortId(m.shipment_id)}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
