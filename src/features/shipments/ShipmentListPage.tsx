import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Ship } from 'lucide-react';
import { shipmentsApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Spinner } from '@/components/shared/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ReferenceChip } from '@/components/shared/ReferenceChip';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatRelative, shortId } from '@/lib/utils';
import type { ShipmentStatus } from '@/types';

const STATUS_FILTERS: { label: string; value: ShipmentStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Complete', value: 'complete' },
  { label: 'On Hold', value: 'on_hold' },
];

export function ShipmentListPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ShipmentStatus | 'all'>('all');

  const { data: shipments, isLoading } = useQuery({
    queryKey: queryKeys.shipments,
    queryFn: () => shipmentsApi.list().then((r) => r.data),
  });

  const filtered = shipments?.filter((s) => filter === 'all' || s.status === filter) ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Shipments</h1>

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
          description="Upload documents to start matching."
        />
      ) : (
        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shipment ID</TableHead>
                <TableHead>References</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
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
                  <TableCell className="text-sm text-muted-foreground">
                    {formatRelative(s.created_at)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatRelative(s.updated_at)}
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
