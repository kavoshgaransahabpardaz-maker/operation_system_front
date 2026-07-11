import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload, Tag, Edit, Link as LinkIcon, ArrowLeftRight, Plus, RefreshCw, Mail,
  Scan, CheckCircle, PenLine, AlertTriangle, CheckCheck, GitCompare, Settings, Newspaper, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { workspaceApi, shipmentsApi, flagsApi, intelApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared/Spinner';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfidenceBadge } from '@/components/shared/ConfidenceBadge';
import { FileIcon } from '@/components/shared/FileIcon';
import { ReferenceChip } from '@/components/shared/ReferenceChip';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatRelative, shortId } from '@/lib/utils';
import { DOC_TYPE_LABELS, SHIPMENT_STATUS_LABELS, FIELD_NAME_LABELS } from '@/lib/constants';
import { FlagListPanel } from '@/features/flags/FlagListPanel';
import { ShipmentFieldsPanel } from '@/features/fields/ShipmentFieldsPanel';
import { IntelArticleCard } from '@/features/intel/components/IntelArticleCard';
import type { ShipmentStatus, ActivityAction } from '@/types';
import type { AxiosError } from 'axios';

const ACTION_META: Record<ActivityAction, { icon: typeof Upload; label: (d: Record<string, unknown>) => string }> = {
  document_uploaded: { icon: Upload, label: () => 'Document uploaded' },
  document_classified: {
    icon: Tag,
    label: (d) => `Document classified as ${DOC_TYPE_LABELS[d.doc_type as keyof typeof DOC_TYPE_LABELS] ?? d.doc_type}`,
  },
  classification_overridden: {
    icon: Edit,
    label: (d) => `Classification overridden to ${DOC_TYPE_LABELS[d.doc_type as keyof typeof DOC_TYPE_LABELS] ?? d.doc_type}`,
  },
  document_matched: { icon: LinkIcon, label: () => 'Document matched to shipment' },
  document_reassociated: { icon: ArrowLeftRight, label: () => 'Document reassociated' },
  shipment_created: { icon: Plus, label: () => 'Shipment created' },
  shipment_status_updated: {
    icon: RefreshCw,
    label: (d) => `Status changed to ${SHIPMENT_STATUS_LABELS[d.status as ShipmentStatus] ?? d.status}`,
  },
  email_synced: { icon: Mail, label: () => 'Email sync completed' },
  field_extracted: { icon: Scan, label: () => 'Fields extracted from document' },
  field_confirmed: {
    icon: CheckCircle,
    label: (d) => `Field ${FIELD_NAME_LABELS[d.field_name as keyof typeof FIELD_NAME_LABELS] ?? d.field_name} confirmed`,
  },
  field_corrected: {
    icon: PenLine,
    label: (d) => `Field ${FIELD_NAME_LABELS[d.field_name as keyof typeof FIELD_NAME_LABELS] ?? d.field_name} corrected`,
  },
  flag_created: {
    icon: AlertTriangle,
    label: (d) => `Issue detected: ${d.flag_title ?? 'unknown'}`,
  },
  flag_resolved: {
    icon: CheckCheck,
    label: (d) => `Issue resolved: ${d.flag_title ?? 'unknown'}`,
  },
  comparison_run: {
    icon: GitCompare,
    label: (d) => `Comparison run — ${d.issue_count ?? 0} issue(s) found`,
  },
  settings_updated: { icon: Settings, label: () => 'Org settings updated' },
};

export function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ShipmentStatus | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: detail, isLoading } = useQuery({
    queryKey: queryKeys.shipmentDetail(id!),
    queryFn: () => workspaceApi.shipmentDetail(id!).then((r) => r.data),
  });

  const { data: activity } = useQuery({
    queryKey: queryKeys.activityLog(id!),
    queryFn: () => workspaceApi.activityLog(id!).then((r) => r.data),
  });

  const { data: flags } = useQuery({
    queryKey: queryKeys.shipmentFlags(id!),
    queryFn: () => flagsApi.listByShipment(id!).then((r) => r.data),
  });

  const { data: intelItems } = useQuery({
    queryKey: queryKeys.shipmentIntel(id!),
    queryFn: () => intelApi.shipmentIntel(id!).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: () => shipmentsApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments });
      toast.success('Shipment deleted');
      navigate('/shipments');
    },
    onError: (e: AxiosError<{ detail?: string }>) => {
      toast.error(e.response?.data?.detail ?? 'Delete failed.');
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: ShipmentStatus) => shipmentsApi.updateStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipmentDetail(id!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments });
      toast.success('Status updated');
      setConfirmOpen(false);
    },
    onError: (e: AxiosError<{ detail?: string }>) => {
      toast.error(e.response?.data?.detail ?? 'Update failed.');
    },
  });

  if (isLoading) return <Spinner size="lg" className="mt-20" />;
  if (!detail) return <p className="mt-20 text-center text-muted-foreground">Shipment not found.</p>;

  const openFlags = flags?.filter((f) => f.status === 'open') ?? [];
  const sanctionFlags = openFlags.filter(
    (f) => f.severity === 'critical' && f.flag_type === 'mismatch' && f.title.toLowerCase().includes('sanction'),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold font-mono">{shortId(detail.id)}</h1>
        <StatusBadge status={detail.status} className="text-sm" />
        <Select
          value={detail.status}
          onValueChange={(v) => { setPendingStatus(v as ShipmentStatus); setConfirmOpen(true); }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(['active', 'complete', 'on_hold'] as ShipmentStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {SHIPMENT_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto text-muted-foreground hover:text-destructive"
          onClick={() => setDeleteOpen(true)}
          title="Delete shipment"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete shipment?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will delete shipment <strong>{shortId(detail.id)}</strong>. All linked documents will be kept but unlinked. Flags, intel matches, and references will be removed. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete shipment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sanctions banner — shown before the general flags banner */}
      {sanctionFlags.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border-2 border-red-500 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-800">Sanctions Alert</p>
            <ul className="mt-1 space-y-0.5">
              {sanctionFlags.map((f) => (
                <li key={f.id} className="text-xs text-red-700">{f.title}</li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-red-600">
              Sanctions flags must be reviewed. Do not dismiss without explicit compliance approval.
            </p>
          </div>
          <a href="#flags-panel" className="shrink-0 text-xs text-red-700 underline hover:no-underline">
            Review
          </a>
        </div>
      )}

      {/* Open flags banner */}
      {openFlags.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-800 font-medium">
            {openFlags.length} open issue{openFlags.length !== 1 ? 's' : ''} — review required
          </p>
          <a
            href="#flags-panel"
            className="ml-auto text-sm text-red-700 underline hover:no-underline"
          >
            Review
          </a>
        </div>
      )}

      {/* References */}
      <div className="flex flex-wrap gap-2">
        {detail.references.map((ref) => (
          <ReferenceChip key={`${ref.ref_type}:${ref.ref_value}`} ref_type={ref.ref_type} ref_value={ref.ref_value} />
        ))}
      </div>

      {/* Documents table */}
      <div className="rounded-xl border bg-background">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold">Documents ({detail.documents.length})</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detail.documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>
                  <Link
                    to={`/documents/${doc.id}`}
                    className="flex items-center gap-2 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FileIcon contentType={doc.content_type} className="text-muted-foreground" />
                    <span className="max-w-[200px] truncate">{doc.filename}</span>
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {doc.doc_type ? DOC_TYPE_LABELS[doc.doc_type] : '—'}
                </TableCell>
                <TableCell>
                  <StatusBadge status={doc.status} />
                </TableCell>
                <TableCell>
                  {doc.confidence != null ? (
                    <ConfidenceBadge confidence={doc.confidence} />
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-xs capitalize">
                    {doc.source}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatRelative(doc.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Flags panel */}
      <FlagListPanel shipmentId={id!} />

      {/* Extracted fields panel */}
      <ShipmentFieldsPanel shipmentId={id!} />

      {/* Shipment Intel panel — always shown */}
      <div className="rounded-xl border bg-background">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-blue-500" />
            <h2 className="font-semibold">Related Trade Events</h2>
            {intelItems && intelItems.length > 0 && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                {intelItems.length}
              </span>
            )}
          </div>
          <button
            onClick={() => navigate('/intel')}
            className="text-xs text-blue-600 hover:underline"
          >
            View all
          </button>
        </div>
        <div className="p-4 space-y-3">
          {!intelItems || intelItems.length === 0 ? (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
              No trade events matched to this shipment yet. The system checks for matches when new articles are ingested.
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Events matched to this shipment. Impact scores are model estimates — not verified compliance flags.
              </p>
              {intelItems.slice(0, 3).map((item) => (
                <IntelArticleCard
                  key={item.article.id}
                  item={item}
                  onClick={() => navigate(`/intel/articles/${item.article.id}`)}
                />
              ))}
              {intelItems.length > 3 && (
                <button
                  onClick={() => navigate('/intel')}
                  className="text-xs text-blue-600 hover:underline"
                >
                  +{intelItems.length - 3} more events
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Activity log */}
      <div className="rounded-xl border bg-background p-6">
        <h2 className="mb-4 font-semibold">Activity Log</h2>
        {!activity?.length ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ol className="space-y-4">
            {activity.map((entry) => {
              const meta = ACTION_META[entry.action];
              const Icon = meta?.icon ?? RefreshCw;
              const label = meta?.label(entry.details ?? {}) ?? entry.action;
              return (
                <li key={entry.id} className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">{formatRelative(entry.created_at)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Confirm status change dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change shipment status?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Change status to{' '}
            <strong>{pendingStatus ? SHIPMENT_STATUS_LABELS[pendingStatus] : ''}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => pendingStatus && statusMutation.mutate(pendingStatus)}
              disabled={statusMutation.isPending}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
