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
import { INTEREST_TYPE_LABELS, INTEREST_TYPE_FORMAT_HINTS } from '@/lib/constants';
import type { InterestType, UserInterest } from '@/types';
import type { AxiosError } from 'axios';

const INTEREST_TYPES: InterestType[] = [
  'hs_chapter', 'hs_heading', 'hs_code', 'country', 'party_name', 'industry',
];

function validateInterestValue(type: InterestType, value: string): string | null {
  const v = value.trim();
  if (!v) return 'Value is required';
  switch (type) {
    case 'country':
      if (!/^[A-Z]{2}$/.test(v.toUpperCase())) return 'Use a 2-letter ISO code, e.g. GB';
      break;
    case 'hs_chapter':
      if (!/^\d{2}$/.test(v)) return 'Must be exactly 2 digits, e.g. 72';
      break;
    case 'hs_heading':
      if (!/^\d{4}$/.test(v)) return 'Must be exactly 4 digits, e.g. 7208';
      break;
    case 'hs_code':
      if (!/^\d{6,10}$/.test(v)) return 'Must be 6–10 digits, e.g. 720851';
      break;
    case 'party_name':
    case 'industry':
      // free text, non-empty (already checked above)
      break;
  }
  return null;
}

function AddInterestForm({ onAdded }: { onAdded: () => void }) {
  const qc = useQueryClient();
  const [type, setType] = useState<InterestType>('hs_chapter');
  const [value, setValue] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      const submitValue = type === 'country' ? value.trim().toUpperCase() : value.trim();
      return intelApi.addInterest({ interest_type: type, value: submitValue });
    },
    onSuccess: () => {
      setValue('');
      setValidationError(null);
      setApiError(null);
      qc.invalidateQueries({ queryKey: queryKeys.intelInterests });
      toast.success('Interest added');
      onAdded();
    },
    onError: (e: AxiosError<{ detail?: string }>) => {
      setApiError(e.response?.data?.detail ?? 'Failed to add interest');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    const err = validateInterestValue(type, value);
    if (err) { setValidationError(err); return; }
    setValidationError(null);
    mutation.mutate();
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="flex items-center gap-2">
        <select
          value={type}
          onChange={(e) => { setType(e.target.value as InterestType); setValidationError(null); setApiError(null); }}
          className="rounded-md border bg-white px-2 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
        >
          {INTEREST_TYPES.map((t) => (
            <option key={t} value={t}>{INTEREST_TYPE_LABELS[t]}</option>
          ))}
        </select>
        <Input
          value={value}
          onChange={(e) => { setValue(e.target.value); setValidationError(null); }}
          placeholder={INTEREST_TYPE_FORMAT_HINTS[type]}
          className="h-8 text-xs flex-1"
        />
        <Button type="submit" size="sm" className="h-8 gap-1" disabled={!value.trim() || mutation.isPending}>
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground pl-0.5">{INTEREST_TYPE_FORMAT_HINTS[type]}</p>
      {validationError && <p className="text-xs text-destructive">{validationError}</p>}
      {apiError && <p className="text-xs text-destructive">{apiError}</p>}
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
