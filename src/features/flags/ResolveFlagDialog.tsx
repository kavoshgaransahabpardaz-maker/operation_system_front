import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
