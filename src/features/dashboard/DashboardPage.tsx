import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Ship, FileInput, Tag, AlertCircle, Mail } from 'lucide-react';
import { workspaceApi, documentsApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatRelative } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useUpload } from '@/hooks/useUpload';
import { useRef, useState } from 'react';
import { ACCEPTED_FILE_TYPES, MAX_FILE_BYTES } from '@/lib/constants';

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

  const stats = [
    { label: 'Total Shipments', value: data?.total_shipments ?? 0, icon: Ship, highlight: false },
    { label: 'Imported Today', value: data?.documents_imported_today ?? 0, icon: FileInput, highlight: false },
    { label: 'Needs Classification', value: data?.unclassified_documents ?? 0, icon: Tag, highlight: false },
    { label: 'Needs Review', value: data?.shipments_requiring_review ?? 0, icon: AlertCircle, highlight: (data?.shipments_requiring_review ?? 0) > 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, highlight }) => (
          <Card key={label} className={highlight ? 'border-amber-300 bg-amber-50' : undefined}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent email imports */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Email Imports</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.recent_email_imports.length === 0 ? (
              <EmptyState
                icon={Mail}
                title="No email imports yet"
                description="Connect a mailbox in Email settings."
              />
            ) : (
              <div className="space-y-3">
                {data?.recent_email_imports.map((imp) => (
                  <div key={imp.id} className="flex items-start justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{imp.subject ?? '(no subject)'}</p>
                      <p className="text-muted-foreground">{imp.sender}</p>
                    </div>
                    <div className="shrink-0 text-right text-xs text-muted-foreground">
                      <span className="inline-block rounded bg-muted px-1.5 py-0.5 capitalize">
                        {imp.provider}
                      </span>
                      <p className="mt-1">{imp.received_at ? formatRelative(imp.received_at) : '—'}</p>
                      <p>{imp.attachment_count} attach.</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="justify-start">
                  <FileInput className="mr-2 h-4 w-4" /> Upload Document
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
                  <FileInput className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Drag & drop here, or</p>
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? 'Uploading…' : 'Choose file'}
                  </Button>
                  <p className="text-xs text-muted-foreground">PDF, images — max {MAX_FILE_BYTES / 1024 / 1024} MB</p>
                  <input ref={fileRef} type="file" accept={ACCEPTED_FILE_TYPES} className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="justify-start" onClick={() => navigate('/documents')}>
              <FileInput className="mr-2 h-4 w-4" /> View Documents
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => navigate('/email')}>
              <Mail className="mr-2 h-4 w-4" /> Manage Email
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
