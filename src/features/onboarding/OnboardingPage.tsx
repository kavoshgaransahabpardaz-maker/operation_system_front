import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { intelApi, orgSettingsApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/shared/Spinner';
import { InterestChip } from '@/components/shared/InterestChip';
import { INTEREST_TYPE_LABELS, INTEREST_TYPE_FORMAT_HINTS, INTEL_EVENT_TYPE_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { InterestType, UserInterest, IntelEventType, NotificationPreference } from '@/types';
import type { AxiosError } from 'axios';

const INTEREST_TYPES: InterestType[] = [
  'hs_chapter', 'hs_heading', 'hs_code', 'country', 'party_name', 'industry',
];

const ALL_EVENT_TYPES: IntelEventType[] = [
  'tariff_change', 'sanctions', 'regulation', 'trade_agreement', 'market_notice', 'other',
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

const DOC_ORG_OPTIONS = [
  { value: 'shipment', label: 'Shipment' },
  { value: 'client', label: 'Client' },
  { value: 'lane', label: 'Lane' },
  { value: 'date', label: 'Date' },
] as const;

// ─── Step indicators ──────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={step} className="flex items-center">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors',
                done ? 'bg-blue-600 text-white' : active ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'
              )}
            >
              {done ? <CheckCircle className="h-4 w-4" /> : step}
            </div>
            {step < total && (
              <div className={cn('h-0.5 w-12', done ? 'bg-blue-600' : 'bg-slate-200')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Org Settings ────────────────────────────────────────────────────

function OrgSettingsStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: queryKeys.orgSettings,
    queryFn: () => orgSettingsApi.get().then((r) => r.data),
  });

  const [weightQty, setWeightQty] = useState('');
  const [invoiceValue, setInvoiceValue] = useState('');
  const [nameMatch, setNameMatch] = useState('');
  const [docOrg, setDocOrg] = useState<'shipment' | 'client' | 'lane' | 'date'>('shipment');
  const [emailAlerts, setEmailAlerts] = useState(true);

  useEffect(() => {
    if (settings) {
      setWeightQty(String(settings.weight_qty_tolerance_pct));
      setInvoiceValue(String(settings.value_tolerance_pct));
      setNameMatch(String(Math.round(settings.name_match_threshold * 100)));
      setDocOrg(settings.doc_organization_by ?? 'shipment');
      setEmailAlerts(settings.email_critical_alerts ?? true);
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: () =>
      orgSettingsApi.update({
        weight_qty_tolerance_pct: Number(weightQty),
        value_tolerance_pct: Number(invoiceValue),
        name_match_threshold: Number(nameMatch) / 100,
        doc_organization_by: docOrg,
        email_critical_alerts: emailAlerts,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orgSettings });
      toast.success('Settings saved');
      onNext();
    },
    onError: (e: AxiosError<{ detail?: string }>) => {
      toast.error(e.response?.data?.detail ?? 'Failed to save settings');
    },
  });

  if (isLoading) return <Spinner size="lg" className="py-20" />;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Organisation Settings</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Configure your tolerance thresholds and preferences.</p>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label>Weight & Quantity Tolerance (%)</Label>
            <Input type="number" min={0} max={100} value={weightQty} onChange={(e) => setWeightQty(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Invoice Value Tolerance (%)</Label>
            <Input type="number" min={0} max={100} value={invoiceValue} onChange={(e) => setInvoiceValue(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Party Name Match (%)</Label>
            <Input type="number" min={0} max={100} value={nameMatch} onChange={(e) => setNameMatch(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1">
          <Label>Document organisation by</Label>
          <select
            value={docOrg}
            onChange={(e) => setDocOrg(e.target.value as typeof docOrg)}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            {DOC_ORG_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={emailAlerts}
            onChange={(e) => setEmailAlerts(e.target.checked)}
            className="h-4 w-4 rounded accent-blue-600"
          />
          <div>
            <p className="text-sm font-medium">Email critical alerts</p>
            <p className="text-xs text-muted-foreground">Send email when critical trade events match your shipments</p>
          </div>
        </label>
      </div>

      <div className="flex items-center gap-3 justify-end">
        <Button variant="ghost" size="sm" onClick={onSkip}>Skip</Button>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Save & Continue'}
        </Button>
      </div>
    </div>
  );
}

// ─── Step 2: Interests ───────────────────────────────────────────────────────

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

function InterestsStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const qc = useQueryClient();
  const [type, setType] = useState<InterestType>('country');
  const [value, setValue] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  const isHsType = HS_TYPES.includes(type);

  const { data: interests, isLoading } = useQuery({
    queryKey: queryKeys.intelInterests,
    queryFn: () => intelApi.listInterests().then((r) => r.data),
  });

  const { data: hsResults } = useQuery({
    queryKey: queryKeys.hsAutocomplete(value),
    queryFn: () => intelApi.hsAutocomplete(value).then((r) => r.data.results),
    enabled: value.trim().length >= 2 && isHsType,
    staleTime: 30_000,
  });

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
      qc.invalidateQueries({ queryKey: queryKeys.intelInterests });
      toast.success('Interest added');
    },
    onError: (e: AxiosError<{ detail?: string }>) => {
      toast.error(e.response?.data?.detail ?? 'Failed to add interest');
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

  const removeMutation = useMutation({
    mutationFn: (id: string) => intelApi.deleteInterest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.intelInterests });
    },
  });

  function handleAdd() {
    const submitValue = type === 'country' ? value.trim().toUpperCase() : value.trim();
    const err = validateInterestValue(type, submitValue);
    if (err) { setValidationError(err); return; }
    setValidationError(null);
    addMutation.mutate(submitValue);
  }

  const addedCountryCodes = new Set(
    interests?.filter((i) => i.interest_type === 'country').map((i) => i.value) ?? []
  );
  const availableCountries = COMMON_COUNTRIES.filter((c) => !addedCountryCodes.has(c.code));

  const grouped = INTEREST_TYPES.reduce<Record<InterestType, UserInterest[]>>((acc, t) => {
    acc[t] = interests?.filter((i) => i.interest_type === t) ?? [];
    return acc;
  }, {} as Record<InterestType, UserInterest[]>);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">My Interests</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Add HS codes, countries, parties, and industries to personalise your feed.</p>
      </div>

      {/* Add form */}
      <div className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <select
            value={type}
            onChange={(e) => { setType(e.target.value as InterestType); setValue(''); setValidationError(null); }}
            className="rounded-md border bg-white px-2 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            {INTEREST_TYPES.map((t) => (
              <option key={t} value={t}>{INTEREST_TYPE_LABELS[t]}</option>
            ))}
          </select>

          {type === 'country' ? (
            <div className="flex-1 space-y-2">
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
                <option value="">— quick add a country —</option>
                {availableCountries.map((c) => (
                  <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                ))}
              </select>
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
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setValue(r.code);
                        setShowAutocomplete(false);
                        setValidationError(null);
                      }}
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
            <Button size="sm" className="h-8" onClick={handleAdd} disabled={!value.trim() || addMutation.isPending}>
              Add
            </Button>
          )}
        </div>
        {validationError && <p className="text-xs text-destructive">{validationError}</p>}
      </div>

      {/* Current interests */}
      {isLoading ? (
        <Spinner size="sm" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {INTEREST_TYPES.map((t) => (
            <div key={t} className="rounded-xl border bg-white p-3 shadow-sm">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {INTEREST_TYPE_LABELS[t]}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {grouped[t].map((interest) => (
                  <InterestChip
                    key={interest.id}
                    interestType={interest.interest_type}
                    value={interest.value}
                    isExplicit={interest.is_explicit}
                    onRemove={() => removeMutation.mutate(interest.id)}
                  />
                ))}
                {grouped[t].length === 0 && (
                  <p className="text-xs text-slate-400">None</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 justify-end">
        <Button variant="ghost" size="sm" onClick={onSkip}>Skip</Button>
        <Button onClick={onNext}>Continue</Button>
      </div>
    </div>
  );
}

// ─── Step 3: News Sources ────────────────────────────────────────────────────

function SourcesStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const qc = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: queryKeys.mySourcePreferences,
    queryFn: () => intelApi.listMySourcePreferences().then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ sourceId, is_enabled }: { sourceId: string; is_enabled: boolean }) =>
      intelApi.updateSourcePreference(sourceId, is_enabled),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.mySourcePreferences });
    },
    onError: (e: AxiosError<{ detail?: string }>) => {
      toast.error(e.response?.data?.detail ?? 'Failed to update preference');
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">News Sources</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Choose which sources appear in your TradeWatch feed.</p>
      </div>

      {isLoading ? (
        <Spinner size="lg" className="py-10" />
      ) : !preferences?.length ? (
        <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">No sources configured yet. An admin will need to add sources first.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm divide-y">
          {preferences.map((pref) => (
            <div
              key={pref.source_id}
              className={`flex items-center justify-between px-5 py-3.5 ${!pref.is_enabled ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`inline-block shrink-0 rounded-full w-2 h-2 ${pref.is_enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <p className="text-sm font-medium truncate">{pref.source_name}</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center gap-2 ml-4 shrink-0">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={pref.is_enabled}
                  onChange={(e) =>
                    updateMutation.mutate({ sourceId: pref.source_id, is_enabled: e.target.checked })
                  }
                  disabled={updateMutation.isPending}
                />
                <div className={`h-5 w-9 rounded-full transition-colors ${pref.is_enabled ? 'bg-blue-600' : 'bg-slate-200'}`}>
                  <div className={`mt-0.5 ml-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${pref.is_enabled ? 'translate-x-4' : ''}`} />
                </div>
                <span className="text-xs text-muted-foreground w-14">
                  {pref.is_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 justify-end">
        <Button variant="ghost" size="sm" onClick={onSkip}>Skip</Button>
        <Button onClick={onNext}>Continue</Button>
      </div>
    </div>
  );
}

// ─── Step 4: Notification Preferences ───────────────────────────────────────

function NotificationsStep({ onFinish }: { onFinish: () => void }) {
  const qc = useQueryClient();

  const { data: prefs, isLoading } = useQuery({
    queryKey: queryKeys.intelNotificationPrefs,
    queryFn: () => intelApi.getNotificationPreferences().then((r) => r.data),
  });

  const [minImpact, setMinImpact] = useState(3);
  const [eventTypes, setEventTypes] = useState<IntelEventType[]>([]);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (prefs) {
      setMinImpact(prefs.min_impact_score);
      setEventTypes(prefs.event_types);
      setEmailEnabled(prefs.delivery_channels.includes('email'));
      setIsActive(prefs.is_active);
    }
  }, [prefs]);

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Pick<NotificationPreference, 'min_impact_score' | 'event_types' | 'delivery_channels' | 'is_active'>>) =>
      intelApi.updateNotificationPreferences(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.intelNotificationPrefs });
      toast.success('Preferences saved');
    },
    onError: (e: AxiosError<{ detail?: string }>) => {
      toast.error(e.response?.data?.detail ?? 'Failed to save preferences');
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => orgSettingsApi.update({ email_critical_alerts: emailEnabled }),
    onSuccess: () => {
      onFinish();
    },
  });

  function handleFinish() {
    saveMutation.mutate(
      { min_impact_score: minImpact, event_types: eventTypes, delivery_channels: emailEnabled ? ['email'] : [], is_active: isActive },
      { onSuccess: () => completeMutation.mutate() }
    );
  }

  function toggleEventType(t: IntelEventType) {
    setEventTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  if (isLoading) return <Spinner size="lg" className="py-20" />;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Notification Preferences</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Control when and how you receive trade intelligence alerts.</p>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm space-y-6">
        {/* Active toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Alerts enabled</p>
            <p className="text-xs text-muted-foreground">Receive notifications for matching trade events</p>
          </div>
          <button
            type="button"
            onClick={() => setIsActive((v) => !v)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              isActive ? 'bg-blue-600' : 'bg-slate-200'
            )}
          >
            <span className={cn('inline-block h-4 w-4 rounded-full bg-white shadow transition-transform', isActive ? 'translate-x-6' : 'translate-x-1')} />
          </button>
        </div>

        {/* Min impact */}
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Minimum impact score</p>
            <p className="text-xs text-muted-foreground">Notify me for impact ≥ {minImpact}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">1</span>
            <input
              type="range"
              min={1}
              max={5}
              value={minImpact}
              onChange={(e) => setMinImpact(Number(e.target.value))}
              className="flex-1 accent-blue-600"
            />
            <span className="text-xs text-slate-400">5</span>
            <span className="w-6 text-center text-sm font-bold text-blue-600">{minImpact}</span>
          </div>
        </div>

        {/* Event types */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Event types</p>
          <p className="text-xs text-muted-foreground">Empty = all event types</p>
          <div className="flex flex-wrap gap-2">
            {ALL_EVENT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleEventType(t)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  eventTypes.includes(t)
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                )}
              >
                {INTEL_EVENT_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Email channel */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={emailEnabled}
            onChange={(e) => setEmailEnabled(e.target.checked)}
            className="h-4 w-4 rounded accent-blue-600"
          />
          <div>
            <p className="text-sm">Email alerts</p>
            <p className="text-xs text-muted-foreground">Receive digest emails for matched trade events</p>
          </div>
        </label>
      </div>

      <div className="flex items-center gap-3 justify-end">
        <Button
          onClick={handleFinish}
          disabled={saveMutation.isPending || completeMutation.isPending}
          className="gap-2"
        >
          {saveMutation.isPending || completeMutation.isPending ? 'Finishing…' : 'Finish Setup'}
        </Button>
      </div>
    </div>
  );
}

// ─── Main OnboardingPage ─────────────────────────────────────────────────────

const TOTAL_STEPS = 4;

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  function nextStep() {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    }
  }

  function handleFinish() {
    navigate('/dashboard', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center pt-12 px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Welcome to Veritariff</h1>
          <p className="mt-1 text-sm text-muted-foreground">Let's set up your account in a few quick steps.</p>
        </div>

        <StepIndicator current={step} total={TOTAL_STEPS} />

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          {step === 1 && (
            <OrgSettingsStep onNext={nextStep} onSkip={nextStep} />
          )}
          {step === 2 && (
            <InterestsStep onNext={nextStep} onSkip={nextStep} />
          )}
          {step === 3 && (
            <SourcesStep onNext={nextStep} onSkip={nextStep} />
          )}
          {step === 4 && (
            <NotificationsStep onFinish={handleFinish} />
          )}
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Step {step} of {TOTAL_STEPS}
        </p>
      </div>
    </div>
  );
}
