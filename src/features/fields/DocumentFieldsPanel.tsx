import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { fieldsApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Spinner } from '@/components/shared/Spinner';
import { ConfidenceBadge } from '@/components/shared/ConfidenceBadge';
import { FieldStatusBadge } from '@/components/shared/FieldStatusBadge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { FIELD_NAME_LABELS, ZERO_TOLERANCE_FIELDS } from '@/lib/constants';
import { CorrectFieldDialog } from './CorrectFieldDialog';
import { FieldValueCell } from './fieldFormatting';
import type { ExtractedField, FieldName } from '@/types';
import type { AxiosError } from 'axios';

interface Props {
  documentId: string;
  documentStatus: string;
  /** When true, renders content directly without the outer card container */
  bare?: boolean;
}

export function DocumentFieldsPanel({ documentId, documentStatus, bare = false }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(true);
  const [correcting, setCorrecting] = useState<ExtractedField | null>(null);

  const isPendingExtraction = documentStatus === 'classified';

  const { data: fields, isLoading } = useQuery({
    queryKey: queryKeys.documentFields(documentId),
    queryFn: () => fieldsApi.listByDocument(documentId).then((r) => r.data),
    refetchInterval: (query) =>
      isPendingExtraction && (!query.state.data || query.state.data.length === 0)
        ? 10_000
        : false,
  });

  const confirmMutation = useMutation({
    mutationFn: (fieldId: string) => fieldsApi.confirm(fieldId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documentFields(documentId) });
      toast.success('Field confirmed');
    },
    onError: (e: AxiosError<{ detail?: string }>) => {
      toast.error(e.response?.data?.detail ?? 'Confirm failed.');
    },
  });

  const inner = (
    <>
      {!bare && (
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 border-b font-semibold text-sm"
          onClick={() => setOpen((o) => !o)}
        >
          <span>Extracted Fields {fields ? `(${fields.length})` : ''}</span>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      )}

      {(open || bare) && (
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner size="sm" /> Extraction in progress…
            </div>
          ) : !fields || fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isPendingExtraction
                ? 'Fields are being extracted after classification…'
                : 'No fields extracted yet.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Page</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="text-sm font-medium">
                      <span className="flex items-center gap-1">
                        {FIELD_NAME_LABELS[f.field_name as FieldName] ?? f.field_name}
                        {ZERO_TOLERANCE_FIELDS.has(f.field_name as FieldName) && (
                          <span
                            className="text-red-500 text-xs"
                            title="Zero-tolerance field — any mismatch is critical"
                          >
                            ★
                          </span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      <FieldValueCell field={f} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {f.page_number ?? '—'}
                    </TableCell>
                    <TableCell>
                      <ConfidenceBadge confidence={f.confidence} compact />
                    </TableCell>
                    <TableCell>
                      <FieldStatusBadge status={f.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {f.status === 'extracted' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs px-2"
                            onClick={() => confirmMutation.mutate(f.id)}
                            disabled={confirmMutation.isPending}
                          >
                            Confirm
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs px-2"
                          onClick={() => setCorrecting(f)}
                        >
                          Correct
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      <CorrectFieldDialog
        field={correcting}
        onClose={() => setCorrecting(null)}
        invalidateKey={queryKeys.documentFields(documentId)}
      />
    </>
  );

  if (bare) return inner;

  return (
    <div className="rounded-xl border bg-background">
      {inner}
    </div>
  );
}
