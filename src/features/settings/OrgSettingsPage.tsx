import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Info, Languages } from 'lucide-react';
import { toast } from 'sonner';
import { orgSettingsApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Spinner } from '@/components/shared/Spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { AxiosError } from 'axios';

const schema = z.object({
  weight_qty_tolerance_pct: z.coerce.number().min(0).max(100),
  value_tolerance_pct: z.coerce.number().min(0).max(100),
  name_match_threshold_pct: z.coerce.number().min(0).max(100),
  doc_organization_by: z.enum(['shipment', 'client', 'lane', 'date']),
  auto_fix_threshold_pct: z.coerce.number().min(50).max(100),
  email_critical_alerts: z.boolean(),
  ocr_languages: z.array(z.string()).min(1, 'Select at least one language'),
});
type FormData = z.infer<typeof schema>;

const OCR_LANGUAGES: { code: string; label: string }[] = [
  { code: 'eng', label: 'English' },
  { code: 'fra', label: 'French' },
  { code: 'bul', label: 'Bulgarian' },
  { code: 'nld', label: 'Dutch' },
  { code: 'deu', label: 'German' },
  { code: 'ita', label: 'Italian' },
  { code: 'spa', label: 'Spanish' },
  { code: 'pol', label: 'Polish' },
  { code: 'por', label: 'Portuguese' },
  { code: 'ron', label: 'Romanian' },
  { code: 'swe', label: 'Swedish' },
  { code: 'ces', label: 'Czech' },
  { code: 'hun', label: 'Hungarian' },
  { code: 'slk', label: 'Slovak' },
  { code: 'hrv', label: 'Croatian' },
  { code: 'dan', label: 'Danish' },
  { code: 'fin', label: 'Finnish' },
  { code: 'ell', label: 'Greek' },
  { code: 'lav', label: 'Latvian' },
  { code: 'lit', label: 'Lithuanian' },
  { code: 'slv', label: 'Slovenian' },
  { code: 'est', label: 'Estonian' },
  { code: 'mlt', label: 'Maltese' },
  { code: 'gle', label: 'Irish' },
];

const DOC_ORG_OPTIONS: { value: FormData['doc_organization_by']; label: string }[] = [
  { value: 'shipment', label: 'Shipment' },
  { value: 'client', label: 'Client' },
  { value: 'lane', label: 'Lane' },
  { value: 'date', label: 'Date' },
];

export function OrgSettingsPage() {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: queryKeys.orgSettings,
    queryFn: () => orgSettingsApi.get().then((r) => r.data),
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { ocr_languages: ['eng'] } });

  useEffect(() => {
    if (settings) {
      reset({
        weight_qty_tolerance_pct: settings.weight_qty_tolerance_pct,
        value_tolerance_pct: settings.value_tolerance_pct,
        name_match_threshold_pct: Math.round(settings.name_match_threshold * 100),
        doc_organization_by: settings.doc_organization_by ?? 'shipment',
        auto_fix_threshold_pct: Math.round((settings.auto_fix_threshold ?? 0.95) * 100),
        email_critical_alerts: settings.email_critical_alerts ?? true,
        ocr_languages: settings.ocr_languages ? settings.ocr_languages.split(',').map((s) => s.trim()) : ['eng'],
      });
    }
  }, [settings, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      orgSettingsApi.update({
        weight_qty_tolerance_pct: data.weight_qty_tolerance_pct,
        value_tolerance_pct: data.value_tolerance_pct,
        name_match_threshold: data.name_match_threshold_pct / 100,
        doc_organization_by: data.doc_organization_by,
        auto_fix_threshold: data.auto_fix_threshold_pct / 100,
        email_critical_alerts: data.email_critical_alerts,
        ocr_languages: data.ocr_languages.join(','),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orgSettings });
      toast.success('Settings saved');
    },
    onError: (e: AxiosError<{ detail?: string }>) => {
      toast.error(e.response?.data?.detail ?? 'Save failed.');
    },
  });

  if (user?.role !== 'admin') {
    return (
      <div className="mt-20 text-center">
        <p className="text-lg font-semibold">403 — You don&apos;t have permission</p>
        <p className="mt-1 text-sm text-muted-foreground">This page is only accessible to admins.</p>
      </div>
    );
  }

  if (isLoading) return <Spinner size="lg" className="mt-20" />;

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Organisation Settings</h1>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        {/* Tolerance Settings */}
        <div className="rounded-xl border bg-background p-6 space-y-5">
          <div>
            <h2 className="font-semibold">Tolerance Settings</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These thresholds control when mismatches are flagged. Zero-tolerance fields (HS Code,
              Origin, Currency, Incoterm) are always flagged on any difference.
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="weight_qty">Weight &amp; Quantity Tolerance (%)</Label>
            <Input
              id="weight_qty"
              type="number"
              step="0.1"
              min="0"
              max="100"
              {...register('weight_qty_tolerance_pct')}
            />
            {errors.weight_qty_tolerance_pct && (
              <p className="text-xs text-destructive">{errors.weight_qty_tolerance_pct.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="value_tol">Invoice Value Tolerance (%)</Label>
            <Input
              id="value_tol"
              type="number"
              step="0.1"
              min="0"
              max="100"
              {...register('value_tolerance_pct')}
            />
            {errors.value_tolerance_pct && (
              <p className="text-xs text-destructive">{errors.value_tolerance_pct.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="name_match">Party Name Match Threshold (%)</Label>
            <Input
              id="name_match"
              type="number"
              step="1"
              min="0"
              max="100"
              {...register('name_match_threshold_pct')}
            />
            <p className="text-xs text-muted-foreground">
              Stored as a fraction (0–1). Display and edit as a percentage.
            </p>
            {errors.name_match_threshold_pct && (
              <p className="text-xs text-destructive">{errors.name_match_threshold_pct.message}</p>
            )}
          </div>
        </div>

        {/* Orchestration Settings */}
        <div className="rounded-xl border bg-background p-6 space-y-5">
          <div>
            <h2 className="font-semibold">Orchestration Settings</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              When auto-fix confidence exceeds the threshold, mismatches are resolved automatically.
              Set higher to require more certainty before auto-fixing.
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="doc_org">Organise documents by</Label>
            <select
              id="doc_org"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
              {...register('doc_organization_by')}
            >
              {DOC_ORG_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.doc_organization_by && (
              <p className="text-xs text-destructive">{errors.doc_organization_by.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="auto_fix">Auto-fix confidence threshold (%)</Label>
            <Input
              id="auto_fix"
              type="number"
              step="1"
              min="50"
              max="100"
              {...register('auto_fix_threshold_pct')}
            />
            <p className="text-xs text-muted-foreground">
              Range: 50–100%. Stored as 0.0–1.0. Default: 95%.
            </p>
            {errors.auto_fix_threshold_pct && (
              <p className="text-xs text-destructive">{errors.auto_fix_threshold_pct.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email_alerts">Email me for critical trade events</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sends emails for articles with impact score ≥ 4.
              </p>
            </div>
            <Controller
              name="email_critical_alerts"
              control={control}
              render={({ field }) => (
                <Switch
                  id="email_alerts"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        </div>

        {/* OCR Language Settings */}
        <div className="rounded-xl border bg-background p-6 space-y-4">
          <div className="flex items-start gap-2">
            <Languages className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <div>
              <h2 className="font-semibold">OCR Languages</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Select the languages present in your documents. English is always active.
              </p>
            </div>
          </div>
          <Controller
            name="ocr_languages"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {OCR_LANGUAGES.map(({ code, label }) => {
                  const checked = field.value?.includes(code) ?? false;
                  const isEnglish = code === 'eng';
                  return (
                    <label
                      key={code}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
                        checked ? 'border-blue-300 bg-blue-50 text-blue-800' : 'hover:bg-slate-50'
                      } ${isEnglish ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={isEnglish}
                        onChange={(e) => {
                          if (isEnglish) return;
                          const next = e.target.checked
                            ? [...(field.value ?? []), code]
                            : (field.value ?? []).filter((c) => c !== code);
                          field.onChange(next);
                        }}
                        className="h-3.5 w-3.5 accent-blue-600"
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            )}
          />
          {errors.ocr_languages && (
            <p className="text-xs text-destructive">{errors.ocr_languages.message}</p>
          )}
        </div>

        <Button type="submit" disabled={mutation.isPending || !isDirty}>
          {mutation.isPending ? 'Saving…' : 'Save Settings'}
        </Button>
      </form>

      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <p className="text-sm text-blue-800">
          The following fields are always flagged on any difference, regardless of tolerance settings:{' '}
          <strong>HS Code</strong>, <strong>Country of Origin</strong>, <strong>Currency</strong>,{' '}
          <strong>Incoterm</strong>.
        </p>
      </div>
    </div>
  );
}
