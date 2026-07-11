import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { intelApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { InterestChip } from '@/components/shared/InterestChip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/shared/Spinner';
import type { InterestType } from '@/types';
import { INTEREST_TYPE_LABELS } from '@/lib/constants';

const INTEREST_TYPES: InterestType[] = ['hs_chapter', 'hs_heading', 'hs_code', 'country', 'party_name', 'industry'];

export function IntelInterestsPanel() {
  const qc = useQueryClient();
  const [newType, setNewType] = useState<InterestType>('hs_chapter');
  const [newValue, setNewValue] = useState('');

  const { data: interests, isLoading } = useQuery({
    queryKey: queryKeys.intelInterests,
    queryFn: () => intelApi.listInterests().then((r) => r.data),
  });

  const addMutation = useMutation({
    mutationFn: () => intelApi.addInterest({ interest_type: newType, value: newValue.trim() }),
    onSuccess: () => {
      setNewValue('');
      qc.invalidateQueries({ queryKey: queryKeys.intelInterests });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => intelApi.deleteInterest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.intelInterests }),
  });

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <div className="border-b px-5 py-3.5">
        <h3 className="text-sm font-semibold">Followed Topics</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Changes affect feed ranking immediately.
        </p>
      </div>
      <div className="p-5">
        {isLoading ? (
          <Spinner size="sm" />
        ) : (
          <div className="flex flex-wrap gap-2">
            {interests?.map((interest) => (
              <InterestChip
                key={interest.id}
                interestType={interest.interest_type}
                value={interest.value}
                onRemove={() => removeMutation.mutate(interest.id)}
              />
            ))}
            {!interests?.length && (
              <p className="text-xs text-muted-foreground">No topics followed yet.</p>
            )}
          </div>
        )}

        <form
          className="mt-4 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (newValue.trim()) addMutation.mutate();
          }}
        >
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as InterestType)}
            className="rounded-md border bg-white px-2 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            {INTEREST_TYPES.map((t) => (
              <option key={t} value={t}>{INTEREST_TYPE_LABELS[t]}</option>
            ))}
          </select>
          <Input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="e.g. 7208"
            className="h-8 text-xs"
          />
          <Button
            type="submit"
            size="sm"
            className="h-8 gap-1"
            disabled={!newValue.trim() || addMutation.isPending}
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </form>
      </div>
    </div>
  );
}
