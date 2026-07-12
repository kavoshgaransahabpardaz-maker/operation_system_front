import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Ship, FileInput, Tag, AlertCircle, Mail, Upload, ArrowRight, Clock, Paperclip,
  AlertTriangle, AlertOctagon, ScanSearch, Newspaper,
} from 'lucide-react';
import { workspaceApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatRelative, cn } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useUpload } from '@/hooks/useUpload';
import { ACCEPTED_FILE_TYPES, MAX_FILE_BYTES } from '@/lib/constants';

interface StatCardProps {
  label: string;
  value: number;
  icon: typeof Ship;
  accent?: 'amber' | 'blue' | 'green' | 'red' | 'default';
  onClick?: () => void;
}

function StatCard({ label, value, icon: Icon, accent = 'default', onClick }: StatCardProps) {
  const styles = {
    default: { wrap: 'bg-white',                       icon: 'bg-slate-100 text-slate-600',     num: 'text-slate-900' },
    blue:    { wrap: 'bg-white',                       icon: 'bg-blue-50 text-blue-600',        num: 'text-slate-900' },
    green:   { wrap: 'bg-white',                       icon: 'bg-emerald-50 text-emerald-600',  num: 'text-slate-900' },
    amber:   { wrap: 'bg-amber-50 border-amber-200',   icon: 'bg-amber-100 text-amber-700',     num: 'text-amber-900' },
    red:     { wrap: 'bg-red-50 border-red-200',       icon: 'bg-red-100 text-red-600',         num: 'text-red-900' },
  };
  const s = styles[accent];

  return (
    <div
      className={cn(
        'rounded-xl border p-5 shadow-sm',
        s.wrap,
        onClick && 'cursor-pointer hover:shadow-md transition-shadow',
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className={cn('mt-2 text-3xl font-bold tabular-nums', s.num)}>{value}</p>
        </div>
        <div className={cn('rounded-lg p-2.5', s.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => workspaceApi.dashboard().then((r) => r.data),
    refetchInterval: 30_000,
  });
  const navigate = useNavigate();
  const [uploadOpen, setUploadOpen] = useState(false);
  const { upload, uploading } = useUpload(() => setUploadOpen(false));
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  if (isLoading) return <Spinner size="lg" className="mt-20" />;

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    await upload(files[0]);
  }

  const needsReview     = data?.shipments_requiring_review ?? 0;
  const criticalFlags   = data?.open_flags_critical ?? 0;
  const pendingReviews  = data?.pending_field_reviews ?? 0;
  const attentionQueue  = data?.attention_queue ?? [];

  return (
    <div className="space-y-6">
      {/* Stat cards — 3 rows on small, 6-col on xl */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        <StatCard
          label="Total Shipments"
          value={data?.total_shipments ?? 0}
          icon={Ship}
          accent="blue"
          onClick={() => navigate('/workspace?tab=shipments')}
        />
        <StatCard
          label="Imported Today"
          value={data?.documents_imported_today ?? 0}
          icon={FileInput}
          accent="green"
          onClick={() => navigate('/workspace?tab=documents')}
        />
        <StatCard
          label="Needs Classification"
          value={data?.unclassified_documents ?? 0}
          icon={Tag}
          onClick={() => navigate('/workspace?tab=documents')}
        />
        <StatCard
          label="Needs Review"
          value={needsReview}
          icon={AlertCircle}
          accent={needsReview > 0 ? 'amber' : 'default'}
          onClick={() => navigate('/workspace?tab=shipments')}
        />
        <StatCard
          label="Critical Issues"
          value={criticalFlags}
          icon={AlertOctagon}
          accent={criticalFlags > 0 ? 'red' : 'default'}
          onClick={() => navigate('/workspace?tab=shipments')}
        />
        <StatCard
          label="Fields to Review"
          value={pendingReviews}
          icon={ScanSearch}
          accent={pendingReviews > 0 ? 'amber' : 'default'}
          onClick={() => navigate('/workspace?tab=shipments')}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: email imports + attention queue */}
        <div className="lg:col-span-3 space-y-6">
          {/* Recent email imports */}
          <div className="rounded-xl border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b px-5 py-3.5">
              <h3 className="text-sm font-semibold">Recent Email Imports</h3>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => navigate('/workspace?tab=email')}>
                Manage <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="px-5 py-3">
              {!data?.recent_email_imports?.length ? (
                <EmptyState
                  icon={Mail}
                  title="No email imports yet"
                  description="Connect a mailbox to start importing attachments automatically."
                  action={
                    <Button size="sm" variant="outline" onClick={() => navigate('/workspace?tab=email')}>
                      Connect mailbox
                    </Button>
                  }
                />
              ) : (
                <div className="divide-y">
                  {data.recent_email_imports.map((imp) => (
                    <div key={imp.id} className="flex items-center gap-3 py-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50">
                        <Mail className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{imp.subject ?? '(no subject)'}</p>
                        <p className="truncate text-xs text-muted-foreground">{imp.sender}</p>
                      </div>
                      <div className="shrink-0 space-y-1 text-right">
                        <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                          {imp.provider}
                        </span>
                        <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {imp.received_at ? formatRelative(imp.received_at) : '—'}
                        </div>
                        <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                          <Paperclip className="h-3 w-3" />
                          {imp.attachment_count}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Attention queue */}
          {attentionQueue.length > 0 && (
            <div className="rounded-xl border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <h3 className="text-sm font-semibold">Shipments needing attention</h3>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    {attentionQueue.length}
                  </span>
                </div>
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => navigate('/workspace?tab=shipments')}>
                  All shipments <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
              <div className="divide-y">
                {attentionQueue.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-slate-50 transition-colors"
                    onClick={() => navigate(`/shipments/${item.id}`)}
                  >
                    <span className="font-mono text-sm font-semibold text-slate-900">{item.short_id}</span>
                    <span className="flex-1" />
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      <AlertTriangle className="h-3 w-3" />
                      {item.flag_count} issue{item.flag_count !== 1 ? 's' : ''}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: quick actions + intel teaser */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border bg-white shadow-sm p-5">
            <h3 className="mb-4 text-sm font-semibold">Quick Actions</h3>
            <div className="space-y-2">
              <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full justify-start gap-2">
                    <Upload className="h-4 w-4" /> Upload Document
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                  </DialogHeader>
                  <div
                    className={cn(
                      'flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-10 transition-colors',
                      dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                    )}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Drop your file here</p>
                      <p className="text-xs text-muted-foreground">
                        PDF or image — max {MAX_FILE_BYTES / 1024 / 1024} MB
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                      {uploading ? 'Uploading…' : 'Choose file'}
                    </Button>
                    <input ref={fileRef} type="file" accept={ACCEPTED_FILE_TYPES} className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate('/workspace')}>
                <FileInput className="h-4 w-4" /> View Workspace
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate('/tradewatch')}>
                <Newspaper className="h-4 w-4" /> TradeWatch
              </Button>
            </div>
          </div>

          {needsReview > 0 && (
            <button
              type="button"
              className="flex w-full items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left hover:bg-amber-100 transition-colors"
              onClick={() => navigate('/workspace?tab=shipments')}
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-900">
                  {needsReview} shipment{needsReview !== 1 ? 's' : ''} need review
                </p>
                <p className="mt-0.5 text-xs text-amber-700">Open issues require your attention</p>
              </div>
              <ArrowRight className="mt-0.5 ml-auto h-4 w-4 shrink-0 text-amber-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
