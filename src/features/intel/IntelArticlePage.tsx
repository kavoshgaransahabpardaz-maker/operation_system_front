import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, Ship, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { intelApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared/Spinner';
import { ImpactBadge } from '@/components/shared/ImpactBadge';
import { IntelEventBadge } from '@/components/shared/IntelEventBadge';
import { formatRelative, shortId } from '@/lib/utils';
import type { AxiosError } from 'axios';

/** Convert ISO 3166-1 alpha-2 country code to a flag emoji. */
function countryFlag(code: string): string {
  const upper = code.toUpperCase();
  if (upper.length !== 2) return '';
  return String.fromCodePoint(
    ...upper.split('').map((c) => 0x1f1e0 + c.charCodeAt(0) - 65),
  );
}

function ArticleFeedback({ articleId }: { articleId: string }) {
  const qc = useQueryClient();

  const { data: myFeedback } = useQuery({
    queryKey: queryKeys.articleFeedback(articleId),
    queryFn: () => intelApi.getMyFeedback(articleId).then((r) => r.data),
  });

  const submitMutation = useMutation({
    mutationFn: (feedback: 'like' | 'dislike') =>
      intelApi.submitFeedback(articleId, { feedback }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.articleFeedback(articleId) });
    },
    onError: (e: AxiosError<{ detail?: string }>) => {
      toast.error(e.response?.data?.detail ?? 'Failed to submit feedback');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => intelApi.deleteFeedback(articleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.articleFeedback(articleId) });
    },
    onError: (e: AxiosError<{ detail?: string }>) => {
      toast.error(e.response?.data?.detail ?? 'Failed to remove feedback');
    },
  });

  function handleClick(value: 'like' | 'dislike') {
    if (myFeedback?.feedback === value) {
      deleteMutation.mutate();
    } else {
      submitMutation.mutate(value);
    }
  }

  const isPending = submitMutation.isPending || deleteMutation.isPending;

  return (
    <div className="mt-4 flex items-center gap-2 border-t pt-4">
      <span className="text-xs text-muted-foreground mr-1">Was this useful?</span>
      <button
        type="button"
        disabled={isPending}
        onClick={() => handleClick('like')}
        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
          myFeedback?.feedback === 'like'
            ? 'bg-green-100 text-green-700 border-green-200'
            : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
        }`}
      >
        <ThumbsUp className="h-3.5 w-3.5" /> Like
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => handleClick('dislike')}
        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
          myFeedback?.feedback === 'dislike'
            ? 'bg-red-100 text-red-700 border-red-200'
            : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
        }`}
      >
        <ThumbsDown className="h-3.5 w-3.5" /> Dislike
      </button>
    </div>
  );
}

function PersonalizedSummarySection({ articleId }: { articleId: string }) {
  const [requested, setRequested] = useState(false);

  const { data: summary, isLoading, isError } = useQuery({
    queryKey: queryKeys.personalizedSummary(articleId),
    queryFn: () => intelApi.getPersonalizedSummary(articleId).then((r) => r.data),
    enabled: requested,
    retry: false,
  });

  if (!requested) {
    return (
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <h2 className="text-sm font-semibold">Personalized Summary</h2>
        </div>
        <Button variant="outline" size="sm" onClick={() => setRequested(true)}>
          Get my summary
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Spinner size="sm" />
          Generating summary tailored to your interests…
        </div>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <h2 className="text-sm font-semibold">Personalized Summary</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Add interests to your profile to get personalized summaries.{' '}
          <a href="/intel/interests" className="text-blue-600 hover:underline">Manage interests →</a>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-purple-500" />
        <h2 className="text-sm font-semibold">Summary for your interests</h2>
      </div>
      <p className="text-sm text-slate-700">{summary.summary}</p>
      {summary.relevant_interests.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-muted-foreground">Relevant to:</span>
          {summary.relevant_interests.map((interest) => (
            <span key={interest} className="rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-700">
              {interest}
            </span>
          ))}
        </div>
      )}
      {summary.general_summary && summary.general_summary !== summary.summary && (
        <details className="text-xs text-slate-500">
          <summary className="cursor-pointer hover:text-slate-700">General summary</summary>
          <p className="mt-1 leading-relaxed">{summary.general_summary}</p>
        </details>
      )}
    </div>
  );
}

export function IntelArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contentExpanded, setContentExpanded] = useState(false);

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
          <button
            className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
            onClick={() => setContentExpanded((v) => !v)}
          >
            View full source text
            {contentExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {contentExpanded && (
            <pre className="mt-3 max-h-96 overflow-y-auto whitespace-pre-wrap text-xs text-slate-700 font-sans leading-relaxed rounded bg-slate-50 p-3">
              {article.content_raw}
            </pre>
          )}
        </div>

        {id && <ArticleFeedback articleId={id} />}
      </div>

      {/* Personalized summary */}
      {id && <PersonalizedSummarySection articleId={id} />}

      {/* Entity tags */}
      {(enrichment?.countries?.length || enrichment?.hs_chapters?.length || enrichment?.hs_headings?.length || enrichment?.regulation_refs?.length) && (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold">Entities & References</h2>
          <div className="flex flex-wrap gap-2">
            {enrichment?.countries?.map((c) => (
              <span key={c} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                <span>{countryFlag(c)}</span>
                <span>{c}</span>
              </span>
            ))}
            {enrichment?.hs_chapters?.map((ch) => (
              <button
                key={ch}
                className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700 hover:bg-blue-100 transition-colors"
                onClick={() => navigate(`/intel/search?q=${encodeURIComponent(ch)}`)}
              >
                HS ch. {ch}
              </button>
            ))}
            {enrichment?.hs_headings?.map((h) => (
              <button
                key={h}
                className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700 hover:bg-blue-100 transition-colors"
                onClick={() => navigate(`/intel/search?q=${encodeURIComponent(h)}`)}
              >
                HS {h}
              </button>
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
          <h2 className="mb-3 text-sm font-semibold">This article matches {matches.length} of your shipments</h2>
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
