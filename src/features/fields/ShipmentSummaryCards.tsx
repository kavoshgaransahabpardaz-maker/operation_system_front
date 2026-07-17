import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';
import { fieldsApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/shared/Spinner';
import { formatValue } from './fieldFormatting';
import type { ExtractedField, FieldMismatch, DocumentSummary, ShipmentMismatchOut } from '@/types';

// ── Card definitions ────────────────────────────────────────────────────────

const CARDS = [
  {
    id: 'origin',
    label: 'ORIGIN, DESTINATION & PARTIES',
    fields: [
      { name: 'stated_origin', label: 'Country of Origin' },
      { name: 'destination_country', label: 'Country of Destination' },
      { name: 'place_of_loading', label: 'Place of Loading' },
      { name: 'port_of_discharge', label: 'Port of Discharge' },
      { name: 'incoterm', label: 'Incoterm' },
      { name: 'party_shipper', label: 'Consignor (Seller)' },
      { name: 'vat_number_seller', label: 'Seller VAT / EIK' },
      { name: 'eori_number', label: 'EORI Number' },
      { name: 'party_consignee', label: 'Consignee (Buyer)' },
      { name: 'vat_number_buyer', label: 'Buyer VAT Number' },
    ],
  },
  {
    id: 'logistics',
    label: 'LOGISTICS / VALUES',
    fields: [
      { name: 'reference', label: 'Invoice / Reference No.' },
      { name: 'invoice_date', label: 'Invoice Date' },
      { name: 'shipment_date', label: 'Shipment Date' },
      { name: 'currency', label: 'Currency' },
      { name: 'invoice_value', label: 'Invoice Total' },
      { name: 'freight_value', label: 'Freight Value' },
      { name: 'insurance_value', label: 'Insurance Value' },
      { name: 'gross_weight', label: 'Gross Weight' },
      { name: 'net_weight', label: 'Net Weight' },
      { name: 'total_packages', label: 'Total Packages' },
    ],
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function abbrev(filename: string, max = 20): string {
  if (filename.length <= max) return filename;
  const dot = filename.lastIndexOf('.');
  const ext = dot > 0 ? filename.slice(dot) : '';
  const name = dot > 0 ? filename.slice(0, dot) : filename;
  return name.slice(0, max - ext.length - 1) + '…' + ext;
}

function getBestField(fields: ExtractedField[]): ExtractedField | null {
  if (!fields.length) return null;
  const corrected = fields.find((f) => f.corrected_value);
  if (corrected) return corrected;
  const confirmed = fields.find((f) => f.status === 'confirmed');
  if (confirmed) return confirmed;
  return fields.reduce((best, f) => (f.confidence > best.confidence ? f : best), fields[0]);
}

function ConfidenceDot({ confidence }: { confidence: number }) {
  const cls =
    confidence >= 0.85
      ? 'bg-green-500'
      : confidence >= 0.7
      ? 'bg-amber-500'
      : 'bg-red-500';
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${cls} shrink-0`} />;
}

// ── Field row ───────────────────────────────────────────────────────────────

function FieldRow({
  fieldName,
  label,
  fieldsByName,
  mismatch,
  documents,
  onResolve,
}: {
  fieldName: string;
  label: string;
  fieldsByName: Map<string, ExtractedField[]>;
  mismatch: FieldMismatch | undefined;
  documents: DocumentSummary[];
  onResolve: (fieldName: string) => void;
}) {
  const fields = fieldsByName.get(fieldName) ?? [];

  if (fields.length === 0) {
    return (
      <div className="py-2.5 border-b border-border last:border-b-0">
        <p className="text-[10px] text-muted-foreground/70 mb-0.5">{label}</p>
        <p className="text-[13px] text-muted-foreground/40 font-mono">—</p>
      </div>
    );
  }

  // Conflict row
  if (mismatch) {
    const isErr = mismatch.severity === 'error';
    return (
      <div
        className={`py-2.5 border-b border-border last:border-b-0 -mx-5 px-5 ${
          isErr ? 'bg-red-50/70' : 'bg-amber-50/70'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className={`text-[10px] font-bold ${isErr ? 'text-red-600' : 'text-amber-600'}`}>
            {label}
          </p>
          <Button
            size="sm"
            variant="outline"
            className={`h-5 text-[9.5px] px-2 py-0 shrink-0 ${
              isErr
                ? 'border-red-300 text-red-700 hover:bg-red-100'
                : 'border-amber-300 text-amber-700 hover:bg-amber-100'
            }`}
            onClick={() => onResolve(fieldName)}
          >
            Resolve
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {mismatch.values.map((v) => {
            const doc = documents.find((d) => d.id === v.document_id);
            const docLabel = doc ? abbrev(doc.filename, 14) : v.document_id.slice(0, 8);
            const val = formatValue(v.value_normalized ?? v.value_raw, null);
            return (
              <span
                key={v.document_id}
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-mono leading-none ${
                  isErr ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                <span className="text-[9px] opacity-60">{docLabel}:</span>
                <span className="font-semibold">{val}</span>
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  // Normal row
  const best = getBestField(fields);
  if (!best) return null;

  const displayVal = formatValue(
    best.corrected_value ?? best.value_normalized ?? best.value_raw,
    best.field_type,
  );
  const doc = documents.find((d) => d.id === best.document_id);
  const isCorrectd = best.status === 'corrected';

  return (
    <div className="py-2.5 border-b border-border last:border-b-0">
      <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
      <div className="flex items-center gap-2 flex-wrap min-w-0">
        <span
          className={`font-mono text-[13px] font-semibold break-all leading-snug ${
            isCorrectd ? 'text-green-700' : ''
          }`}
        >
          {displayVal}
        </span>
        <ConfidenceDot confidence={best.confidence} />
        {doc && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground shrink-0">
            {abbrev(doc.filename, 14)}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({
  card,
  fieldsByName,
  mismatchMap,
  documents,
  canConflict,
  onResolve,
}: {
  card: (typeof CARDS)[number];
  fieldsByName: Map<string, ExtractedField[]>;
  mismatchMap: Map<string, FieldMismatch>;
  documents: DocumentSummary[];
  canConflict: boolean;
  onResolve: (fieldName: string) => void;
}) {
  const hasAnyData = card.fields.some((f) => fieldsByName.has(f.name));

  return (
    <div className="rounded-xl border border-border bg-background p-5 flex flex-col min-h-0">
      <p className="font-mono text-[10px] tracking-widest font-bold text-muted-foreground mb-3">
        {card.label}
      </p>
      {!hasAnyData ? (
        <p className="text-[12px] text-muted-foreground/60 italic">No data extracted yet.</p>
      ) : (
        <div>
          {card.fields.map((f) => (
            <FieldRow
              key={f.name}
              fieldName={f.name}
              label={f.label}
              fieldsByName={fieldsByName}
              mismatch={canConflict ? mismatchMap.get(f.name) : undefined}
              documents={documents}
              onResolve={onResolve}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Resolve side panel ───────────────────────────────────────────────────────

function ResolveSidePanel({
  label,
  fields,
  mismatch,
  documents,
  shipmentId,
  onClose,
}: {
  label: string;
  fields: ExtractedField[];
  mismatch: FieldMismatch | undefined;
  documents: DocumentSummary[];
  shipmentId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [customValue, setCustomValue] = useState('');
  const [isPending, setIsPending] = useState(false);

  const uniqueVals = new Set(
    fields.map((f) => f.corrected_value ?? f.value_normalized ?? f.value_raw),
  );
  const hasConflict = uniqueVals.size > 1;
  const minConf = fields.length ? Math.min(...fields.map((f) => f.confidence)) : 1;

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
      const val =
        chosenField.corrected_value ?? chosenField.value_normalized ?? chosenField.value_raw;
      await fieldsApi.confirm(chosenField.id);
      await Promise.all(
        fields
          .filter((f) => f.id !== chosenField.id)
          .map((f) => fieldsApi.correct(f.id, val)),
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
        <div>
          <p className={`font-mono text-[10px] tracking-widest font-bold ${kickerCls}`}>
            {kicker}
          </p>
          <h2 className="text-lg font-bold mt-0.5">{label}</h2>
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

          return (
            <div
              key={field.id}
              className={`rounded-xl border p-4 flex flex-col gap-2 ${
                field.status !== 'extracted' && !hasConflict
                  ? 'border-green-200 bg-green-50/60'
                  : 'border-border'
              }`}
            >
              <p className="text-[10.5px] text-muted-foreground font-medium truncate" title={docName}>
                {docName}
              </p>
              <p className="font-mono text-base font-semibold">{displayVal}</p>
              <p className="text-[10.5px] text-muted-foreground">
                {Math.round(field.confidence * 100)}% confidence
                {field.page_number != null ? ` · p.${field.page_number}` : ''}
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
                {!hasConflict && field.status === 'extracted' && (
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

        <div className="flex flex-col gap-2 mt-1">
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
          Your choice is written to the audit trail.
        </p>
      </div>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

export function ShipmentSummaryCards({
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

  const fieldsByName = useMemo(() => {
    const map = new Map<string, ExtractedField[]>();
    for (const f of fields ?? []) {
      const arr = map.get(f.field_name) ?? [];
      arr.push(f);
      map.set(f.field_name, arr);
    }
    return map;
  }, [fields]);

  const mismatchMap = useMemo(() => {
    const map = new Map<string, FieldMismatch>();
    for (const m of mismatches?.mismatches ?? []) {
      map.set(m.field_name, m);
    }
    return map;
  }, [mismatches]);

  const canConflict = documents.length >= 2;

  const totalConflicts = canConflict
    ? (mismatches?.mismatches.length ?? 0) +
      (mismatches?.product_mismatches.length ?? 0) +
      (mismatches?.unmatched_products.length ?? 0)
    : 0;

  // Resolve the label for the panel field
  const panelLabel = panelField
    ? CARDS.flatMap((c) => c.fields).find((f) => f.name === panelField)?.label ?? panelField
    : '';
  const panelFields = panelField ? (fieldsByName.get(panelField) ?? []) : [];
  const panelMismatch = panelField ? mismatchMap.get(panelField) : undefined;

  if (isLoading) {
    return (
      <div className="py-6">
        <Spinner size="sm" className="mx-auto" />
      </div>
    );
  }

  const hasAnyField = CARDS.some((c) => c.fields.some((f) => fieldsByName.has(f.name)));

  if (!hasAnyField) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No fields extracted yet — fields appear after documents are classified.
      </p>
    );
  }

  return (
    <>
      {/* Conflict summary chip */}
      {totalConflicts > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-sm font-medium text-amber-800">
            {totalConflicts} conflict{totalConflicts !== 1 ? 's' : ''} detected — resolve before
            confirming the database
          </span>
        </div>
      )}

      {/* 2 summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CARDS.map((card) => (
          <SummaryCard
            key={card.id}
            card={card}
            fieldsByName={fieldsByName}
            mismatchMap={mismatchMap}
            documents={documents}
            canConflict={canConflict}
            onResolve={setPanelField}
          />
        ))}
      </div>

      {/* Backdrop */}
      {panelField && (
        <div
          className="fixed inset-0 bg-black/15 z-40"
          onClick={() => setPanelField(null)}
        />
      )}

      {/* Slide-in resolve panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-80 bg-background border-l border-border shadow-2xl z-50 transition-transform duration-200 ${
          panelField ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {panelField && (
          <ResolveSidePanel
            label={panelLabel}
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
