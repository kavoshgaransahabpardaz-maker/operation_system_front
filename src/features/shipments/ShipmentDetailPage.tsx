import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload, Tag, Edit, Link as LinkIcon, ArrowLeftRight, Plus, RefreshCw, Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import { workspaceApi, shipmentsApi } from '@/api';
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
import { DOC_TYPE_LABELS, SHIPMENT_STATUS_LABELS } from '@/lib/constants';
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
};

export function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ShipmentStatus | null>(null);

  const { data: detail, isLoading } = useQuery({
    queryKey: queryKeys.shipmentDetail(id!),
    queryFn: () => workspaceApi.shipmentDetail(id!).then((r) => r.data),
  });

  const { data: activity } = useQuery({
    queryKey: queryKeys.activityLog(id!),
    queryFn: () => workspaceApi.activityLog(id!).then((r) => r.data),
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
      </div>

      {/* References */}
      <div className="flex flex-wrap gap-2">
        {detail.references.map((ref) => (
          <ReferenceChip key={ref.id} ref_type={ref.ref_type} ref_value={ref.ref_value} />
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
