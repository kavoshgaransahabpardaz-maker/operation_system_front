import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fieldsApi } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { FIELD_NAME_LABELS } from '@/lib/constants';
import type { ExtractedField } from '@/types';
import type { AxiosError } from 'axios';

interface Props {
  field: ExtractedField | null;
  onClose: () => void;
  invalidateKey: readonly unknown[];
}

export function CorrectFieldDialog({ field, onClose, invalidateKey }: Props) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState('');

  const mutation = useMutation({
    mutationFn: () => fieldsApi.correct(field!.id, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateKey });
      toast.success('Field corrected');
      onClose();
      setValue('');
    },
    onError: (e: AxiosError<{ detail?: string }>) => {
      toast.error(e.response?.data?.detail ?? 'Correction failed.');
    },
  });

  return (
    <Dialog open={!!field} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Correct Field</DialogTitle>
        </DialogHeader>

        {field && (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Field</Label>
              <p className="text-sm font-medium">{FIELD_NAME_LABELS[field.field_name]}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Original value</Label>
              <p className="font-mono text-sm">{field.value_normalized ?? field.value_raw}</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="corrected-value">Corrected value</Label>
              <Input
                id="corrected-value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter correct value…"
                autoFocus
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!value.trim() || mutation.isPending}
          >
            {mutation.isPending ? 'Saving…' : 'Save Correction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
