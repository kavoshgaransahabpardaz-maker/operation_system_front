import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, CheckCircle, AlertCircle, Globe } from 'lucide-react';
import { intelApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatRelative } from '@/lib/utils';

export function IntelSourcesPage() {
  const qc = useQueryClient();

  const { data: sources, isLoading } = useQuery({
    queryKey: queryKeys.intelSources,
    queryFn: () => intelApi.listSources().then((r) => r.data),
  });

  const pollMutation = useMutation({
    mutationFn: (sourceId: string) => intelApi.pollSource(sourceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.intelSources }),
  });

  if (isLoading) return <Spinner size="lg" className="mt-20" />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold">Intelligence Sources</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Configured data feeds. Polling cadence is managed server-side.
        </p>
      </div>

      {!sources?.length ? (
        <EmptyState
          icon={Globe}
          title="No sources configured"
          description="Contact your administrator to add intelligence sources."
        />
      ) : (
        <div className="rounded-xl border bg-white shadow-sm divide-y">
          {sources.map((src) => (
            <div key={src.id} className="flex items-start gap-3 px-5 py-4">
              <div className="mt-0.5 shrink-0">
                {src.is_active ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-slate-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{src.name}</p>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline truncate block"
                >
                  {src.url}
                </a>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {src.source_type && <span>Type: {src.source_type}</span>}
                  <span>Polls every {src.poll_cadence_minutes}m</span>
                  {src.last_polled_at && <span>Last: {formatRelative(src.last_polled_at)}</span>}
                </div>
                {src.last_error && (
                  <p className="mt-1 text-xs text-red-500">{src.last_error}</p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs shrink-0"
                onClick={() => pollMutation.mutate(src.id)}
                disabled={pollMutation.isPending}
              >
                <RefreshCw className="h-3 w-3" />
                Poll now
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
