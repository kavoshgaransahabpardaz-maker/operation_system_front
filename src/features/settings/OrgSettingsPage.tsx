import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import { toast } from 'sonner';
import { orgSettingsApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Spinner } from '@/components/shared/Spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AxiosError } from 'axios';

const schema = z.object({
  weight_qty_tolerance_pct: z.coerce.number().min(0).max(100),
  value_tolerance_pct: z.coerce.number().min(0).max(100),
  name_match_threshold_pct: z.coerce.number().min(0).max(100),
});
type FormData = z.infer<typeof schema>;

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
    formState: { errors, isDirty },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (settings) {
      reset({
        weight_qty_tolerance_pct: settings.weight_qty_tolerance_pct,
        value_tolerance_pct: settings.value_tolerance_pct,
        name_match_threshold_pct: Math.round(settings.name_match_threshold * 100),
      });
    }
  }, [settings, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      orgSettingsApi.update({
        weight_qty_tolerance_pct: data.weight_qty_tolerance_pct,
        value_tolerance_pct: data.value_tolerance_pct,
        name_match_threshold: data.name_match_threshold_pct / 100,
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

          <Button type="submit" disabled={mutation.isPending || !isDirty}>
            {mutation.isPending ? 'Saving…' : 'Save Settings'}
          </Button>
        </div>
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
