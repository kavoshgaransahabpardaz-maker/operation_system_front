import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { documentsApi, classificationsApi, shipmentsApi, fieldsApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared/Spinner';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { FileIcon } from '@/components/shared/FileIcon';
import { ConfidenceBadge } from '@/components/shared/ConfidenceBadge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { formatBytes, formatDate, shortId } from '@/lib/utils';
import { DOC_TYPE_LABELS } from '@/lib/constants';
import { DocumentFieldsPanel } from '@/features/fields/DocumentFieldsPanel';
import type { DocumentType } from '@/types';
import type { AxiosError } from 'axios';

const DOC_TYPES = Object.entries(DOC_TYPE_LABELS) as [DocumentType, string][];

const PROCESSING_STATUSES = new Set(['ocr_pending', 'ocr_processing']);

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType>('commercial_invoice');
  const [reassignShipment, setReassignShipment] = useState('');

  const { data: doc, isLoading: docLoading } = useQuery({
    queryKey: queryKeys.document(id!),
    queryFn: () => documentsApi.get(id!).then((r) => r.data),
    refetchInterval: (query) =>
      query.state.data?.status && PROCESSING_STATUSES.has(query.state.data.status) ? 10_000 : false,
  });

  const { data: classification, isLoading: classLoading } = useQuery({
    queryKey: queryKeys.classification(id!),
    queryFn: () =>
      classificationsApi.get(id!).then((r) => r.data).catch((e: AxiosError) => {
        if (e.response?.status === 404) return null;
        throw e;
      }),
  });

  const { data: duplicates } = useQuery({
    queryKey: queryKeys.duplicates(id!),
    queryFn: () => documentsApi.duplicates(id!).then((r) => r.data),
  });

  const { data: shipments } = useQuery({
    queryKey: queryKeys.shipments,
    queryFn: () => shipmentsApi.list().then((r) => r.data),
  });

  const { data: fields } = useQuery({
    queryKey: queryKeys.documentFields(id!),
    queryFn: () => fieldsApi.listByDocument(id!).then((r) => r.data),
  });

  const hasLowConfidenceFields = fields?.some((f) => f.confidence < 0.7) ?? false;

  const overrideMutation = useMutation({
    mutationFn: (doc_type: DocumentType) => classificationsApi.override(id!, doc_type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classification(id!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.document(id!) });
      toast.success('Classification updated');
      setOverrideOpen(false);
    },
    onError: (e: AxiosError<{ detail?: string }>) => {
      toast.error(e.response?.data?.detail ?? 'Override failed.');
    },
  });

  const reassociateMutation = useMutation({
    mutationFn: (shipmentId: string) => shipmentsApi.reassociateDocument(id!, shipmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.document(id!) });
      toast.success('Document reassociated');
    },
    onError: (e: AxiosError<{ detail?: string }>) => {
      toast.error(e.response?.data?.detail ?? 'Reassociation failed.');
    },
  });

  if (docLoading || classLoading) return <Spinner size="lg" className="mt-20" />;
  if (!doc) return <p className="mt-20 text-center text-muted-foreground">Document not found.</p>;

  const isProcessing = PROCESSING_STATUSES.has(doc.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileIcon contentType={doc.content_type} className="h-6 w-6" />
        <h1 className="text-xl font-bold">{doc.filename}</h1>
        <StatusBadge status={doc.status} />
      </div>

      {/* Duplicate warning */}
      {duplicates && duplicates.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium text-amber-800">Duplicate files detected</p>
            <ul className="mt-1 space-y-0.5">
              {duplicates.map((d) => (
                <li key={d.id}>
                  <Link to={`/documents/${d.id}`} className="text-sm text-primary hover:underline">
                    {d.filename}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: document info */}
        <div className="space-y-4 rounded-xl border bg-background p-6">
          <h2 className="font-semibold">Document Info</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Size</dt>
              <dd>{formatBytes(doc.size_bytes)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Type</dt>
              <dd>{doc.content_type}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Source</dt>
              <dd className="capitalize">{doc.source}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Uploaded</dt>
              <dd>{formatDate(doc.created_at)}</dd>
            </div>
            {doc.shipment_id && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipment</dt>
                <dd>
                  <Link
                    to={`/shipments/${doc.shipment_id}`}
                    className="font-mono text-primary hover:underline"
                  >
                    {shortId(doc.shipment_id)}
                  </Link>
                </dd>
              </div>
            )}
          </dl>

          {doc.download_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={doc.download_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> Download
              </a>
            </Button>
          )}

          {/* Processing stepper */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Processing status</p>
            <ol className="flex gap-1 text-xs">
              {['uploaded', 'ocr_pending', 'ocr_processing', 'classified', 'fields_extracted', 'matched'].map((s) => (
                <li
                  key={s}
                  className={`relative flex-1 rounded px-1 py-0.5 text-center capitalize ${
                    doc.status === s
                      ? 'bg-primary text-primary-foreground'
                      : doc.status === 'ocr_failed' && s === 'ocr_processing'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {s.replace(/_/g, ' ')}
                  {s === 'fields_extracted' && hasLowConfidenceFields && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" title="Low-confidence fields detected" />
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Right: classification */}
        <div className="space-y-4 rounded-xl border bg-background p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Classification</h2>
            <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Override Classification
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Override Classification</DialogTitle>
                </DialogHeader>
                <Select
                  value={selectedType}
                  onValueChange={(v) => setSelectedType(v as DocumentType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DialogFooter>
                  <Button
                    onClick={() => overrideMutation.mutate(selectedType)}
                    disabled={overrideMutation.isPending}
                  >
                    Save Override
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {classification ? (
            <div className="space-y-3">
              <p className="text-lg font-semibold">
                {DOC_TYPE_LABELS[classification.doc_type]}
              </p>
              <ConfidenceBadge confidence={classification.confidence} />
              {classification.is_manual_override && (
                <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                  Manual override
                </span>
              )}
            </div>
          ) : isProcessing ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner size="sm" />
              Processing…
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Not yet classified.</p>
          )}
        </div>
      </div>

      {/* Extracted fields */}
      <DocumentFieldsPanel documentId={id!} documentStatus={doc.status} />

      {/* Reassociate to shipment */}
      <div className="rounded-xl border bg-background p-6">
        <h2 className="mb-4 font-semibold">Reassociate to Shipment</h2>
        <div className="flex items-center gap-3">
          <Select value={reassignShipment} onValueChange={setReassignShipment}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select shipment…" />
            </SelectTrigger>
            <SelectContent>
              {shipments?.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {shortId(s.id)}{' '}
                  {s.references[0] ? `— ${s.references[0].ref_value}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => reassociateMutation.mutate(reassignShipment)}
            disabled={!reassignShipment || reassociateMutation.isPending}
          >
            Reassociate
          </Button>
        </div>
      </div>
    </div>
  );
}
