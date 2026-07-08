import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { intelApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Spinner } from '@/components/shared/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatRelative } from '@/lib/utils';

export function IntelAlertsPage() {
  const { data: alerts, isLoading } = useQuery({
    queryKey: queryKeys.intelAlerts,
    queryFn: () => intelApi.listAlerts(100).then((r) => r.data),
  });

  if (isLoading) return <Spinner size="lg" className="mt-20" />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Alerts</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Recent email and in-app alert deliveries.
        </p>
      </div>

      {!alerts?.length ? (
        <EmptyState
          icon={Bell}
          title="No alerts yet"
          description="Alerts will appear here once trade events matching your interests are detected."
        />
      ) : (
        <div className="rounded-xl border bg-white shadow-sm divide-y">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-start gap-3 px-5 py-3.5">
              <div className="mt-0.5 shrink-0">
                {alert.status === 'sent' ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{alert.subject ?? '(no subject)'}</p>
                {alert.body_summary && (
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{alert.body_summary}</p>
                )}
              </div>
              <div className="shrink-0 text-right space-y-1">
                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  alert.delivery_type === 'email'
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {alert.delivery_type}
                </span>
                <p className="text-xs text-muted-foreground">{formatRelative(alert.delivered_at)}</p>
                {alert.article_id && (
                  <Link
                    to={`/intel/articles/${alert.article_id}`}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    View article <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
