import { useState, useRef, useEffect } from 'react';
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

const COMMON_COUNTRIES = [
  { code: 'AE', name: 'UAE' }, { code: 'AU', name: 'Australia' }, { code: 'BE', name: 'Belgium' },
  { code: 'BR', name: 'Brazil' }, { code: 'CA', name: 'Canada' }, { code: 'CH', name: 'Switzerland' },
  { code: 'CN', name: 'China' }, { code: 'DE', name: 'Germany' }, { code: 'ES', name: 'Spain' },
  { code: 'FR', name: 'France' }, { code: 'GB', name: 'United Kingdom' }, { code: 'HK', name: 'Hong Kong' },
  { code: 'IN', name: 'India' }, { code: 'IT', name: 'Italy' }, { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' }, { code: 'MX', name: 'Mexico' }, { code: 'NL', name: 'Netherlands' },
  { code: 'PL', name: 'Poland' }, { code: 'SA', name: 'Saudi Arabia' }, { code: 'SE', name: 'Sweden' },
  { code: 'SG', name: 'Singapore' }, { code: 'TR', name: 'Turkey' }, { code: 'US', name: 'United States' },
  { code: 'ZA', name: 'South Africa' },
];

const HS_TYPES: InterestType[] = ['hs_code', 'hs_heading', 'hs_chapter'];

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
      if (/\d/.test(v)) return 'No numbers allowed — letters only';
      break;
  }
  return null;
}

function AddInterestForm({
  onAdded,
  existingInterests,
}: {
  onAdded: () => void;
  existingInterests: UserInterest[];
}) {
  const qc = useQueryClient();
  const [type, setType] = useState<InterestType>('hs_chapter');
  const [value, setValue] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  const isHsType = HS_TYPES.includes(type);

  const { data: hsResults } = useQuery({
    queryKey: queryKeys.hsAutocomplete(value),
    queryFn: () => intelApi.hsAutocomplete(value).then((r) => r.data.results),
    enabled: value.trim().length >= 2 && isHsType,
    staleTime: 30_000,
  });

  // Hide autocomplete when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowAutocomplete(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addMutation = useMutation({
    mutationFn: (submitValue: string) =>
      intelApi.addInterest({ interest_type: type, value: submitValue }),
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

  const quickAddCountryMutation = useMutation({
    mutationFn: (code: string) =>
      intelApi.addInterest({ interest_type: 'country', value: code }),
    onSuccess: (_, code) => {
      qc.invalidateQueries({ queryKey: queryKeys.intelInterests });
      toast.success(`Added ${code}`);
      if (selectRef.current) selectRef.current.value = '';
    },
    onError: (e: AxiosError<{ detail?: string }>) => {
      toast.error(e.response?.data?.detail ?? 'Failed to add country');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    const submitValue = type === 'country' ? value.trim().toUpperCase() : value.trim();
    const err = validateInterestValue(type, submitValue);
    if (err) { setValidationError(err); return; }
    setValidationError(null);
    addMutation.mutate(submitValue);
  }

  function handleHsSelect(code: string) {
    setValue(code);
    setShowAutocomplete(false);
    setValidationError(null);
  }

  const addedCountryCodes = new Set(
    existingInterests.filter((i) => i.interest_type === 'country').map((i) => i.value)
  );

  const availableCountries = COMMON_COUNTRIES.filter((c) => !addedCountryCodes.has(c.code));

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="flex items-center gap-2">
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as InterestType);
            setValidationError(null);
            setApiError(null);
            setValue('');
          }}
          className="rounded-md border bg-white px-2 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
        >
          {INTEREST_TYPES.map((t) => (
            <option key={t} value={t}>{INTEREST_TYPE_LABELS[t]}</option>
          ))}
        </select>

        {type === 'country' ? (
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-[11px] text-muted-foreground mb-1">Quick add:</p>
              <select
                ref={selectRef}
                defaultValue=""
                onChange={(e) => {
                  const code = e.target.value;
                  if (code) quickAddCountryMutation.mutate(code);
                }}
                disabled={quickAddCountryMutation.isPending}
                className="w-full rounded-md border bg-white px-2 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="">— select a country —</option>
                {availableCountries.map((c) => (
                  <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={value}
                onChange={(e) => { setValue(e.target.value); setValidationError(null); }}
                placeholder="or type ISO code, e.g. GB"
                className="h-8 text-xs flex-1"
              />
              <Button type="submit" size="sm" className="h-8 gap-1" disabled={!value.trim() || addMutation.isPending}>
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative flex-1" ref={autocompleteRef}>
            <Input
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setValidationError(null);
                setShowAutocomplete(isHsType && e.target.value.trim().length >= 2);
              }}
              onFocus={() => {
                if (isHsType && value.trim().length >= 2) setShowAutocomplete(true);
              }}
              placeholder={INTEREST_TYPE_FORMAT_HINTS[type]}
              className="h-8 text-xs"
            />
            {isHsType && showAutocomplete && hsResults && hsResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg max-h-48 overflow-y-auto">
                {hsResults.map((r) => (
                  <button
                    key={r.code}
                    type="button"
                    className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 flex items-center gap-2"
                    onMouseDown={(e) => { e.preventDefault(); handleHsSelect(r.code); }}
                  >
                    <span className="font-mono font-semibold text-slate-700 shrink-0">{r.code}</span>
                    <span className="text-slate-500 truncate">{r.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {type !== 'country' && (
          <Button type="submit" size="sm" className="h-8 gap-1" disabled={!value.trim() || addMutation.isPending}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        )}
      </div>

      {type !== 'country' && (
        <p className="text-[11px] text-muted-foreground pl-0.5">{INTEREST_TYPE_FORMAT_HINTS[type]}</p>
      )}
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
          <AddInterestForm
            onAdded={() => setShowAdd(false)}
            existingInterests={interests ?? []}
          />
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
