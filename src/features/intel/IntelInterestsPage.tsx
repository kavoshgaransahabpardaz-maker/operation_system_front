import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { intelApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { InterestChip } from '@/components/shared/InterestChip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/shared/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { INTEREST_TYPE_LABELS } from '@/lib/constants';
import type { InterestType, UserInterest } from '@/types';
import type { AxiosError } from 'axios';

const INTEREST_TYPES: InterestType[] = ['hs_chapter', 'hs_heading', 'country', 'party_name'];

function AddInterestForm({ onAdded }: { onAdded: () => void }) {
  const qc = useQueryClient();
  const [type, setType] = useState<InterestType>('hs_chapter');
  const [value, setValue] = useState('');

  const mutation = useMutation({
    mutationFn: () => intelApi.addInterest({ interest_type: type, value: value.trim() }),
    onSuccess: () => {
      setValue('');
      qc.invalidateQueries({ queryKey: queryKeys.intelInterests });
      toast.success('Interest added');
      onAdded();
    },
    onError: (e: AxiosError<{ detail?: string }>) => {
      toast.error(e.response?.data?.detail ?? 'Failed to add interest');
    },
  });

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => { e.preventDefault(); if (value.trim()) mutation.mutate(); }}
    >
      <select
        value={type}
        onChange={(e) => setType(e.target.value as InterestType)}
        className="rounded-md border bg-white px-2 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
      >
        {INTEREST_TYPES.map((t) => (
          <option key={t} value={t}>{INTEREST_TYPE_LABELS[t]}</option>
        ))}
      </select>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. 7208, GB, Acme Steel…"
        className="h-8 text-xs flex-1"
      />
      <Button type="submit" size="sm" className="h-8 gap-1" disabled={!value.trim() || mutation.isPending}>
        <Plus className="h-3.5 w-3.5" /> Add
      </Button>
    </form>
  );
}

export function IntelInterestsPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const { data: interests, isLoading } = useQuery({
    queryKey: queryKeys.intelInterests,
    queryFn: () => intelApi.listInterests().then((r) => r.data),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => intelApi.deleteInterest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.intelInterests });
      toast.success('Interest removed');
    },
  });

  const grouped = INTEREST_TYPES.reduce<Record<InterestType, UserInterest[]>>((acc, t) => {
    acc[t] = interests?.filter((i) => i.interest_type === t) ?? [];
    return acc;
  }, {} as Record<InterestType, UserInterest[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Followed Topics</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Changes affect feed ranking immediately. Auto-detected interests cannot be removed.
          </p>
        </div>
        <Button size="sm" className="gap-1" onClick={() => setShowAdd((v) => !v)}>
          <Plus className="h-3.5 w-3.5" /> Add Interest
        </Button>
      </div>

      {showAdd && (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <AddInterestForm onAdded={() => setShowAdd(false)} />
        </div>
      )}

      {isLoading ? (
        <Spinner size="lg" className="py-16" />
      ) : !interests?.length ? (
        <EmptyState
          icon={BookOpen}
          title="No interests yet"
          description="Add HS codes, countries, or party names to personalise your intelligence feed."
          action={<Button size="sm" onClick={() => setShowAdd(true)}>Add first interest</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INTEREST_TYPES.map((type) => (
            <div key={type} className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {INTEREST_TYPE_LABELS[type]}
              </p>
              <div className="flex flex-wrap gap-2">
                {grouped[type].map((interest) => (
                  <InterestChip
                    key={interest.id}
                    interestType={interest.interest_type}
                    value={interest.value}
                    isExplicit={interest.is_explicit}
                    onRemove={() => removeMutation.mutate(interest.id)}
                  />
                ))}
                {grouped[type].length === 0 && (
                  <p className="text-xs text-slate-400">None</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
