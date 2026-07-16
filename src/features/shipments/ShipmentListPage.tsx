import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ship, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { shipmentsApi, flagsApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Spinner } from '@/components/shared/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ReferenceChip } from '@/components/shared/ReferenceChip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatRelative, shortId } from '@/lib/utils';
import type { Shipment, ShipmentStatus } from '@/types';
import type { AxiosError } from 'axios';

const STATUS_FILTERS: { label: string; value: ShipmentStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Complete', value: 'complete' },
  { label: 'On Hold', value: 'on_hold' },
];

function OpenFlagCount({ shipment }: { shipment: Shipment }) {
  const { data: flags } = useQuery({
    queryKey: queryKeys.shipmentFlags(shipment.id, 'open'),
    queryFn: () => flagsApi.listByShipment(shipment.id, 'open').then((r) => r.data),
  });

  const count = flags?.length ?? 0;

  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium tabular-nums ${
        count > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
      }`}
      title={count > 0 ? `${count} open issue${count !== 1 ? 's' : ''}` : 'No open issues'}
    >
      {count}
    </span>
  );
}

function CreateShipmentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => shipmentsApi.create(invoiceNumber.trim()),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments });
      toast.success('Shipment created');
      onOpenChange(false);
      setInvoiceNumber('');
      setError(null);
      navigate(`/shipments/${res.data.id}`);
    },
    onError: (e: AxiosError<{ detail?: string }>) => {
      if (e.response?.status === 409) {
        setError('A shipment with this invoice number already exists.');
      } else {
        setError(e.response?.data?.detail ?? 'Could not create shipment.');
      }
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!invoiceNumber.trim()) { setError('Invoice number is required.'); return; }
    mutation.mutate();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => { if (!v) { setInvoiceNumber(''); setError(null); } onOpenChange(v); }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New Shipment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invoice-number">Invoice Number</Label>
            <Input
              id="invoice-number"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="INV-2026-001"
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating…' : 'Create Shipment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ShipmentListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ShipmentStatus | 'all'>('all');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => shipmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments });
      toast.success('Shipment deleted');
      setPendingDelete(null);
    },
    onError: () => {
      toast.error('Delete failed.');
    },
  });

  const { data: shipments, isLoading } = useQuery({
    queryKey: queryKeys.shipments,
    queryFn: () => shipmentsApi.list().then((r) => r.data),
  });

  const filtered = shipments?.filter((s) => filter === 'all' || s.status === filter) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Shipments</h1>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Shipment
        </Button>
      </div>

      <CreateShipmentDialog open={createOpen} onOpenChange={setCreateOpen} />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as ShipmentStatus | 'all')}>
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
          icon={Ship}
          title="No shipments yet"
          description="Create a shipment to start uploading documents."
          action={
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> New Shipment
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shipment ID</TableHead>
                <TableHead>References</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Open Flags</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow
                  key={s.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/shipments/${s.id}`)}
                >
                  <TableCell className="font-mono text-sm">{shortId(s.id)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {s.references.slice(0, 3).map((ref) => (
                        <ReferenceChip key={ref.id} ref_type={ref.ref_type} ref_value={ref.ref_value} />
                      ))}
                      {s.references.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{s.references.length - 3}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>
                  <TableCell>
                    <OpenFlagCount shipment={s} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatRelative(s.created_at)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatRelative(s.updated_at)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => setPendingDelete(s.id)}
                      title="Delete shipment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!pendingDelete} onOpenChange={(o) => { if (!o) setPendingDelete(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete shipment?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will delete shipment <strong>{pendingDelete ? shortId(pendingDelete) : ''}</strong>. All linked documents will be kept but unlinked. Flags, intel matches, and references will be removed. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete shipment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
