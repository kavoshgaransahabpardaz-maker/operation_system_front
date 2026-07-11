import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { intelApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatRelative } from '@/lib/utils';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { AxiosError } from 'axios';

const STATUS_OPTIONS = ['all', 'pending', 'running', 'done', 'failed'] as const;
const TYPE_OPTIONS = ['all', 'collect', 'parse', 'enrich', 'notify'] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-600',
  running: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

function duration(start: string | null, end: string | null): string {
  if (!start || !end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60_000)}m`;
}

export function IntelJobsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: user } = useCurrentUser();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const params = {
    limit: 100,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    job_type: typeFilter !== 'all' ? typeFilter : undefined,
  };

  const { data: jobs, isLoading } = useQuery({
    queryKey: queryKeys.intelJobs(params),
    queryFn: () => intelApi.listJobs(params).then((r) => r.data),
  });

  const reprocessMutation = useMutation({
    mutationFn: (articleId: string) => intelApi.reprocessArticle(articleId),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['intelJobs'] });
      toast.success(`Reprocessing queued: ${r.data.title}`);
    },
    onError: (e: AxiosError<{ detail?: string }>) => {
      toast.error(e.response?.data?.detail ?? 'Failed to reprocess');
    },
  });

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
        <p className="text-sm font-semibold">Access denied</p>
        <p className="text-xs text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold">Pipeline Jobs</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          History of collect, parse, enrich, and notify jobs.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Status:</span>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors capitalize ${
                statusFilter === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Type:</span>
          {TYPE_OPTIONS.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors capitalize ${
                typeFilter === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Spinner size="lg" className="py-16" />
      ) : !jobs?.length ? (
        <EmptyState icon={RefreshCw} title="No jobs" description="Pipeline jobs will appear here." />
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs text-slate-500">
                <th className="px-5 py-2.5 text-left font-medium">Created</th>
                <th className="px-4 py-2.5 text-left font-medium">Source</th>
                <th className="px-4 py-2.5 text-left font-medium">Type</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-left font-medium">Articles</th>
                <th className="px-4 py-2.5 text-left font-medium">Duration</th>
                <th className="px-4 py-2.5 text-left font-medium">Error</th>
                <th className="px-4 py-2.5 text-left font-medium" />
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3 text-xs text-slate-500">{formatRelative(job.created_at)}</td>
                  <td className="px-4 py-3">
                    {job.source_id ? (
                      <button
                        className="text-xs text-blue-600 hover:underline font-mono"
                        onClick={() => navigate('/intel/sources')}
                      >
                        {job.source_id.slice(0, 8)}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                      {job.job_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_COLORS[job.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs tabular-nums text-slate-600">{job.articles_processed}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{duration(job.started_at, job.completed_at)}</td>
                  <td className="px-4 py-3 max-w-xs">
                    {job.error_message ? (
                      <span
                        className="text-xs text-red-600 truncate block"
                        title={job.error_message}
                      >
                        {job.error_message.slice(0, 60)}{job.error_message.length > 60 ? '…' : ''}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {job.status === 'failed' && job.job_type === 'enrich' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => reprocessMutation.mutate(job.id)}
                        disabled={reprocessMutation.isPending}
                      >
                        Reprocess
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
