import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Globe2 } from 'lucide-react';
import { toast } from 'sonner';
import { intelApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Spinner } from '@/components/shared/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import type { AxiosError } from 'axios';

export function IntelSourcePreferencesPage() {
  const qc = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: queryKeys.mySourcePreferences,
    queryFn: () => intelApi.listMySourcePreferences().then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ sourceId, is_enabled }: { sourceId: string; is_enabled: boolean }) =>
      intelApi.updateSourcePreference(sourceId, is_enabled),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.mySourcePreferences });
      qc.invalidateQueries({ queryKey: queryKeys.intelFeed() });
    },
    onError: (e: AxiosError<{ detail?: string }>) => {
      toast.error(e.response?.data?.detail ?? 'Failed to update preference');
    },
  });

  if (isLoading) return <Spinner size="lg" className="mt-20" />;

  if (!preferences?.length) {
    return (
      <EmptyState
        icon={Globe2}
        title="No sources available"
        description="No intelligence sources have been configured yet."
      />
    );
  }

  // Group by category (use source_name to derive category from preferences)
  // OrgSourcePreference has source_id, source_name, is_enabled — no category field.
  // We group all together since category isn't in OrgSourcePreference.
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold">News Sources</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Choose which sources appear in your feed.
        </p>
      </div>

      <div className="rounded-xl border bg-white shadow-sm divide-y">
        {preferences.map((pref) => (
          <div
            key={pref.source_id}
            className={`flex items-center justify-between px-5 py-3.5 ${!pref.is_enabled ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className={`inline-block shrink-0 rounded-full w-2 h-2 ${pref.is_enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <p className="text-sm font-medium truncate">{pref.source_name}</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center gap-2 ml-4 shrink-0">
              <input
                type="checkbox"
                className="sr-only"
                checked={pref.is_enabled}
                onChange={(e) =>
                  updateMutation.mutate({ sourceId: pref.source_id, is_enabled: e.target.checked })
                }
                disabled={updateMutation.isPending}
              />
              <div
                className={`h-5 w-9 rounded-full transition-colors ${pref.is_enabled ? 'bg-blue-600' : 'bg-slate-200'}`}
              >
                <div
                  className={`mt-0.5 ml-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${pref.is_enabled ? 'translate-x-4' : ''}`}
                />
              </div>
              <span className="text-xs text-muted-foreground w-14">
                {pref.is_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Disabling a source hides its articles from the feed for your entire organisation.
        Sources can be re-enabled at any time.
      </p>
    </div>
  );
}
