import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Files, Upload, CloudUpload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { documentsApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { FileIcon } from '@/components/shared/FileIcon';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUpload } from '@/hooks/useUpload';
import { formatBytes, formatRelative, shortId, cn } from '@/lib/utils';
import { ACCEPTED_FILE_TYPES, ACCEPTED_FILE_LABEL, DOC_TYPE_LABELS, MAX_BATCH_FILES } from '@/lib/constants';
import type { DocumentStatus } from '@/types';

const STATUS_FILTERS: { label: string; value: DocumentStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Needs Review', value: 'needs_review' },
  { label: 'Unmatched', value: 'unmatched' },
  { label: 'Classified', value: 'classified' },
];

export function DocumentListPage({ shipmentId }: { shipmentId?: string } = {}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<DocumentStatus | 'all'>('all');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; filename: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, uploadProgress } = useUpload(() => setUploadOpen(false));

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document deleted');
      setPendingDelete(null);
    },
    onError: () => {
      toast.error('Delete failed.');
    },
  });

  const { data: docs, isLoading } = useQuery({
    queryKey: queryKeys.documents(shipmentId ? { shipment_id: shipmentId } : undefined),
    queryFn: () => documentsApi.list(shipmentId).then((r) => r.data),
  });

  const filtered = docs?.filter((d) => filter === 'all' || d.status === filter) ?? [];

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    await upload(files);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {docs ? `${docs.length} document${docs.length !== 1 ? 's' : ''}` : ''}
        </p>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="h-4 w-4" /> Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <div
              className={cn(
                'flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 transition-colors cursor-pointer',
                dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-muted-foreground/40'
              )}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => fileRef.current?.click()}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <CloudUpload className="h-7 w-7 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">Drop files here or click to browse</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {ACCEPTED_FILE_LABEL} — up to {MAX_BATCH_FILES} files, 1 GB each
                </p>
              </div>
              {uploading && (
                <div className="flex flex-col items-center gap-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" />
                    {uploadProgress.total > 1
                      ? `Uploading ${uploadProgress.total} files…`
                      : 'Uploading…'}
                  </div>
                </div>
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
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-4 py-3">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as DocumentStatus | 'all')}>
            <TabsList className="h-8">
              {STATUS_FILTERS.map((f) => (
                <TabsTrigger key={f.value} value={f.value} className="text-xs">
                  {f.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <Spinner size="lg" className="py-20" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Files}
            title="No documents yet"
            description="Upload your first document to get started."
            action={
              <Button onClick={() => setUploadOpen(true)} className="gap-2">
                <Upload className="h-4 w-4" /> Upload Document
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">File</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="pr-5">Shipment</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((doc) => (
                <TableRow
                  key={doc.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => navigate(`/documents/${doc.id}`)}
                >
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                        <FileIcon contentType={doc.content_type} className="h-4 w-4 text-slate-600" />
                      </div>
                      <span className="max-w-[240px] truncate text-sm font-medium">{doc.filename}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {doc.doc_type ? DOC_TYPE_LABELS[doc.doc_type] : <span className="text-slate-300">—</span>}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={doc.status} />
                  </TableCell>
                  <TableCell>
                    <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-600">
                      {doc.source}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatBytes(doc.size_bytes)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatRelative(doc.created_at)}
                  </TableCell>
                  <TableCell className="pr-5 font-mono text-xs text-muted-foreground">
                    {doc.shipment_id ? shortId(doc.shipment_id) : <span className="text-slate-300">—</span>}
                  </TableCell>
                  <TableCell className="pr-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => setPendingDelete({ id: doc.id, filename: doc.filename })}
                      title="Delete document"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={!!pendingDelete} onOpenChange={(o) => { if (!o) setPendingDelete(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete document?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete <strong>{pendingDelete?.filename}</strong> and all extracted data — fields, classification, and OCR results. The file will be removed from storage. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
