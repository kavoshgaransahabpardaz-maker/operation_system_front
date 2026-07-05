import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Lightbulb } from 'lucide-react';
import { flagsApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Flag, FlagDecision } from '@/types';
import type { AxiosError } from 'axios';

interface Props {
  flag: Flag | null;
  onClose: () => void;
}

const DECISIONS: { value: FlagDecision; label: string }[] = [
  { value: 'accepted', label: 'Accept as-is' },
  { value: 'overridden', label: 'Override with value' },
  { value: 'dismissed', label: 'Dismiss' },
];

export function ResolveFlagDialog({ flag, onClose }: Props) {
  const queryClient = useQueryClient();
  const [decision, setDecision] = useState<FlagDecision>('accepted');
  const [chosenValue, setChosenValue] = useState('');
  const [note, setNote] = useState('');

  // Load suggestions only when the dialog is open and decision is override
  const { data: suggestions } = useQuery({
    queryKey: queryKeys.flagSuggestions(flag?.id ?? ''),
    queryFn: () => flagsApi.suggestions(flag!.id).then((r) => r.data),
    enabled: !!flag?.id && decision === 'overridden',
  });

  const mutation = useMutation({
    mutationFn: () =>
      flagsApi.resolve(flag!.id, {
        decision,
        chosen_value: decision === 'overridden' ? chosenValue : undefined,
        note: note || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipmentFlags(flag!.shipment_id) });
      toast.success('Flag resolved');
      onClose();
    },
    onError: (e: AxiosError<{ detail?: string }>) => {
      toast.error(e.response?.data?.detail ?? 'Failed to resolve flag.');
    },
  });

  return (
    <Dialog open={!!flag} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Resolve Issue</DialogTitle>
        </DialogHeader>

        {flag && (
          <div className="space-y-4">
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium">{flag.title}</p>
              <p className="text-muted-foreground">{flag.description}</p>
            </div>

            {flag.conflicting_values && flag.conflicting_values.length > 0 && (
              <div className="text-sm space-y-1">
                <p className="font-medium text-muted-foreground text-xs">Conflicting values:</p>
                {flag.conflicting_values.map((cv, i) => (
                  <p key={i} className="font-mono text-xs">{cv.value_raw}</p>
                ))}
              </div>
            )}

            <div className="space-y-1">
              <Label>Decision</Label>
              <Select value={decision} onValueChange={(v) => setDecision(v as FlagDecision)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DECISIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {decision === 'overridden' && (
              <div className="space-y-1">
                <Label htmlFor="chosen-value">Correct value</Label>
                <Input
                  id="chosen-value"
                  value={chosenValue}
                  onChange={(e) => setChosenValue(e.target.value)}
                  placeholder="Enter the correct value…"
                />

                {/* Suggestions — pre-fill only, never auto-applied */}
                {suggestions && suggestions.length > 0 && (
                  <div className="mt-2 rounded-lg border bg-amber-50 p-3 text-xs">
                    <div className="flex items-center gap-1.5 mb-2 text-amber-700 font-semibold">
                      <Lightbulb className="h-3.5 w-3.5" />
                      Suggestions — click to pre-fill, then confirm
                    </div>
                    <div className="space-y-2">
                      {suggestions.map((s, i) => (
                        <div key={i} className="rounded border border-amber-200 bg-white p-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-mono text-xs font-semibold text-slate-900 truncate">
                                {s.suggested_value}
                              </p>
                              <p className="mt-0.5 text-[11px] text-slate-500 leading-snug">
                                {s.rationale}
                              </p>
                              {s.cited_document_ids.length > 0 && (
                                <p className="mt-0.5 text-[11px] text-slate-400">
                                  {s.cited_document_ids.length} source{s.cited_document_ids.length !== 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 shrink-0 text-xs px-2"
                              onClick={() => setChosenValue(s.suggested_value)}
                            >
                              Use
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note…"
                rows={2}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || (decision === 'overridden' && !chosenValue)}
          >
            {mutation.isPending ? 'Saving…' : 'Resolve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
