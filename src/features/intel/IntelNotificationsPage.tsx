import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Bell } from 'lucide-react';
import { intelApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared/Spinner';
import { INTEL_EVENT_TYPE_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { IntelEventType, NotificationPreference } from '@/types';
import type { AxiosError } from 'axios';

const ALL_EVENT_TYPES: IntelEventType[] = [
  'tariff_change', 'sanctions', 'regulation', 'trade_agreement', 'market_notice', 'other',
];

export function IntelNotificationsPage() {
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

  const mutation = useMutation({
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

  function toggleEventType(t: IntelEventType) {
    setEventTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }


  if (isLoading) return <Spinner size="lg" className="mt-20" />;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h2 className="text-sm font-semibold">Notification Preferences</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Control when and how you receive trade intelligence alerts.
        </p>
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
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Informational</span>
            <span>Immediate action</span>
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
          {eventTypes.length > 0 && (
            <button className="text-xs text-blue-600 hover:underline" onClick={() => setEventTypes([])}>
              Clear (receive all types)
            </button>
          )}
        </div>

        {/* Channels — email only (in_app removed) */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Delivery channels</p>
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

        <Button
          className="w-full gap-2"
          onClick={() => mutation.mutate({ min_impact_score: minImpact, event_types: eventTypes, delivery_channels: emailEnabled ? ['email'] : [], is_active: isActive })}
          disabled={mutation.isPending}
        >
          <Bell className="h-4 w-4" />
          {mutation.isPending ? 'Saving…' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}
