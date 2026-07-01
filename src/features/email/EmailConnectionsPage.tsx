import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, RefreshCw, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { emailsApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/shared/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { formatRelative } from '@/lib/utils';
import type { AxiosError } from 'axios';

const schema = z.object({
  email_address: z.string().email('Invalid email'),
  imap_host: z.string().min(1, 'IMAP host is required'),
  imap_port: z.coerce.number().int().min(1).max(65535).default(993),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export function EmailConnectionsPage() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [disconnectId, setDisconnectId] = useState<string | null>(null);

  const { data: connections, isLoading } = useQuery({
    queryKey: queryKeys.emailConnections,
    queryFn: () => emailsApi.list().then((r) => r.data),
  });

  const syncMutation = useMutation({
    mutationFn: (id: string) => emailsApi.sync(id),
    onSuccess: () => toast.success('Sync queued'),
    onError: (e: AxiosError<{ detail?: string }>) =>
      toast.error(e.response?.data?.detail ?? 'Sync failed.'),
  });

  const disconnectMutation = useMutation({
    mutationFn: (id: string) => emailsApi.disconnect(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emailConnections });
      toast.success('Disconnected');
      setDisconnectId(null);
    },
    onError: (e: AxiosError<{ detail?: string }>) =>
      toast.error(e.response?.data?.detail ?? 'Disconnect failed.'),
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { imap_port: 993 } });

  async function onAdd(data: FormData) {
    try {
      await emailsApi.createImap(data);
      queryClient.invalidateQueries({ queryKey: queryKeys.emailConnections });
      toast.success('Mailbox connected');
      reset();
      setAddOpen(false);
    } catch (err) {
      const msg = (err as AxiosError<{ detail?: string }>).response?.data?.detail ?? 'Connection failed.';
      setError('root', { message: msg });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Email Connections</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Connection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add IMAP Connection</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onAdd)} className="space-y-4">
              <div className="space-y-1">
                <Label>Email address</Label>
                <Input type="email" {...register('email_address')} />
                {errors.email_address && <p className="text-xs text-destructive">{errors.email_address.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>IMAP host</Label>
                <Input placeholder="imap.gmail.com" {...register('imap_host')} />
                {errors.imap_host && <p className="text-xs text-destructive">{errors.imap_host.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>IMAP port</Label>
                <Input type="number" {...register('imap_port')} />
                {errors.imap_port && <p className="text-xs text-destructive">{errors.imap_port.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Password</Label>
                <Input type="password" {...register('password')} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
              {errors.root && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {errors.root.message}
                </p>
              )}
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Connecting…' : 'Connect mailbox'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Spinner size="lg" className="mt-20" />
      ) : !connections?.length ? (
        <EmptyState
          icon={Mail}
          title="No email connections"
          description="Add one to start importing attachments automatically."
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Connection
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {connections.map((conn) => (
            <div key={conn.id} className="rounded-xl border bg-background p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-block rounded bg-muted px-2 py-0.5 text-xs font-medium uppercase">
                  {conn.provider}
                </span>
                <span
                  className={`h-2 w-2 rounded-full ${conn.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                  title={conn.is_active ? 'Active' : 'Inactive'}
                />
              </div>
              <p className="font-medium truncate">{conn.email_address}</p>
              <p className="text-xs text-muted-foreground">
                Last synced:{' '}
                {conn.last_synced_at ? formatRelative(conn.last_synced_at) : 'Never'}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => syncMutation.mutate(conn.id)}
                  disabled={syncMutation.isPending}
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Sync Now
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => setDisconnectId(conn.id)}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Disconnect
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Disconnect confirm */}
      <Dialog open={!!disconnectId} onOpenChange={(o) => !o && setDisconnectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect mailbox?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will stop syncing emails from this mailbox.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisconnectId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => disconnectId && disconnectMutation.mutate(disconnectId)}
              disabled={disconnectMutation.isPending}
            >
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
