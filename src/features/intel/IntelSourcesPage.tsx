import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, CheckCircle, AlertCircle, Globe, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { intelApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/shared/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatRelative } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { IntelSource } from '@/types';
import type { AxiosError } from 'axios';

const HEALTH_COLORS: Record<string, string> = {
  healthy: 'bg-green-100 text-green-700',
  degraded: 'bg-amber-100 text-amber-700',
  dead: 'bg-red-100 text-red-700',
  unknown: 'bg-slate-100 text-slate-500',
};

const CATEGORY_COLORS: Record<string, string> = {
  tariff: 'bg-orange-100 text-orange-700',
  sanctions: 'bg-red-100 text-red-700',
  regulation: 'bg-blue-100 text-blue-700',
  trade_news: 'bg-slate-100 text-slate-600',
};

interface SourceFormData {
  name: string;
  source_type: string;
  category: string;
  url: string;
  poll_cadence_minutes: number;
  is_active: boolean;
  priority: number;
}

const EMPTY_FORM: SourceFormData = {
  name: '', source_type: 'rss', category: 'trade_news',
  url: '', poll_cadence_minutes: 60, is_active: true, priority: 5,
};

function SourceDialog({
  open, onClose, initial, sourceId,
}: {
  open: boolean;
  onClose: () => void;
  initial?: SourceFormData;
  sourceId?: string;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<SourceFormData>(initial ?? EMPTY_FORM);
  const isEdit = !!sourceId;

  const mutation = useMutation({
    mutationFn: () =>
      isEdit
        ? intelApi.updateSource(sourceId!, form)
        : intelApi.createSource(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.intelSources });
      toast.success(isEdit ? 'Source updated' : 'Source created');
      onClose();
    },
    onError: (e: AxiosError<{ detail?: string }>) => {
      toast.error(e.response?.data?.detail ?? 'Failed to save source');
    },
  });

  const field = (key: keyof SourceFormData) => ({
    value: String(form[key]),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.type === 'number' ? Number(e.target.value) : e.target.value })),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Source' : 'Add Intelligence Source'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input {...field('name')} placeholder="UK Sanctions OFSI" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Type</Label>
              <select className="w-full rounded-md border px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400" {...field('source_type')}>
                {['rss', 'scraper', 'api', 'sanctions_list'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <select className="w-full rounded-md border px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400" {...field('category')}>
                {['tariff', 'sanctions', 'regulation', 'trade_news'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>URL</Label>
            <Input {...field('url')} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Poll every (min)</Label>
              <Input type="number" min={5} {...field('poll_cadence_minutes')} />
            </div>
            <div className="space-y-1">
              <Label>Priority (1–10)</Label>
              <Input type="number" min={1} max={10} {...field('priority')} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="accent-blue-600"
            />
            Active
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name || !form.url}>
            {mutation.isPending ? 'Saving…' : isEdit ? 'Update' : 'Add Source'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function IntelSourcesPage() {
  const qc = useQueryClient();
  const { data: user } = useCurrentUser();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSource, setEditSource] = useState<IntelSource | null>(null);

  const { data: sources, isLoading } = useQuery({
    queryKey: queryKeys.intelSources,
    queryFn: () => intelApi.listSources().then((r) => r.data),
  });

  const { data: recentJobs } = useQuery({
    queryKey: queryKeys.intelJobs({ limit: 500, status: 'done' }),
    queryFn: () => intelApi.listJobs({ limit: 500, status: 'done' }).then((r) => r.data),
  });

  const pollMutation = useMutation({
    mutationFn: (sourceId: string) => intelApi.pollSource(sourceId),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: queryKeys.intelSources });
      toast.success(`Poll queued: ${r.data.source_name}`);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (sourceId: string) => intelApi.deactivateSource(sourceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.intelSources });
      toast.success('Source deactivated');
    },
  });

  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
        <p className="text-sm font-semibold">Access denied</p>
        <p className="text-xs text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  // Health dashboard summary
  const healthy = sources?.filter((s) => s.health_status === 'healthy').length ?? 0;
  const degraded = sources?.filter((s) => s.health_status === 'degraded').length ?? 0;
  const dead = sources?.filter((s) => s.health_status === 'dead').length ?? 0;
  const active = sources?.filter((s) => s.is_active).length ?? 0;
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const articlesLast24h = recentJobs?.reduce((sum, j) => {
    return new Date(j.created_at).getTime() >= cutoff ? sum + (j.articles_processed ?? 0) : sum;
  }, 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Health dashboard */}
      {sources && sources.length > 0 && (
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Active sources', value: active, color: 'text-slate-900' },
            { label: 'Healthy', value: healthy, color: 'text-green-700' },
            { label: 'Degraded', value: degraded, color: 'text-amber-700' },
            { label: 'Dead', value: dead, color: 'text-red-700' },
            { label: 'Articles last 24h', value: articlesLast24h, color: 'text-blue-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`mt-1 text-2xl font-bold tabular-nums ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Intelligence Sources</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Configured data feeds. Polling cadence is managed server-side.</p>
        </div>
        <Button size="sm" className="gap-1" onClick={() => { setEditSource(null); setDialogOpen(true); }}>
          <Plus className="h-3.5 w-3.5" /> Add Source
        </Button>
      </div>

      {isLoading ? (
        <Spinner size="lg" className="mt-20" />
      ) : !sources?.length ? (
        <EmptyState
          icon={Globe}
          title="No sources configured"
          description="Add an intelligence source to start ingesting trade events."
          action={<Button size="sm" onClick={() => setDialogOpen(true)}>Add Source</Button>}
        />
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs text-slate-500">
                <th className="px-5 py-2.5 text-left font-medium">Name</th>
                <th className="px-4 py-2.5 text-left font-medium">Type / Category</th>
                <th className="px-4 py-2.5 text-left font-medium">Cadence</th>
                <th className="px-4 py-2.5 text-left font-medium">Last polled</th>
                <th className="px-4 py-2.5 text-left font-medium">Health</th>
                <th className="px-4 py-2.5 text-left font-medium">Articles</th>
                <th className="px-4 py-2.5 text-left font-medium">Priority</th>
                <th className="px-4 py-2.5 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((src) => (
                <tr key={src.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {src.is_active
                        ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        : <AlertCircle className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                      }
                      <div>
                        <p className="text-sm font-medium">{src.name}</p>
                        <a href={src.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline truncate block max-w-[180px]">
                          {src.url}
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {src.source_type && (
                        <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600 w-fit">
                          {src.source_type}
                        </span>
                      )}
                      {src.category && (
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold w-fit ${CATEGORY_COLORS[src.category] ?? 'bg-slate-100 text-slate-600'}`}>
                          {src.category}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">Every {src.poll_cadence_minutes}m</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {src.last_polled_at ? formatRelative(src.last_polled_at) : 'Never'}
                    {src.last_error && (
                      <p className="text-red-500 truncate max-w-[120px]" title={src.last_error}>
                        {src.last_error.slice(0, 40)}…
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${HEALTH_COLORS[src.health_status] ?? 'bg-slate-100 text-slate-500'}`}>
                      {src.health_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs tabular-nums text-slate-600">{src.articles_collected}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600">{src.priority}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline" size="sm" className="h-6 gap-1 text-xs px-2"
                        onClick={() => pollMutation.mutate(src.id)}
                        disabled={pollMutation.isPending}
                      >
                        <RefreshCw className="h-3 w-3" /> Poll
                      </Button>
                      <Button
                        variant="ghost" size="sm" className="h-6 w-6 p-0"
                        onClick={() => { setEditSource(src); setDialogOpen(true); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                        onClick={() => deactivateMutation.mutate(src.id)}
                        disabled={deactivateMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SourceDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditSource(null); }}
        initial={editSource ? {
          name: editSource.name,
          source_type: editSource.source_type ?? 'rss',
          category: editSource.category ?? 'trade_news',
          url: editSource.url,
          poll_cadence_minutes: editSource.poll_cadence_minutes,
          is_active: editSource.is_active,
          priority: editSource.priority,
        } : undefined}
        sourceId={editSource?.id}
      />
    </div>
  );
}
