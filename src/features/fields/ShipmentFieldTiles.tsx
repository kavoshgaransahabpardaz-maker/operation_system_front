import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { fieldsApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/shared/Spinner';
import { FIELD_NAME_LABELS } from '@/lib/constants';
import { formatValue } from './fieldFormatting';
import type { ExtractedField, FieldMismatch, FieldName, DocumentSummary, ShipmentMismatchOut } from '@/types';

const FIELD_CATEGORIES: { label: string; fields: string[] }[] = [
  {
    label: 'PARTIES',
    fields: [
      'party_shipper', 'party_consignee', 'vat_number_seller', 'vat_number_buyer',
      'eori_number', 'rex_number_seller', 'rex_number_buyer',
    ],
  },
  {
    label: 'GOODS',
    fields: [
      'commodity_description', 'hs_code', 'quantity', 'total_packages',
      'lot_number', 'product_registration_number',
    ],
  },
  {
    label: 'VALUES',
    fields: [
      'invoice_value', 'currency', 'gross_weight', 'net_weight',
      'invoice_date', 'vat_value', 'freight_value', 'insurance_value',
    ],
  },
  {
    label: 'LOGISTICS',
    fields: [
      'incoterm', 'stated_origin', 'destination_country', 'place_of_loading',
      'port_of_discharge', 'shipment_date', 'reference', 'local_reference',
    ],
  },
];

interface FieldGroupData {
  field_name: string;
  label: string;
  fields: ExtractedField[];
  bestValue: string;
  hasConflict: boolean;
  mismatchSeverity: 'error' | 'warning' | null;
  minConfidence: number;
  allReviewed: boolean;
}

function getBestValue(fields: ExtractedField[]): string {
  const corrected = fields.find((f) => f.corrected_value);
  if (corrected) return formatValue(corrected.corrected_value!, corrected.field_type);
  const reviewed = fields.find((f) => f.status === 'confirmed' || f.status === 'corrected');
  const source = reviewed ?? fields[0];
  return formatValue(source.value_normalized ?? source.value_raw, source.field_type);
}

function FieldTile({ group, onClick }: { group: FieldGroupData; onClick: () => void }) {
  const isError = group.mismatchSeverity === 'error';
  const isWarning = group.mismatchSeverity === 'warning' || (group.hasConflict && !group.mismatchSeverity);
  const isLowConf = !group.hasConflict && group.minConfidence < 0.7;
  const isReviewed = group.allReviewed && !group.hasConflict;

  let cardCls = 'border rounded-xl p-3.5 flex flex-col gap-1.5 cursor-pointer transition-all hover:shadow-sm select-none ';
  let labelCls = 'text-[10.5px] font-semibold tracking-wide ';
  let valueCls = 'font-mono text-[13px] font-semibold break-words leading-snug ';

  if (isError) {
    cardCls += 'border-red-300 bg-red-50 ring-1 ring-red-200/50';
    labelCls += 'text-red-500';
    valueCls += 'text-red-800';
  } else if (isWarning) {
    cardCls += 'border-amber-300 bg-amber-50 ring-1 ring-amber-200/50';
    labelCls += 'text-amber-600';
    valueCls += 'text-amber-900';
  } else if (isLowConf) {
    cardCls += 'border-dashed border-slate-300 bg-slate-50';
    labelCls += 'text-slate-500';
    valueCls += 'text-slate-700';
  } else if (isReviewed) {
    cardCls += 'border-green-200 bg-green-50/70';
    labelCls += 'text-green-600';
    valueCls += 'text-green-900';
  } else {
    cardCls += 'border-border bg-background';
    labelCls += 'text-muted-foreground';
    valueCls += 'text-foreground';
  }

  const suffix =
    isError || isWarning
      ? ` · ${group.fields.length} values`
      : isLowConf
      ? ` · ${Math.round(group.minConfidence * 100)}%`
      : isReviewed
      ? ' · ✓'
      : '';

  const displayValue = group.hasConflict
    ? [
        ...new Set(
          group.fields.map((f) => f.corrected_value ?? f.value_normalized ?? f.value_raw),
        ),
      ]
        .slice(0, 2)
        .join(' · ')
    : group.bestValue || '—';

  return (
    <div onClick={onClick} className={cardCls}>
      <span className={labelCls}>
        {group.label}
        {suffix}
      </span>
      <span className={valueCls}>{displayValue}</span>
    </div>
  );
}

function FieldSidePanel({
  fieldName,
  fields,
  mismatch,
  documents,
  shipmentId,
  onClose,
}: {
  fieldName: string;
  fields: ExtractedField[];
  mismatch: FieldMismatch | undefined;
  documents: DocumentSummary[];
  shipmentId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [customValue, setCustomValue] = useState('');
  const [isPending, setIsPending] = useState(false);

  const uniqueValues = new Set(
    fields.map((f) => f.corrected_value ?? f.value_normalized ?? f.value_raw),
  );
  const hasConflict = uniqueValues.size > 1;
  const minConf = fields.length > 0 ? Math.min(...fields.map((f) => f.confidence)) : 1;
  const label = FIELD_NAME_LABELS[fieldName as FieldName] ?? fieldName;

  const kicker =
    mismatch?.severity === 'error'
      ? '⚠ MISMATCH — CRITICAL'
      : mismatch?.severity === 'warning'
      ? '⚠ MISMATCH'
      : hasConflict
      ? '⚠ CONFLICT'
      : minConf < 0.7
      ? `? LOW CONFIDENCE — ${Math.round(minConf * 100)}%`
      : fields.every((f) => f.status !== 'extracted')
      ? '✓ REVIEWED'
      : 'EXTRACTED';

  const kickerCls =
    mismatch?.severity === 'error' || (hasConflict && !mismatch)
      ? 'text-red-600'
      : mismatch?.severity === 'warning'
      ? 'text-amber-600'
      : minConf < 0.7
      ? 'text-slate-500'
      : fields.every((f) => f.status !== 'extracted')
      ? 'text-green-600'
      : 'text-muted-foreground';

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: queryKeys.shipmentFields(shipmentId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.shipmentMismatches(shipmentId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.shipmentDetail(shipmentId) });
  }

  async function chooseValue(chosenField: ExtractedField) {
    if (isPending) return;
    setIsPending(true);
    try {
      const val = chosenField.corrected_value ?? chosenField.value_normalized ?? chosenField.value_raw;
      await fieldsApi.confirm(chosenField.id);
      await Promise.all(
        fields.filter((f) => f.id !== chosenField.id).map((f) => fieldsApi.correct(f.id, val)),
      );
      invalidate();
      toast.success('Field resolved');
      onClose();
    } catch {
      toast.error('Could not resolve field.');
    } finally {
      setIsPending(false);
    }
  }

  async function confirmSingle(fieldId: string) {
    if (isPending) return;
    setIsPending(true);
    try {
      await fieldsApi.confirm(fieldId);
      invalidate();
      toast.success('Field confirmed');
      onClose();
    } catch {
      toast.error('Could not confirm field.');
    } finally {
      setIsPending(false);
    }
  }

  async function useCustomValue() {
    if (!customValue.trim() || isPending) return;
    setIsPending(true);
    try {
      await Promise.all(fields.map((f) => fieldsApi.correct(f.id, customValue.trim())));
      invalidate();
      toast.success('Field corrected');
      onClose();
    } catch {
      toast.error('Could not correct field.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex items-start justify-between gap-3 p-6 border-b border-border">
        <div className="flex flex-col gap-0.5">
          <p className={`font-mono text-[10px] tracking-widest font-bold ${kickerCls}`}>{kicker}</p>
          <h2 className="text-lg font-bold">{label}</h2>
        </div>
        <button
          onClick={onClose}
          className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-3 p-6">
        {fields.map((field) => {
          const doc = documents.find((d) => d.id === field.document_id);
          const docName = doc?.filename ?? `…${field.document_id.slice(-8)}`;
          const displayVal = formatValue(
            field.corrected_value ?? field.value_normalized ?? field.value_raw,
            field.field_type,
          );
          const isReviewed = field.status !== 'extracted';

          return (
            <div
              key={field.id}
              className={`rounded-xl border p-4 flex flex-col gap-2.5 ${
                isReviewed && !hasConflict ? 'border-green-200 bg-green-50/60' : 'border-border'
              }`}
            >
              <p className="text-[10.5px] text-muted-foreground font-medium truncate" title={docName}>
                {docName}
              </p>
              <p className="font-mono text-base font-semibold">{displayVal}</p>
              <p className="text-[10.5px] text-muted-foreground">
                {Math.round(field.confidence * 100)}% confidence
                {field.page_number != null ? ` · p.${field.page_number}` : ''}
                {isReviewed ? ` · ${field.status}` : ''}
              </p>
              <div className="flex gap-2 flex-wrap">
                {hasConflict && (
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => chooseValue(field)}
                    disabled={isPending}
                  >
                    Use this value
                  </Button>
                )}
                {!hasConflict && !isReviewed && (
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => confirmSingle(field.id)}
                    disabled={isPending}
                  >
                    ✓ Confirm
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        <div className="mt-1 flex flex-col gap-2">
          <p className="text-[10.5px] text-muted-foreground">Or type a custom value:</p>
          <div className="flex gap-2">
            <Input
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder="Custom value…"
              className="font-mono text-sm h-8"
              onKeyDown={(e) => {
                if (e.key === 'Enter') useCustomValue();
              }}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs shrink-0"
              onClick={useCustomValue}
              disabled={!customValue.trim() || isPending}
            >
              Use
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-border p-5">
        <p className="text-[10.5px] text-muted-foreground">
          Your choice is written to the audit trail and cannot be auto-overwritten.
        </p>
      </div>
    </div>
  );
}

export function ShipmentFieldTiles({
  shipmentId,
  documents,
  mismatches,
}: {
  shipmentId: string;
  documents: DocumentSummary[];
  mismatches: ShipmentMismatchOut | undefined;
}) {
  const [panelField, setPanelField] = useState<string | null>(null);

  const { data: fields, isLoading } = useQuery({
    queryKey: queryKeys.shipmentFields(shipmentId),
    queryFn: () => fieldsApi.listByShipment(shipmentId).then((r) => r.data),
  });

  const mismatchMap = useMemo(() => {
    const map = new Map<string, FieldMismatch>();
    for (const m of mismatches?.mismatches ?? []) {
      map.set(m.field_name, m);
    }
    return map;
  }, [mismatches]);

  const fieldsByName = useMemo(() => {
    const map = new Map<string, ExtractedField[]>();
    for (const f of fields ?? []) {
      const arr = map.get(f.field_name) ?? [];
      arr.push(f);
      map.set(f.field_name, arr);
    }
    return map;
  }, [fields]);

  const categories = useMemo(() => {
    return FIELD_CATEGORIES.map((cat) => ({
      label: cat.label,
      groups: cat.fields
        .map((fn): FieldGroupData | null => {
          const flds = fieldsByName.get(fn);
          if (!flds?.length) return null;
          const mismatch = mismatchMap.get(fn);
          const uniqueVals = new Set(
            flds.map((f) => f.corrected_value ?? f.value_normalized ?? f.value_raw),
          );
          return {
            field_name: fn,
            label: FIELD_NAME_LABELS[fn as FieldName] ?? fn,
            fields: flds,
            bestValue: getBestValue(flds),
            hasConflict: uniqueVals.size > 1,
            mismatchSeverity: mismatch?.severity ?? null,
            minConfidence: Math.min(...flds.map((f) => f.confidence)),
            allReviewed: flds.every((f) => f.status !== 'extracted'),
          };
        })
        .filter((g): g is FieldGroupData => g !== null),
    })).filter((c) => c.groups.length > 0);
  }, [fieldsByName, mismatchMap]);

  if (isLoading) {
    return (
      <div className="py-4">
        <Spinner size="sm" className="mx-auto" />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No fields extracted yet — fields appear after documents are classified.
      </p>
    );
  }

  const panelFields = panelField ? (fieldsByName.get(panelField) ?? []) : [];
  const panelMismatch = panelField ? mismatchMap.get(panelField) : undefined;

  return (
    <>
      <div className="flex flex-col gap-6">
        {categories.map((cat) => (
          <div key={cat.label} className="flex flex-col gap-3">
            <p className="font-mono text-[10.5px] tracking-widest font-bold text-muted-foreground">
              {cat.label}
            </p>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5">
              {cat.groups.map((group) => (
                <FieldTile
                  key={group.field_name}
                  group={group}
                  onClick={() => setPanelField(group.field_name)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {panelField && (
        <div
          className="fixed inset-0 bg-black/15 z-40"
          onClick={() => setPanelField(null)}
        />
      )}

      <div
        className={`fixed top-0 right-0 bottom-0 w-80 bg-background border-l border-border shadow-2xl z-50 transition-transform duration-200 ${
          panelField ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {panelField && (
          <FieldSidePanel
            fieldName={panelField}
            fields={panelFields}
            mismatch={panelMismatch}
            documents={documents}
            shipmentId={shipmentId}
            onClose={() => setPanelField(null)}
          />
        )}
      </div>
    </>
  );
}
