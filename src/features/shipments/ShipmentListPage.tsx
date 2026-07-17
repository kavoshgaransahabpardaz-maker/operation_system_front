import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { shipmentsApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Spinner } from '@/components/shared/Spinner';
import { ReferenceChip } from '@/components/shared/ReferenceChip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { formatRelative, shortId } from '@/lib/utils';
import { SHIPMENT_STATUS_LABELS } from '@/lib/constants';
import type { Shipment, ShipmentStatus } from '@/types';
import type { AxiosError } from 'axios';

const STATUS_BADGE: Record<ShipmentStatus, string> = {
  active: 'bg-blue-100 text-blue-700',
  complete: 'bg-green-100 text-green-700',
  on_hold: 'bg-amber-100 text-amber-800',
};

const STATUS_BAR: Record<ShipmentStatus, { width: string; color: string }> = {
  active: { width: 'w-3/5', color: 'bg-blue-500' },
  on_hold: { width: 'w-1/4', color: 'bg-amber-500' },
  complete: { width: 'w-full', color: 'bg-green-500' },
};

function ShipmentCard({
  shipment,
  onDelete,
}: {
  shipment: Shipment;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  const bar = STATUS_BAR[shipment.status];
  const primaryRef = shipment.references[0];

  return (
    <div
      className="group relative border border-border rounded-2xl p-5 flex flex-col gap-3 cursor-pointer bg-background hover:shadow-md transition-all"
      onClick={() => navigate(`/shipments/${shipment.id}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-sm font-bold tracking-tight">{shortId(shipment.id)}</span>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[shipment.status]}`}
        >
          {SHIPMENT_STATUS_LABELS[shipment.status].toUpperCase()}
        </span>
      </div>

      {primaryRef && (
        <p className="text-[13px] font-semibold truncate">{primaryRef.ref_value}</p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {shipment.references.slice(primaryRef ? 1 : 0, 4).map((ref) => (
          <ReferenceChip key={ref.id} ref_type={ref.ref_type} ref_value={ref.ref_value} />
        ))}
        {shipment.references.length > 4 && (
          <span className="text-[11px] text-muted-foreground">
            +{shipment.references.length - 4}
          </span>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground mt-auto">{formatRelative(shipment.updated_at)}</p>

      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${bar.width} ${bar.color}`} />
      </div>

      <button
        type="button"
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-muted"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete shipment"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function AddShipmentCard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (invoice: string) => shipmentsApi.create(invoice),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments });
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

  function submit() {
    setError(null);
    const trimmed = value.trim();
    if (!trimmed) { setError('Enter an invoice number.'); return; }
    mutation.mutate(trimmed);
  }

  return (
    <div className="border-2 border-dashed border-border rounded-2xl p-5 flex flex-col gap-3 bg-muted/20">
      <p className="text-sm font-bold">+ New shipment</p>
      <Input
        value={value}
        onChange={(e) => { setValue(e.target.value); setError(null); }}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        placeholder="Invoice number, e.g. INV-2026-001"
        className="font-mono text-sm h-9"
        autoComplete="off"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button
        size="sm"
        className="w-full h-9"
        onClick={submit}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? 'Creating…' : 'Create shipment'}
      </Button>
      <p className="text-[11px] text-muted-foreground">Upload documents on the next screen.</p>
    </div>
  );
}

function StatPill({
  label,
  value,
  colorCls,
}: {
  label: string;
  value: number;
  colorCls?: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={`text-xl font-bold tabular-nums ${colorCls ?? ''}`}>{value}</span>
      <span className="font-mono text-[10.5px] tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}

export function ShipmentListPage() {
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => shipmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments });
      toast.success('Shipment deleted');
      setPendingDelete(null);
    },
    onError: () => toast.error('Delete failed.'),
  });

  const { data: shipments, isLoading } = useQuery({
    queryKey: queryKeys.shipments,
    queryFn: () => shipmentsApi.list().then((r) => r.data),
  });

  const active = shipments?.filter((s) => s.status === 'active').length ?? 0;
  const onHold = shipments?.filter((s) => s.status === 'on_hold').length ?? 0;
  const complete = shipments?.filter((s) => s.status === 'complete').length ?? 0;

  const now = new Date();
  const month = now.toLocaleString('default', { month: 'long' }).toUpperCase();
  const year = now.getFullYear();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-mono text-[10.5px] tracking-widest text-muted-foreground">
            WORKSPACE · {month} {year}
          </p>
          <h1 className="text-2xl font-bold tracking-tight mt-1.5">Shipments</h1>
        </div>
        {shipments && shipments.length > 0 && (
          <div className="flex items-baseline gap-8">
            <StatPill label="ACTIVE" value={active} colorCls="text-blue-600" />
            <StatPill label="ON HOLD" value={onHold} colorCls="text-amber-600" />
            <StatPill label="VERIFIED" value={complete} colorCls="text-green-600" />
          </div>
        )}
      </div>

      {isLoading ? (
        <Spinner size="lg" className="mt-20" />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-4">
          <AddShipmentCard />
          {shipments?.map((s) => (
            <ShipmentCard
              key={s.id}
              shipment={s}
              onDelete={() => setPendingDelete(s.id)}
            />
          ))}
        </div>
      )}

      <Dialog
        open={!!pendingDelete}
        onOpenChange={(o) => { if (!o) setPendingDelete(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete shipment?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will delete shipment{' '}
            <strong>{pendingDelete ? shortId(pendingDelete) : ''}</strong>. All linked
            documents will be kept but unlinked. Flags, intel matches, and references will be
            removed. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
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
