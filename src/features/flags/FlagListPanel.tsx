import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle } from 'lucide-react';
import { flagsApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Spinner } from '@/components/shared/Spinner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FlagCard } from './FlagCard';
import { ResolveFlagDialog } from './ResolveFlagDialog';
import type { Flag } from '@/types';

interface Props {
  shipmentId: string;
}

type FilterTab = 'all' | 'open' | 'resolved';

export function FlagListPanel({ shipmentId }: Props) {
  const [tab, setTab] = useState<FilterTab>('all');
  const [resolving, setResolving] = useState<Flag | null>(null);

  const { data: flags, isLoading } = useQuery({
    queryKey: queryKeys.shipmentFlags(shipmentId),
    queryFn: () => flagsApi.listByShipment(shipmentId).then((r) => r.data),
  });

  const filtered = flags?.filter((f) => {
    if (tab === 'open') return f.status === 'open';
    if (tab === 'resolved') return f.status === 'resolved';
    return true;
  }) ?? [];

  const openCount = flags?.filter((f) => f.status === 'open').length ?? 0;

  return (
    <div className="rounded-xl border bg-background" id="flags-panel">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">Issues &amp; Mismatches</h2>
          {openCount > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              {openCount} open
            </span>
          )}
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
          <TabsList className="h-7">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="open" className="text-xs">Open</TabsTrigger>
            <TabsTrigger value="resolved" className="text-xs">Resolved</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          <Spinner size="sm" className="mx-auto" />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <p className="text-sm font-medium">
              {tab === 'open'
                ? 'No open issues'
                : tab === 'resolved'
                  ? 'No resolved issues'
                  : 'No issues detected. All extracted fields are consistent.'}
            </p>
          </div>
        ) : (
          filtered.map((flag) => (
            <FlagCard key={flag.id} flag={flag} onResolve={setResolving} />
          ))
        )}
      </div>

      <ResolveFlagDialog flag={resolving} onClose={() => setResolving(null)} />
    </div>
  );
}
