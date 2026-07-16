import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { fieldsApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Spinner } from '@/components/shared/Spinner';
import { ConfidenceBadge } from '@/components/shared/ConfidenceBadge';
import { FieldStatusBadge } from '@/components/shared/FieldStatusBadge';
import { Button } from '@/components/ui/button';
import { FIELD_NAME_LABELS, ZERO_TOLERANCE_FIELDS } from '@/lib/constants';
import { CorrectFieldDialog } from './CorrectFieldDialog';
import { FieldValueCell } from './fieldFormatting';
import type { ExtractedField, FieldName } from '@/types';
import type { AxiosError } from 'axios';

interface Props {
  shipmentId: string;
}

interface FieldGroup {
  fieldName: string;
  fields: ExtractedField[];
  minConfidence: number;
  allReviewed: boolean;
}

function groupFields(fields: ExtractedField[]): FieldGroup[] {
  const map = new Map<string, ExtractedField[]>();
  for (const f of fields) {
    const arr = map.get(f.field_name) ?? [];
    arr.push(f);
    map.set(f.field_name, arr);
  }
  return Array.from(map.entries()).map(([fieldName, fs]) => ({
    fieldName,
    fields: fs,
    minConfidence: Math.min(...fs.map((f) => f.confidence)),
    allReviewed: fs.every((f) => f.status !== 'extracted'),
  }));
}

export function ShipmentFieldsPanel({ shipmentId }: Props) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [correcting, setCorrecting] = useState<ExtractedField | null>(null);

  const { data: fields, isLoading } = useQuery({
    queryKey: queryKeys.shipmentFields(shipmentId),
    queryFn: () => fieldsApi.listByShipment(shipmentId).then((r) => r.data),
  });

  const confirmMutation = useMutation({
    mutationFn: (fieldId: string) => fieldsApi.confirm(fieldId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipmentFields(shipmentId) });
      toast.success('Field confirmed');
    },
    onError: (e: AxiosError<{ detail?: string }>) => {
      toast.error(e.response?.data?.detail ?? 'Confirm failed.');
    },
  });

  const toggleExpand = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const groups = fields ? groupFields(fields) : [];

  return (
    <div className="rounded-xl border bg-background">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <h2 className="font-semibold">Extracted Fields</h2>
        {fields && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
            {fields.length}
          </span>
        )}
      </div>

      <div className="divide-y">
        {isLoading ? (
          <div className="p-4">
            <Spinner size="sm" className="mx-auto" />
          </div>
        ) : groups.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No fields extracted yet — fields are extracted automatically after classification.
          </p>
        ) : (
          groups.map((group) => {
            const isExpanded = expanded.has(group.fieldName);
            const values = group.fields.map((f) => f.corrected_value ?? f.value_normalized ?? f.value_raw);
            const unique = new Set(values);
            const hasMismatch = unique.size > 1;

            return (
              <div key={group.fieldName}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-sm font-medium">
                      {FIELD_NAME_LABELS[group.fieldName as FieldName] ?? group.fieldName}
                      {ZERO_TOLERANCE_FIELDS.has(group.fieldName as FieldName) && (
                        <span
                          className="text-red-500 text-xs"
                          title="Zero-tolerance field"
                        >
                          ★
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {hasMismatch ? (
                        group.fields.map((f) => (
                          <span
                            key={f.id}
                            className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs text-amber-800"
                          >
                            {f.corrected_value ?? f.value_normalized ?? f.value_raw}
                          </span>
                        ))
                      ) : (
                        <span className="font-mono text-sm">
                          {values[0]}
                        </span>
                      )}
                    </div>
                  </div>
                  <ConfidenceBadge confidence={group.minConfidence} compact />
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                      group.allReviewed
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {group.allReviewed ? 'Reviewed' : 'Needs Review'}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs px-2"
                    onClick={() => toggleExpand(group.fieldName)}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>

                {isExpanded && (
                  <div className="border-t bg-muted/30 px-4 py-3 space-y-2">
                    {group.fields.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center gap-3 rounded-md bg-background p-2 text-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/documents/${f.document_id}`}
                            className="text-xs text-primary hover:underline"
                          >
                            Document {f.document_id.slice(0, 8)}
                          </Link>
                          <p className="font-mono text-sm">
                            <FieldValueCell field={f} />
                          </p>
                        </div>
                        <ConfidenceBadge confidence={f.confidence} compact />
                        <FieldStatusBadge status={f.status} />
                        <div className="flex gap-1">
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <CorrectFieldDialog
        field={correcting}
        onClose={() => setCorrecting(null)}
        invalidateKey={queryKeys.shipmentFields(shipmentId)}
      />
    </div>
  );
}
