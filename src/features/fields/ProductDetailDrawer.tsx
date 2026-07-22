import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X, CheckCircle2, Loader2 } from 'lucide-react';
import { classificationApi } from '@/api/classification';
import { queryKeys } from '@/lib/queryKeys';
import type { DocumentProduct, HsCandidate, HsGenieRunOut } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function confColor(level: string) {
  if (level === 'high') return { bar: 'bg-green-500', badge: 'bg-green-50 text-green-700' };
  if (level === 'medium') return { bar: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700' };
  return { bar: 'bg-red-400', badge: 'bg-red-50 text-red-600' };
}

// ── Editable field ────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const cls =
    'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground ' +
    'placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring';
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {multiline ? (
        <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </div>
  );
}

// ── Candidate card ────────────────────────────────────────────────────────────

function CandidateCard({
  candidate,
  isTop,
  isExisting,
  isChosen,
  onUse,
}: {
  candidate: HsCandidate;
  isTop: boolean;
  isExisting: boolean;
  isChosen: boolean;
  onUse: () => void;
}) {
  const col = confColor(candidate.overall_confidence_level);
  return (
    <div
      className={`flex flex-col gap-2.5 rounded-2xl border p-4 bg-paper transition-all ${
        isExisting
          ? 'border-genie-teal ring-1 ring-genie-teal/30'
          : isTop
          ? 'border-genie-gold/60'
          : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-xl font-bold text-ink leading-none">
          {candidate.hs_code}
        </span>
        <div className="flex items-center gap-1.5">
          {isExisting && (
            <span className="rounded-full bg-genie-teal-light px-2 py-0.5 text-[9.5px] font-bold text-genie-teal">
              EXISTING
            </span>
          )}
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${col.badge}`}>
            {candidate.confidence}%
          </span>
        </div>
      </div>

      <div className="h-1 w-full rounded-full bg-muted">
        <div
          className={`h-1 rounded-full ${col.bar}`}
          style={{ width: `${candidate.confidence}%` }}
        />
      </div>

      <p className="text-[11.5px] text-muted-foreground leading-relaxed line-clamp-3">
        {candidate.justification}
      </p>

      <span className="self-start rounded-full border border-genie-gold/50 bg-genie-gold-light px-2 py-0.5 font-mono text-[9.5px] text-ink/60">
        § {candidate.heading_code} · GRI {candidate.gri_rule}
      </span>

      <button
        onClick={onUse}
        disabled={isChosen}
        className={`w-full rounded-xl py-1.5 text-[11.5px] font-semibold transition-all ${
          isChosen
            ? 'bg-genie-teal text-white cursor-default'
            : 'bg-ink text-paper hover:bg-ink/80 active:scale-[0.98]'
        }`}
      >
        {isChosen ? '✓ Applied' : isExisting ? 'Confirm this code' : 'Use this code'}
      </button>
    </div>
  );
}

// ── Feedback form ─────────────────────────────────────────────────────────────

function FeedbackForm({
  candidates,
  onSubmit,
  onSkip,
}: {
  candidates: HsCandidate[];
  onSubmit: (correctCode: string, reason: string) => void;
  onSkip: () => void;
}) {
  const [code, setCode] = useState('');
  const [reason, setReason] = useState('');

  const reasons = [
    { value: 'wrong_material', label: 'Wrong material' },
    { value: 'wrong_process', label: 'Wrong process' },
    { value: 'wrong_dimension', label: 'Wrong dimension' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="mt-3 rounded-xl border border-genie-gold/40 bg-genie-gold-light/60 p-4 flex flex-col gap-3">
      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-ink/60">
        What's the correct code?
      </p>

      {candidates.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {candidates.slice(1).map((c) => (
            <button
              key={c.hs_code}
              onClick={() => setCode(c.hs_code)}
              className={`rounded-full border px-3 py-0.5 font-mono text-xs transition-all ${
                code === c.hs_code ? 'border-ink bg-ink text-paper' : 'border-genie-gold bg-paper text-ink'
              }`}
            >
              {c.hs_code}
            </button>
          ))}
        </div>
      )}

      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Type a code…"
        className="w-full rounded-lg border border-genie-gold/50 bg-paper px-3 py-1.5 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-genie-gold"
      />

      <div className="flex flex-wrap gap-1.5">
        {reasons.map((r) => (
          <button
            key={r.value}
            onClick={() => setReason(r.value)}
            className={`rounded-full border px-3 py-0.5 text-xs transition-all ${
              reason === r.value ? 'border-ink bg-ink text-paper' : 'border-genie-gold/40 bg-paper text-ink/70'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => code.trim() && onSubmit(code.trim(), reason)}
          disabled={!code.trim()}
          className="rounded-full bg-ink px-4 py-1.5 text-xs font-semibold text-paper disabled:opacity-40"
        >
          Submit correction
        </button>
        <button onClick={onSkip} className="text-xs text-muted-foreground hover:text-foreground px-2">
          Skip
        </button>
      </div>
    </div>
  );
}

// ── Classification panel (inside drawer) ──────────────────────────────────────

function ClassificationPanel({
  product,
  onProductUpdate,
}: {
  product: DocumentProduct;
  onProductUpdate: (updated: DocumentProduct) => void;
}) {
  const [run, setRun] = useState<HsGenieRunOut | null>(null);
  const [chosenCode, setChosenCode] = useState<string | null>(null);
  const [feedbackSignal, setFeedbackSignal] = useState<'thumbs_up' | 'thumbs_down' | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const queryClient = useQueryClient();

  const candidates = (run?.candidates ?? []).slice(0, 3) as HsCandidate[];

  async function runClassify(path: 'verify' | 'genie') {
    if (isClassifying) return;
    setRun(null);
    setChosenCode(null);
    setFeedbackSignal(null);
    setShowFeedbackForm(false);
    setIsClassifying(true);
    try {
      const res = path === 'verify'
        ? await classificationApi.verify(product.id)
        : await classificationApi.classify(product.id);
      setRun(res.data);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? 'Classification failed.');
    } finally {
      setIsClassifying(false);
    }
  }

  async function handleUse(code: string) {
    if (isPending || !run) return;
    setIsPending(true);
    try {
      const res = await classificationApi.select(product.id, run.run_id, code);
      setChosenCode(code);
      setRun(res.data);

      // If chosen code was in the suggestion list → auto thumbs-up to external API
      const wasInList = candidates.some((c) => c.hs_code === code);
      if (wasInList && run.record_id) {
        await classificationApi.feedback(product.id, run.run_id, true);
        setFeedbackSignal('thumbs_up');
        toast.success(`HS code ${code} confirmed ✓`);
      } else {
        // Not in list → ask for correction/feedback
        setShowFeedbackForm(true);
        toast.success(`HS code set to ${code}`);
      }

      onProductUpdate({ ...product, existing_hs_code: code, hs_verified: true });
      queryClient.invalidateQueries({ queryKey: queryKeys.shipmentProducts(product.shipment_id ?? '') });
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? 'Could not apply code.');
    } finally {
      setIsPending(false);
    }
  }

  async function handleCorrectionSubmit(correctCode: string, reason: string) {
    if (!run) return;
    setIsPending(true);
    try {
      await classificationApi.feedback(product.id, run.run_id, false, correctCode, reason);
      setFeedbackSignal('thumbs_down');
      setShowFeedbackForm(false);
      toast.success('Correction recorded — thank you!');
    } catch {
      toast.error('Could not save correction.');
    } finally {
      setIsPending(false);
    }
  }

  const existingCode = run?.existing_hs_code ?? product.existing_hs_code;

  return (
    <div className="flex flex-col gap-4">
      {/* Current state */}
      <div className="flex items-center gap-3">
        {product.hs_verified ? (
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-green-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {product.existing_hs_code ?? 'Verified'}
          </span>
        ) : product.existing_hs_code ? (
          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-sm text-ink dark:bg-slate-800">
            {product.existing_hs_code}
          </span>
        ) : (
          <span className="text-[11px] italic text-muted-foreground">No HS code</span>
        )}
      </div>

      {/* Action buttons */}
      {!run && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => runClassify('verify')}
            disabled={isClassifying}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/30 px-4 py-1.5 text-xs font-semibold text-ink hover:border-ink transition-all disabled:opacity-40"
          >
            {isClassifying ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Verify HS Code
          </button>
          <button
            onClick={() => runClassify('genie')}
            disabled={isClassifying}
            className="inline-flex items-center gap-1.5 rounded-full bg-genie-gold-light border border-genie-gold/50 px-4 py-1.5 text-xs font-semibold text-ink/80 hover:bg-genie-gold/20 transition-all disabled:opacity-40"
          >
            {isClassifying ? <Loader2 className="h-3 w-3 animate-spin" /> : <span>✳</span>}
            Ask HS Genie
          </button>
        </div>
      )}

      {/* Loading state */}
      {isClassifying && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Analysing product with classification API…
        </div>
      )}

      {/* Candidates */}
      {run && candidates.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold tracking-widest text-genie-gold uppercase">
              ✳ {candidates.length} CANDIDATE{candidates.length !== 1 ? 'S' : ''}
            </span>
            <button
              onClick={() => { setRun(null); setChosenCode(null); setFeedbackSignal(null); setShowFeedbackForm(false); }}
              className="text-[10px] text-muted-foreground hover:text-foreground"
            >
              Clear ×
            </button>
          </div>

          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(candidates.length, 2)}, minmax(0, 1fr))` }}>
            {candidates.map((c, i) => (
              <CandidateCard
                key={c.hs_code}
                candidate={c}
                isTop={i === 0}
                isExisting={c.hs_code === existingCode}
                isChosen={chosenCode === c.hs_code}
                onUse={() => handleUse(c.hs_code)}
              />
            ))}
          </div>

          {/* Feedback after choosing */}
          {chosenCode && feedbackSignal === 'thumbs_up' && (
            <p className="text-[11px] font-medium text-green-700">
              👍 Confirmed as correct — recorded in audit trail.
            </p>
          )}
          {chosenCode && feedbackSignal === 'thumbs_down' && (
            <p className="text-[11px] font-medium text-amber-700">
              👎 Correction recorded — thank you.
            </p>
          )}

          {showFeedbackForm && !feedbackSignal && (
            <FeedbackForm
              candidates={candidates}
              onSubmit={handleCorrectionSubmit}
              onSkip={() => setShowFeedbackForm(false)}
            />
          )}

          {/* Audit note */}
          <p className="text-[10px] text-muted-foreground/50 border-t border-border pt-3">
            All {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} and reasoning are
            stored in the audit trail — the road not taken is part of the defence.
          </p>

          {!chosenCode && (
            <button
              onClick={() => runClassify(run.path as 'verify' | 'genie')}
              className="self-start text-[10px] text-muted-foreground hover:text-foreground"
            >
              Re-run →
            </button>
          )}
        </div>
      )}

      {run && candidates.length === 0 && (
        <p className="text-sm italic text-muted-foreground">
          No candidates returned by the API.
        </p>
      )}
    </div>
  );
}

// ── Main drawer ───────────────────────────────────────────────────────────────

interface Props {
  product: DocumentProduct;
  documentFilename?: string;
  onClose: () => void;
  onProductSaved: (p: DocumentProduct) => void;
}

export function ProductDetailDrawer({ product, documentFilename, onClose, onProductSaved }: Props) {
  const [form, setForm] = useState({
    product_name: product.product_name ?? '',
    description: product.description ?? '',
    material: product.material ?? '',
    intended_use: product.intended_use ?? '',
    quantity: product.quantity ?? '',
    unit_price: product.unit_price ?? '',
    line_total: product.line_total ?? '',
    currency: product.currency ?? '',
    net_weight: product.net_weight ?? '',
    gross_weight: product.gross_weight ?? '',
    origin_country: product.origin_country ?? '',
    destination_country: product.destination_country ?? '',
    existing_hs_code: product.existing_hs_code ?? '',
    existing_national_code: product.existing_national_code ?? '',
    lot_number: product.lot_number ?? '',
    expiry_date: product.expiry_date ?? '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [liveProduct, setLiveProduct] = useState<DocumentProduct>(product);

  // Sync form when product prop changes (e.g. after external update)
  useEffect(() => {
    setLiveProduct(product);
  }, [product]);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setIsDirty(true);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await classificationApi.updateProduct(product.id, {
        ...form,
        // Send null for blank strings so backend treats them as absent
        ...Object.fromEntries(
          Object.entries(form).map(([k, v]) => [k, v.trim() === '' ? null : v.trim()]),
        ),
      });
      setIsDirty(false);
      setLiveProduct(res.data);
      onProductSaved(res.data);
      toast.success('Product fields saved');
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? 'Save failed');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    /* Backdrop + drawer */
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />

      {/* Panel */}
      <aside className="w-full max-w-[680px] bg-background border-l shadow-2xl overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background px-5 py-3.5">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Product Details
            </p>
            <p className="truncate text-sm font-semibold text-foreground font-serif">
              {liveProduct.product_name ?? 'Untitled Product'}
            </p>
            {documentFilename && (
              <p className="text-[10px] text-muted-foreground truncate">
                From: {documentFilename}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-0 divide-y divide-border">
          {/* ── Product fields ─────────────────────────────────────────── */}
          <section className="px-5 py-5 flex flex-col gap-4">
            <h3 className="text-[10.5px] font-bold uppercase tracking-widest text-muted-foreground">
              Product Information
            </h3>

            <div className="grid grid-cols-1 gap-3">
              <Field label="Product Name" value={form.product_name} onChange={(v) => set('product_name', v)} />
              <Field label="Description" value={form.description} onChange={(v) => set('description', v)} multiline />
              <Field label="Material" value={form.material} onChange={(v) => set('material', v)} />
              <Field label="Intended Use" value={form.intended_use} onChange={(v) => set('intended_use', v)} multiline />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Origin Country" value={form.origin_country} onChange={(v) => set('origin_country', v)} />
              <Field label="Destination Country" value={form.destination_country} onChange={(v) => set('destination_country', v)} />
              <Field label="Quantity" value={form.quantity} onChange={(v) => set('quantity', v)} />
              <Field label="Currency" value={form.currency} onChange={(v) => set('currency', v)} />
              <Field label="Unit Price" value={form.unit_price} onChange={(v) => set('unit_price', v)} />
              <Field label="Line Total" value={form.line_total} onChange={(v) => set('line_total', v)} />
              <Field label="Net Weight" value={form.net_weight} onChange={(v) => set('net_weight', v)} />
              <Field label="Gross Weight" value={form.gross_weight} onChange={(v) => set('gross_weight', v)} />
              <Field label="Lot Number" value={form.lot_number} onChange={(v) => set('lot_number', v)} />
              <Field label="Expiry Date" value={form.expiry_date} onChange={(v) => set('expiry_date', v)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="HS Code (existing)" value={form.existing_hs_code} onChange={(v) => set('existing_hs_code', v)} />
              <Field label="National Code" value={form.existing_national_code} onChange={(v) => set('existing_national_code', v)} />
            </div>

            <button
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="self-start inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-1.5 text-xs font-semibold text-paper disabled:opacity-40 hover:bg-ink/80 transition-all"
            >
              {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Save Changes
            </button>
          </section>

          {/* ── HS Classification ──────────────────────────────────────── */}
          <section className="px-5 py-5 flex flex-col gap-4">
            <h3 className="text-[10.5px] font-bold uppercase tracking-widest text-muted-foreground">
              HS Classification
            </h3>
            <ClassificationPanel
              product={liveProduct}
              onProductUpdate={(updated) => {
                setLiveProduct(updated);
                setForm((f) => ({ ...f, existing_hs_code: updated.existing_hs_code ?? '' }));
                onProductSaved(updated);
              }}
            />
          </section>
        </div>
      </aside>
    </div>
  );
}
