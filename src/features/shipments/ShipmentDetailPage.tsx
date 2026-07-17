import { useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload, Tag, Edit, Link as LinkIcon, ArrowLeftRight, Plus, RefreshCw, Mail,
  Scan, CheckCircle, PenLine, AlertTriangle, CheckCheck, GitCompare, Settings,
  Newspaper, Trash2, CloudUpload, Database,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { workspaceApi, shipmentsApi, flagsApi, intelApi, fieldsApi, classificationsApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared/Spinner';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { FileIcon } from '@/components/shared/FileIcon';
import { ReferenceChip } from '@/components/shared/ReferenceChip';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { formatRelative, shortId } from '@/lib/utils';
import {
  DOC_TYPE_LABELS, SHIPMENT_STATUS_LABELS, FIELD_NAME_LABELS,
  ACCEPTED_FILE_TYPES, ACCEPTED_FILE_LABEL, MAX_BATCH_FILES,
} from '@/lib/constants';
import { FlagListPanel } from '@/features/flags/FlagListPanel';
import { ShipmentSummaryCards } from '@/features/fields/ShipmentSummaryCards';
import { ShipmentProductsPanel } from '@/features/fields/ShipmentProductsPanel';
import { IntelArticleCard } from '@/features/intel/components/IntelArticleCard';
import { useUpload } from '@/hooks/useUpload';
import type { ShipmentStatus, ActivityAction, DocumentType, DocumentSummary } from '@/types';
import type { AxiosError } from 'axios';

const PROCESSING_STATUSES = new Set(['uploaded', 'ocr_pending', 'ocr_processing']);

const DOC_TYPE_PICKER_ORDER: DocumentType[] = [
  'commercial_invoice',
  'packing_list',
  'bill_of_lading',
  'certificate_of_origin',
  'bill_of_material',
  'product_specification',
  'customs_declaration',
  'other',
];

const ACTION_META: Record<
  ActivityAction,
  { icon: typeof Upload; label: (d: Record<string, unknown>) => string }
> = {
  document_uploaded: { icon: Upload, label: () => 'Document uploaded' },
  document_classified: {
    icon: Tag,
    label: (d) =>
      `Classified as ${DOC_TYPE_LABELS[d.doc_type as keyof typeof DOC_TYPE_LABELS] ?? d.doc_type}`,
  },
  classification_overridden: {
    icon: Edit,
    label: (d) =>
      `Type overridden to ${DOC_TYPE_LABELS[d.doc_type as keyof typeof DOC_TYPE_LABELS] ?? d.doc_type}`,
  },
  document_matched: { icon: LinkIcon, label: () => 'Document matched to shipment' },
  document_reassociated: { icon: ArrowLeftRight, label: () => 'Document reassociated' },
  shipment_created: { icon: Plus, label: () => 'Shipment created' },
  shipment_status_updated: {
    icon: RefreshCw,
    label: (d) =>
      `Status changed to ${SHIPMENT_STATUS_LABELS[d.status as ShipmentStatus] ?? d.status}`,
  },
  email_synced: { icon: Mail, label: () => 'Email sync completed' },
  field_extracted: { icon: Scan, label: () => 'Fields extracted from document' },
  field_confirmed: {
    icon: CheckCircle,
    label: (d) =>
      `Field ${FIELD_NAME_LABELS[d.field_name as keyof typeof FIELD_NAME_LABELS] ?? d.field_name} confirmed`,
  },
  field_corrected: {
    icon: PenLine,
    label: (d) =>
      `Field ${FIELD_NAME_LABELS[d.field_name as keyof typeof FIELD_NAME_LABELS] ?? d.field_name} corrected`,
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

function DocCard({
  doc,
  shipmentId,
}: {
  doc: DocumentSummary;
  shipmentId: string;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const needsPicker =
    doc.doc_type === null ||
    doc.status === 'needs_review' ||
    (doc.doc_type_confidence != null && doc.doc_type_confidence < 0.7);
  const isProcessing = PROCESSING_STATUSES.has(doc.status);

  const overrideMutation = useMutation({
    mutationFn: (dt: DocumentType) => classificationsApi.override(doc.id, dt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipmentDetail(shipmentId) });
      toast.success('Document type set');
    },
    onError: () => toast.error('Could not set document type.'),
  });

  let statusEl: React.ReactNode;
  if (doc.status === 'ocr_failed') {
    statusEl = (
      <span className="font-mono text-[9.5px] text-red-600 font-semibold">OCR FAILED</span>
    );
  } else if (isProcessing) {
    statusEl = (
      <span className="font-mono text-[9.5px] text-blue-600 animate-pulse">EXTRACTING…</span>
    );
  } else if (needsPicker) {
    const conf =
      doc.doc_type_confidence != null
        ? ` ${Math.round(doc.doc_type_confidence * 100)}%`
        : '';
    statusEl = (
      <span className="font-mono text-[9.5px] text-amber-700 font-semibold">
        DETECTED{conf} — CONFIRM TYPE
      </span>
    );
  } else {
    const fieldInfo =
      doc.field_count > 0
        ? `${doc.confirmed_field_count}/${doc.field_count} CONFIRMED`
        : `${doc.field_count} FIELDS`;
    statusEl = (
      <span className="font-mono text-[9.5px] text-green-700">EXTRACTED · {fieldInfo}</span>
    );
  }

  return (
    <div className="border border-border rounded-xl p-3.5 flex flex-col gap-2.5 bg-background min-w-0">
      <button
        type="button"
        className="text-left text-[12px] font-semibold truncate hover:text-primary transition-colors flex items-center gap-1.5"
        onClick={() => navigate(`/documents/${doc.id}`)}
        title={doc.filename}
      >
        <FileIcon contentType={doc.content_type ?? ''} className="shrink-0 text-muted-foreground" />
        <span className="truncate">{doc.filename}</span>
      </button>

      <Select
        value={doc.doc_type ?? ''}
        onValueChange={(v) => overrideMutation.mutate(v as DocumentType)}
        disabled={overrideMutation.isPending}
      >
        <SelectTrigger
          className={`h-7 text-xs ${
            needsPicker
              ? 'border-amber-400 bg-amber-50 text-amber-900'
              : 'bg-muted/30'
          }`}
        >
          <SelectValue placeholder="Select type…" />
        </SelectTrigger>
        <SelectContent>
          {DOC_TYPE_PICKER_ORDER.map((dt) => (
            <SelectItem key={dt} value={dt} className="text-xs">
              {DOC_TYPE_LABELS[dt]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {statusEl}
    </div>
  );
}

function DocStripUploadSlot({ shipmentId }: { shipmentId: string }) {
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { upload, uploading } = useUpload(undefined, { shipmentId });

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    await upload(files);
  }

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-xl p-3.5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors min-h-[116px] min-w-0',
        dragOver
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-muted-foreground/40',
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => fileRef.current?.click()}
    >
      {uploading ? (
        <Spinner size="sm" />
      ) : (
        <>
          <CloudUpload className="h-5 w-5 text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground text-center leading-tight">
            Drop or click
            <br />
            to add document
          </p>
        </>
      )}
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

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
    refetchInterval: (query) => {
      const docs = query.state.data?.documents ?? [];
      return docs.some((d) => PROCESSING_STATUSES.has(d.status)) ? 5_000 : false;
    },
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

  const docCount = detail?.documents.length ?? 0;

  const { data: mismatches } = useQuery({
    queryKey: queryKeys.shipmentMismatches(id!),
    queryFn: () => fieldsApi.getMismatches(id!).then((r) => r.data),
    enabled: docCount >= 2,
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

  const confirmAllMutation = useMutation({
    mutationFn: () => fieldsApi.confirmAll(id!),
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipmentFields(id!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.shipmentDetail(id!) });
      toast.success(
        data.confirmed > 0
          ? `${data.confirmed} field${data.confirmed !== 1 ? 's' : ''} confirmed`
          : 'All fields already confirmed',
      );
    },
    onError: () => toast.error('Confirm all failed.'),
  });

  if (isLoading) return <Spinner size="lg" className="mt-20" />;
  if (!detail) return <p className="mt-20 text-center text-muted-foreground">Shipment not found.</p>;

  const openFlags = flags?.filter((f) => f.status === 'open') ?? [];
  const sanctionFlags = openFlags.filter(
    (f) =>
      f.severity === 'critical' &&
      f.flag_type === 'mismatch' &&
      f.title.toLowerCase().includes('sanction'),
  );

  const totalFields = detail.documents.reduce((s, d) => s + d.field_count, 0);
  const confirmedFields = detail.documents.reduce((s, d) => s + d.confirmed_field_count, 0);
  const progressPct = totalFields > 0 ? Math.round((confirmedFields / totalFields) * 100) : 0;
  const needsInput = totalFields - confirmedFields;
  const allConfirmed = totalFields > 0 && confirmedFields === totalFields;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 mb-2">
            <Link to="/shipments" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← Workspace
            </Link>
            <span className="text-muted-foreground/40 text-xs">/</span>
            <h1 className="text-base font-bold font-mono">{shortId(detail.id)}</h1>
            <StatusBadge status={detail.status} />
            {needsInput > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-semibold text-amber-800">
                {needsInput} field{needsInput !== 1 ? 's' : ''} to review
              </span>
            )}
          </div>
          {totalFields > 0 && (
            <div className="flex items-center gap-2.5 max-w-xs">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    allConfirmed ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="font-mono text-[10px] text-muted-foreground tabular-nums shrink-0">
                {progressPct}%
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Select
            value={detail.status}
            onValueChange={(v) => {
              setPendingStatus(v as ShipmentStatus);
              setConfirmOpen(true);
            }}
          >
            <SelectTrigger className="h-8 text-xs w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(['active', 'complete', 'on_hold'] as ShipmentStatus[]).map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {SHIPMENT_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            className="gap-1.5 h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white"
            onClick={() => confirmAllMutation.mutate()}
            disabled={confirmAllMutation.isPending || allConfirmed}
          >
            <Database className="h-3.5 w-3.5" />
            {confirmAllMutation.isPending
              ? 'Confirming…'
              : allConfirmed
              ? 'All confirmed'
              : 'Confirm all fields'}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
            title="Delete shipment"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sanctions banner */}
      {sanctionFlags.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border-2 border-red-500 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-800">Sanctions Alert</p>
            <ul className="mt-1 space-y-0.5">
              {sanctionFlags.map((f) => (
                <li key={f.id} className="text-xs text-red-700">
                  {f.title}
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-red-600">
              Do not dismiss without explicit compliance approval.
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
      {detail.references.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {detail.references.map((ref) => (
            <ReferenceChip
              key={`${ref.ref_type}:${ref.ref_value}`}
              ref_type={ref.ref_type}
              ref_value={ref.ref_value}
            />
          ))}
        </div>
      )}

      {/* Document strip */}
      <div className="flex flex-col gap-3">
        <p className="font-mono text-[10.5px] tracking-widest font-bold text-muted-foreground">
          DOCUMENTS
        </p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
          {detail.documents.map((doc) => (
            <DocCard key={doc.id} doc={doc} shipmentId={id!} />
          ))}
          <DocStripUploadSlot shipmentId={id!} />
        </div>
        <p className="text-[11px] text-muted-foreground">
          {ACCEPTED_FILE_LABEL} · up to {MAX_BATCH_FILES} files, 1 GB each
        </p>
      </div>

      {/* Extracted data — 3 summary cards with inline conflict highlights */}
      <div className="flex flex-col gap-4">
        <p className="font-mono text-[10.5px] tracking-widest font-bold text-muted-foreground">
          EXTRACTED DATA
        </p>
        <ShipmentSummaryCards
          shipmentId={id!}
          documents={detail.documents}
          mismatches={mismatches}
        />
      </div>

      {/* Products — with inline mismatch highlights when ≥ 2 docs */}
      <ShipmentProductsPanel
        shipmentId={id!}
        documents={detail.documents}
        mismatches={docCount >= 2 ? mismatches : undefined}
      />

      {/* Flags panel */}
      <div id="flags-panel">
        <FlagListPanel shipmentId={id!} />
      </div>

      {/* Trade intel */}
      <div className="rounded-xl border bg-background">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-blue-500" />
            <h2 className="font-semibold text-sm">Related Trade Events</h2>
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
              No trade events matched yet. The system checks for matches when new articles are
              ingested.
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Impact scores are model estimates — not verified compliance flags.
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
        <h2 className="mb-4 font-semibold text-sm">Activity Log</h2>
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
                    <p className="text-xs text-muted-foreground">
                      {formatRelative(entry.created_at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete shipment?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will delete shipment <strong>{shortId(detail.id)}</strong>. All linked documents
            will be kept but unlinked. Flags, intel matches, and references will be removed. This
            cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
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

      {/* Confirm status dialog */}
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
