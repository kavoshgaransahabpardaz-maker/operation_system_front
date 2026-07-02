import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Files, Upload } from 'lucide-react';
import { documentsApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { FileIcon } from '@/components/shared/FileIcon';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUpload } from '@/hooks/useUpload';
import { formatBytes, formatRelative, shortId } from '@/lib/utils';
import { ACCEPTED_FILE_TYPES, MAX_FILE_BYTES } from '@/lib/constants';
import type { DocumentStatus } from '@/types';

const STATUS_FILTERS: { label: string; value: DocumentStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Needs Review', value: 'needs_review' },
  { label: 'Unmatched', value: 'unmatched' },
  { label: 'Classified', value: 'classified' },
];

export function DocumentListPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<DocumentStatus | 'all'>('all');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { upload, uploading } = useUpload(() => setUploadOpen(false));

  const { data: docs, isLoading } = useQuery({
    queryKey: queryKeys.documents(),
    queryFn: () => documentsApi.list().then((r) => r.data),
  });

  const filtered = docs?.filter((d) => filter === 'all' || d.status === filter) ?? [];

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    await upload(files[0]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Documents</h1>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" /> Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <div
              className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Drag & drop here, or</p>
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? 'Uploading…' : 'Choose file'}
              </Button>
              <p className="text-xs text-muted-foreground">
                PDF, images — max {MAX_FILE_BYTES / 1024 / 1024} MB
              </p>
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as DocumentStatus | 'all')}>
        <TabsList>
          {STATUS_FILTERS.map((f) => (
            <TabsTrigger key={f.value} value={f.value}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <Spinner size="lg" className="mt-20" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Files}
          title="No documents yet"
          description="Upload your first document."
          action={
            <Button onClick={() => setUploadOpen(true)}>
              <Upload className="mr-2 h-4 w-4" /> Upload Document
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Shipment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((doc) => (
                <TableRow
                  key={doc.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/documents/${doc.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileIcon contentType={doc.content_type} className="text-muted-foreground" />
                      <span className="max-w-[200px] truncate font-medium">{doc.filename}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {/* doc list doesn't have doc_type — placeholder */}—
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={doc.status} />
                  </TableCell>
                  <TableCell>
                    <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-xs capitalize">
                      {doc.source}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatBytes(doc.size_bytes)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatRelative(doc.created_at)}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {doc.shipment_id ? shortId(doc.shipment_id) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
