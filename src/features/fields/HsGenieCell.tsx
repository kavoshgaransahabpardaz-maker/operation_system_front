import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { classificationApi } from '@/api/classification';
import { Spinner } from '@/components/shared/Spinner';
import type { DocumentProduct, HsCandidate, HsGenieRunOut } from '@/types';

// ── Confidence band colours ───────────────────────────────────────────────────
function confColor(level: string): { bar: string; text: string; bg: string } {
  if (level === 'high') return { bar: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' };
  if (level === 'medium') return { bar: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50' };
  return { bar: 'bg-red-400', text: 'text-red-600', bg: 'bg-red-50' };
}

// ── Feedback sub-form ─────────────────────────────────────────────────────────
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
    { value: 'wrong_dimension', label: 'Wrong dimension band' },
    { value: 'other', label: 'Other' },
  ];

  const otherCandidates = candidates.filter((c, i) => i > 0);

  return (
    <div className="mt-3 rounded-xl border border-genie-gold/40 bg-genie-gold-light/60 p-4 flex flex-col gap-3">
      <p className="text-[11px] font-semibold text-ink/70 uppercase tracking-wide">
        What's the correct code?
      </p>

      {otherCandidates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {otherCandidates.map((c) => (
            <button
              key={c.hs_code}
              onClick={() => setCode(c.hs_code)}
              className={`rounded-full border px-3 py-1 font-mono text-xs transition-all ${
                code === c.hs_code
                  ? 'border-ink bg-ink text-paper'
                  : 'border-genie-gold bg-paper text-ink hover:border-ink'
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
        placeholder="Or type a code…"
        className="w-full rounded-lg border border-genie-gold/50 bg-paper px-3 py-1.5 font-mono text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-1 focus:ring-genie-gold"
      />

      <div className="flex flex-wrap gap-2">
        {reasons.map((r) => (
          <button
            key={r.value}
            onClick={() => setReason(r.value)}
            className={`rounded-full border px-3 py-1 text-xs transition-all ${
              reason === r.value
                ? 'border-ink bg-ink text-paper'
                : 'border-genie-gold/50 bg-paper text-ink/70 hover:border-ink'
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
          className="rounded-full bg-ink px-4 py-1.5 text-xs font-semibold text-paper disabled:opacity-40 hover:bg-ink/80 transition-colors"
        >
          Submit correction
        </button>
        <button
          onClick={onSkip}
          className="text-xs text-ink/40 hover:text-ink/70 transition-colors px-2"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

// ── Single candidate card ─────────────────────────────────────────────────────
function CandidateCard({
  candidate,
  isTop,
  onUse,
}: {
  candidate: HsCandidate;
  isTop: boolean;
  onUse: () => void;
}) {
  const col = confColor(candidate.overall_confidence_level);
  const citation = `§ ${candidate.heading_code} · GRI ${candidate.gri_rule}`;

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border bg-paper p-5 transition-all ${
        isTop
          ? 'border-genie-teal ring-1 ring-genie-teal/30'
          : 'border-genie-gold/40'
      }`}
    >
      {/* Code + confidence */}
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-2xl font-bold text-ink leading-none">
          {candidate.hs_code}
        </span>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${col.text} ${col.bg}`}>
          {candidate.confidence}%
        </span>
      </div>

      {/* Confidence bar */}
      <div className="h-1 w-full rounded-full bg-ink/10">
        <div
          className={`h-1 rounded-full ${col.bar} transition-all`}
          style={{ width: `${candidate.confidence}%` }}
        />
      </div>

      {/* Justification */}
      <p className="text-[12px] text-ink/80 leading-relaxed line-clamp-3">
        {candidate.justification}
      </p>

      {/* Citation chip */}
      <span className="self-start rounded-full border border-genie-gold/60 bg-genie-gold-light px-2.5 py-0.5 font-mono text-[10px] text-ink/70">
        {citation}
      </span>

      {/* Use button */}
      <button
        onClick={onUse}
        className="mt-auto w-full rounded-xl bg-ink py-2 text-[12px] font-semibold text-paper hover:bg-ink/80 active:scale-[0.98] transition-all"
      >
        Use this code
      </button>
    </div>
  );
}

// ── Genie panel (full-width row below) ────────────────────────────────────────
export function HsGeniePanel({
  product,
  run,
  onClose,
  onCodeSelected,
}: {
  product: DocumentProduct;
  run: HsGenieRunOut;
  onClose: () => void;
  onCodeSelected: (code: string, runId: string) => void;
}) {
  const [selectedCode, setSelectedCode] = useState<string | null>(run.chosen_code);
  const [feedbackSignal, setFeedbackSignal] = useState<'thumbs_up' | 'thumbs_down' | null>(
    run.feedback_signal,
  );
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const candidates = (run.candidates ?? []).slice(0, 3);
  const timestamp = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  async function handleUse(code: string) {
    if (isPending) return;
    setIsPending(true);
    try {
      await classificationApi.select(product.id, run.run_id, code);
      setSelectedCode(code);
      onCodeSelected(code, run.run_id);
      toast.success(`HS code set to ${code}`);
    } catch {
      toast.error('Could not apply code.');
    } finally {
      setIsPending(false);
    }
  }

  async function handleFeedback(isCorrect: boolean) {
    if (isPending || !selectedCode) return;
    if (!isCorrect) {
      setShowFeedbackForm(true);
      return;
    }
    setIsPending(true);
    try {
      await classificationApi.feedback(product.id, run.run_id, true);
      setFeedbackSignal('thumbs_up');
      toast.success('Feedback recorded — thank you!');
    } catch {
      toast.error('Could not save feedback.');
    } finally {
      setIsPending(false);
    }
  }

  async function handleCorrectionSubmit(correctCode: string, reason: string) {
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

  return (
    <div className="bg-paper border-t border-b border-genie-gold/30 px-6 py-5">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <span className="font-mono text-[11px] font-bold tracking-[0.12em] text-genie-gold uppercase">
          ✳ HS GENIE · {candidates.length} CANDIDATE{candidates.length !== 1 ? 'S' : ''}
        </span>
        <div className="flex items-center gap-4">
          {run.record_id && (
            <span className="font-mono text-[10px] text-ink/40">
              API RUN #{run.record_id.slice(0, 8).toUpperCase()} · {timestamp}
            </span>
          )}
          <button
            onClick={onClose}
            className="text-[10px] text-ink/40 hover:text-ink/70 transition-colors uppercase tracking-wide"
          >
            Close ×
          </button>
        </div>
      </div>

      {/* Candidate cards */}
      {candidates.length > 0 ? (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${candidates.length}, minmax(0, 1fr))` }}>
          {candidates.map((c, i) => (
            <CandidateCard
              key={c.hs_code}
              candidate={c}
              isTop={i === 0}
              onUse={() => handleUse(c.hs_code)}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink/50 italic py-4">No candidates returned by the API.</p>
      )}

      {/* Feedback controls (after a code is selected) */}
      {selectedCode && !feedbackSignal && (
        <div className="mt-4 flex items-center gap-3">
          <span className="text-[11px] text-ink/50">
            Code <span className="font-mono font-semibold text-ink">{selectedCode}</span> applied —
          </span>
          <button
            onClick={() => handleFeedback(true)}
            disabled={isPending}
            className="text-base hover:scale-110 transition-transform disabled:opacity-40"
            title="Correct"
          >
            👍
          </button>
          <button
            onClick={() => handleFeedback(false)}
            disabled={isPending}
            className="text-base hover:scale-110 transition-transform disabled:opacity-40"
            title="Wrong"
          >
            👎
          </button>
        </div>
      )}

      {feedbackSignal === 'thumbs_up' && (
        <p className="mt-3 text-[11px] text-green-700 font-medium">
          👍 Marked as correct — recorded in audit trail.
        </p>
      )}

      {feedbackSignal === 'thumbs_down' && (
        <p className="mt-3 text-[11px] text-amber-700 font-medium">
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

      {/* Footer */}
      <p className="mt-5 text-[10.5px] text-ink/35 leading-relaxed border-t border-genie-gold/20 pt-4">
        Whichever you pick, all {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} and
        the reasoning go into the audit trail — the road not taken is part of the defence.
      </p>
    </div>
  );
}

// ── HS code cell (inline actions inside the table row) ────────────────────────
export function HsGenieCell({
  product,
  canConflict,
  mismatchChips,
  onGenieOpen,
}: {
  product: DocumentProduct;
  canConflict: boolean;
  mismatchChips: ReactNode | null;
  onGenieOpen: (run: HsGenieRunOut) => void;
}) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [localProduct, setLocalProduct] = useState(product);

  async function handleVerify() {
    if (isVerifying) return;
    setIsVerifying(true);
    try {
      await classificationApi.verify(product.id);
      setLocalProduct((p) => ({ ...p, hs_verified: true }));
      toast.success('HS code verified');
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? 'Could not verify code.');
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleClassify() {
    if (isClassifying) return;
    setIsClassifying(true);
    try {
      const res = await classificationApi.classify(product.id);
      onGenieOpen(res.data);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? 'Classification failed.');
    } finally {
      setIsClassifying(false);
    }
  }

  // Show mismatch chips if there are cross-doc conflicts
  if (mismatchChips) return <>{mismatchChips}</>;

  // Verified state
  if (localProduct.hs_verified) {
    return (
      <div className="flex flex-col gap-1">
        {localProduct.existing_hs_code && (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">
            {localProduct.existing_hs_code}
          </span>
        )}
        <span className="flex items-center gap-1 text-[10px] font-semibold text-green-700">
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5.5" stroke="currentColor" strokeWidth="1" />
            <path d="M3.5 6l1.8 1.8 3-3.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Cleared
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {localProduct.existing_hs_code ? (
        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">
          {localProduct.existing_hs_code}
        </span>
      ) : (
        <span className="text-[10px] text-muted-foreground/50 italic">No code</span>
      )}

      <div className="flex flex-wrap gap-1.5">
        {localProduct.existing_hs_code && (
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="inline-flex items-center gap-1 rounded-full border border-ink/30 px-2.5 py-0.5 text-[10px] font-semibold text-ink/70 hover:border-ink hover:text-ink transition-all disabled:opacity-40"
          >
            {isVerifying ? <Spinner size="sm" /> : null}
            Verify
          </button>
        )}
        <button
          onClick={handleClassify}
          disabled={isClassifying}
          className="inline-flex items-center gap-1 rounded-full bg-genie-gold-light border border-genie-gold/50 px-2.5 py-0.5 text-[10px] font-semibold text-ink/80 hover:bg-genie-gold/20 hover:border-genie-gold transition-all disabled:opacity-40"
        >
          {isClassifying ? <Spinner size="sm" /> : <span>✳</span>}
          HS Genie
        </button>
      </div>
    </div>
  );
}
