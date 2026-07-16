import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';

// ── Palette (from product screenshot) ─────────────────────────────────────────
// Sidebar dark navy:  #0C1220
// Dark surface:       #111B34
// Off-white hero bg:  #FAF9F5
// Teal CTA:          #0D9488
// Green success:      #16A34A
// Orange warning:     #EA580C

// ── PRD copy ──────────────────────────────────────────────────────────────────

type Role = 'broker' | 'importer' | 'exporter';

const ROLES: {
  id: Role;
  tab: string;
  tagline: string;
  promise: string;
  features: string[];
}[] = [
  {
    id: 'broker',
    tab: 'Broker',
    tagline: 'Your rules. Your pace. Your call.',
    promise:
      'Pre-declaration to declaration in 8 minutes, not an afternoon. The prep gets done while you make your coffee. More entries through the same hands — routine ones on autopilot, tricky ones with you in the driver's seat.',
    features: [
      'Documents in, auto-sorted by shipment — mismatch caught at the door',
      'Your rules, your rounding: set the tolerances, the AI acts only inside them',
      'HS classification verified and cited — not a guess',
      'Duty & landed cost, calculated with the saving on screen',
      'Rules of origin, surfaced in context',
      'Pre-filing screening (sanctions + export controls + certificates)',
      'Filing simulator catches what CDS would reject — flows into CargoWise, Descartes, CDS',
      'One-click audit bundle',
    ],
  },
  {
    id: 'importer',
    tab: 'Importer',
    tagline: 'Stop importing blind. Know what you owe.',
    promise:
      'You carry the liability. Finally, you carry the tools. See the penalty before HMRC does. Walk into an audit ready before the letter hits your mailbox. Put your broker, forwarder and exporter on one page.',
    features: [
      'Verify your broker's classification and entry before it's filed',
      'Claim the preference you're owed — stop overpaying duty',
      'Landed cost and exposure, in plain view',
      'A bankable, audit-ready trail — proof you acted in good faith',
      'Connect broker, forwarder and exporter on one shared record',
      'See the filing simulator flag what HMRC would reject — before the declaration is submitted',
    ],
  },
  {
    id: 'exporter',
    tab: 'Exporter',
    tagline: 'From form-filler to decision-maker.',
    promise:
      'Export controls, sanctions and duty — handled and in plain sight. Know your true cost before you commit. Turn origin from the thing you dread into the lever you pull.',
    features: [
      'Upload your Bill of Materials → qualification assessment',
      'Export-control + sanctions screening, done up front',
      'True landed cost before you price the deal',
      'Defensible Proof of Origin: evidence package + signed Statement of Origin (requires your explicit sign-off)',
      'Origin as strategy — see which market and route wins on duty',
    ],
  },
];

const ENGINE_PROOFS = [
  {
    title: 'Cited, not a black box',
    desc: 'Every answer shows its receipts — the specific legal source, not "the AI said so."',
  },
  {
    title: 'Expert-validated',
    desc: 'Reviewed by customs specialists; sharper with every determination made on the platform.',
  },
  {
    title: 'Your data stays yours',
    desc: 'We never train on it or sell it. Processed, stored securely, returned to you — full stop.',
  },
];

const RESULTS = [
  {
    value: '~90%',
    label: 'Faster',
    desc: 'A 2-hour manual declaration becomes an 8–15 minute workflow.',
    caveat: 'Target — based on workflow design',
  },
  {
    value: 'Scale',
    label: 'Without headcount',
    desc: 'Automate the routine 95% — the same team handles far more.',
    caveat: 'Target claim — pilot data pending',
  },
  {
    value: 'Bankable',
    label: 'Compliance rating',
    desc: 'A verified shipment history banks and insurers can underwrite.',
    caveat: 'Roadmap — not live yet',
  },
  {
    value: 'Audited',
    label: 'Chemistry',
    desc: 'Proves preferential origin by reading the Mill-Test-Certificate under TCA ORIG.19.',
    caveat: 'At launch',
  },
];

const TRADEWATCH_ITEMS = [
  {
    label: 'News effect',
    desc: 'A new tariff, sanction or rule — and exactly what it means for your duty and origin, before it becomes a problem.',
  },
  {
    label: 'CDS release effect',
    desc: 'When HMRC changes CDS, what it does to your declarations. Plain English, before the rejection.',
  },
  {
    label: 'CDS error explainer',
    desc: 'Paste a rejection, get the plain-English cause and the fix. Not a support ticket — an instant answer.',
  },
  {
    label: 'HMRC availability monitor',
    desc: 'Is the system down, or is it you? Know instantly — stop guessing, start planning.',
  },
];

// ── Workspace mockup components ────────────────────────────────────────────────
// These faithfully recreate the product screenshot visual style:
// dark-navy sidebar + shipment-reference tabs + 6-step clearance rail + content

const NAV_ITEMS = [
  { label: 'Dashboard' },
  { label: 'Shipments', badge: '2', badgeOrange: false },
  { label: 'TradeWatch', badge: '1', badgeOrange: true },
  { label: 'Team chat' },
  { label: 'Trade Hub' },
];

const CLEARANCE_STEPS = [
  { n: 1, label: 'Intake', status: 'done' as const },
  { n: 2, label: 'Parties & transport', status: 'warn' as const },
  { n: 3, label: 'Screening & cost', status: 'warn' as const },
  { n: 4, label: 'Line items', status: 'warn' as const },
  { n: 5, label: 'Record & valuation', status: 'warn' as const },
  { n: 6, label: 'Origin & filing', status: 'pending' as const },
];

function MockupSidebar() {
  return (
    <div
      className="w-36 shrink-0 flex flex-col border-r border-white/5"
      style={{ backgroundColor: '#0C1220' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-1.5 p-3 pb-4">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-600">
          <span className="text-[8px] font-bold text-white">VT</span>
        </div>
        <div>
          <p className="text-[10px] font-bold leading-tight text-white">Veritariff</p>
          <p className="text-[7px] uppercase tracking-widest text-slate-500">Compliance OS</p>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 space-y-0.5 px-2">
        {NAV_ITEMS.map(({ label, badge, badgeOrange }) => (
          <div
            key={label}
            className={`flex items-center justify-between rounded px-2 py-1.5 text-[11px] font-medium ${
              label === 'Shipments' ? 'bg-white/10 text-white' : 'text-slate-400'
            }`}
          >
            <span>{label}</span>
            {badge && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white ${
                  badgeOrange ? 'bg-orange-500' : 'bg-red-500'
                }`}
              >
                {badge}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Trial */}
      <div className="border-t border-white/5 p-2.5">
        <p className="text-[8px] font-semibold uppercase tracking-wider text-slate-500">
          FREE TRIAL · 18 days left
        </p>
        <p className="mt-0.5 text-[8px] text-slate-600">Starter Intelligence — £39/mo after</p>
      </div>
    </div>
  );
}

function StepRail({ active }: { active: number }) {
  return (
    <div className="w-36 shrink-0 border-r border-gray-100 bg-gray-50 px-2.5 py-3 space-y-0.5">
      {CLEARANCE_STEPS.map(({ n, label, status }) => {
        const isActive = n === active;
        const isDone = status === 'done';
        const isWarn = status === 'warn' && n !== active;
        return (
          <div
            key={n}
            className={`flex items-center gap-1.5 rounded px-2 py-1.5 text-[10px] font-medium ${
              isActive
                ? 'bg-slate-900 text-white'
                : isDone
                ? 'text-green-700'
                : isWarn
                ? 'text-orange-600'
                : 'text-gray-400'
            }`}
          >
            {isDone ? (
              <Check className="h-2.5 w-2.5 shrink-0" />
            ) : isActive ? (
              <ChevronRight className="h-2.5 w-2.5 shrink-0" />
            ) : isWarn ? (
              <span className="shrink-0 font-bold">!</span>
            ) : (
              <span className="shrink-0 text-gray-300">·</span>
            )}
            <span>
              {n} · {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Broker mockup: Step 3 — Screening & cost (matches screenshot) ──────────────

function BrokerMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-xl">
      <div className="flex" style={{ height: 420 }}>
        <MockupSidebar />

        {/* Main */}
        <div className="flex flex-1 flex-col bg-gray-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5">
            <div>
              <p className="text-xs font-bold text-gray-900">Shipments</p>
              <p className="text-[10px] text-gray-400">AI task orchestration across your pipeline</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[9px] text-green-600">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                AI orchestrator online
              </span>
              <span className="text-[9px] text-gray-400">Wed 2 Jul 2026</span>
            </div>
          </div>

          {/* Shipment tabs */}
          <div className="flex items-center gap-1 border-b border-gray-200 bg-white px-4 py-1.5">
            <div className="flex items-center gap-1 rounded-t-md border border-b-0 border-gray-300 bg-gray-50 px-3 py-1.5">
              <span className="text-[9px] font-semibold text-gray-700">SH-2026-84120</span>
              <span className="text-[9px] text-gray-400">Frozen boneless beef · 26t</span>
            </div>
            <div className="flex items-center gap-1 rounded-t-md px-3 py-1.5">
              <span className="text-[9px] text-gray-400">SH-2026-83411</span>
              <span className="text-[9px] text-gray-400">Steel mounting brackets · £75,000</span>
            </div>
            <div className="ml-auto">
              <button className="flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1 text-[9px] font-medium text-gray-600">
                Clearance workflow <ChevronDown className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="border-b border-gray-100 bg-white px-4 py-1.5">
            <p className="text-[9px] font-medium uppercase tracking-widest text-gray-400">
              Step 3 of 6 · Frozen boneless beef · 26 T · Rotterdam → Felixstowe · Albion Foods Ltd
            </p>
          </div>

          {/* Content */}
          <div className="flex flex-1 overflow-hidden">
            <StepRail active={3} />

            <div className="flex flex-1 overflow-hidden">
              {/* Center */}
              <div className="flex-1 overflow-auto p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-gray-900">Screening & cost</p>
                    <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-orange-700">
                      Needs input
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] text-gray-400">
                    <span>1 of 6 done</span>
                    <span className="rounded border border-gray-200 px-1.5 py-0.5 font-medium text-gray-600">Horizon</span>
                    <span className="rounded border border-gray-200 px-1.5 py-0.5 font-medium text-gray-600">Thread</span>
                    <span className="rounded border border-gray-200 px-1.5 py-0.5 font-medium text-gray-600">@ Assign</span>
                  </div>
                </div>
                <p className="text-[9px] text-gray-400">Document requests · sanctions and controls · what this shipment will cost</p>

                {/* Documents from parties */}
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                    Documents from the parties
                  </p>
                  {[
                    { doc: 'Amended EHC (weight-aligned)', from: 'Sarah Okonkwo — importer', status: 'Requested', cls: 'border-blue-200 bg-blue-50 text-blue-700' },
                    { doc: 'Cold-chain temperature log', from: 'Tomasz Kowalski — forwarder', status: 'Received', cls: 'border-green-200 bg-green-50 text-green-700' },
                    { doc: 'CHED-P reference (IPAFFS)', from: 'Sarah Okonkwo — importer', status: 'Missing', cls: 'border-red-200 bg-red-50 text-red-700' },
                  ].map(({ doc, from, status, cls }) => (
                    <div key={doc} className="mb-1 flex items-center justify-between rounded-lg border border-gray-100 bg-white px-2.5 py-1.5">
                      <div>
                        <p className="text-[10px] font-semibold text-gray-900">{doc}</p>
                        <p className="text-[9px] text-gray-400">{from}</p>
                      </div>
                      <span className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold ${cls}`}>{status}</span>
                    </div>
                  ))}
                </div>

                {/* Pre-filing screening */}
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                    Pre-filing screening
                  </p>
                  {[
                    { label: 'Sanctions screening', detail: 'Albion · Vandermeer · Blue Anchor vs UK FCDO, EU FSF, US CSL — all parties clear', ok: true },
                    { label: 'Export controls', detail: '0202 30 90 is not on the UK Strategic Export Control List or EU dual-use Annex I', ok: true },
                    { label: 'Licences & certificates', detail: 'EHC present · CHED-P pre-notification missing — POAO is held at the BCP without it', ok: false },
                  ].map(({ label, detail, ok }) => (
                    <div key={label} className="mb-1 flex items-start gap-2">
                      <span className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white ${ok ? 'bg-green-500' : 'bg-orange-400'}`}>
                        {ok ? '✓' : '!'}
                      </span>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-900">{label}</p>
                        <p className="text-[9px] text-gray-400 leading-snug">{detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Duty panel */}
              <div className="w-36 shrink-0 overflow-auto border-l border-gray-200 bg-white p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400">Duty & cost</p>
                  <button className="rounded border border-gray-200 px-1.5 py-0.5 text-[8px] font-medium text-gray-500">
                    Full filing simulation →
                  </button>
                </div>
                {[
                  { label: 'Price paid (invoice)', value: '£116,020', note: 'CI', dim: true },
                  { label: '+ Freight to UK border', value: '£1,480', note: 'BL', dim: true },
                  { label: '+ Insurance to border', value: '£740', note: 'CI', dim: true },
                  { label: 'Customs value (CIF)', value: '£118,240', bold: true },
                  { label: 'Customs duty — TCA preference', value: '£0', green: true },
                  { label: 'MFN fallback if origin fails', value: '£14,189', red: true },
                  { label: 'Import VAT', value: '£0', note: 'zero-rated food', dim: true },
                  { label: 'Port, BCP & handling', value: '£1,120', dim: true },
                  { label: 'Broker fee', value: '£240', note: 'fixed', dim: true },
                ].map(({ label, value, bold, green, red, dim }) => (
                  <div key={label} className="flex items-center justify-between">
                    <p className={`text-[8px] leading-snug ${dim ? 'text-gray-400' : bold ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                      {label}
                    </p>
                    <p className={`text-[9px] font-bold tabular-nums ${green ? 'text-green-600' : red ? 'text-red-600' : 'text-gray-900'}`}>
                      {value}
                    </p>
                  </div>
                ))}
                <div className="mt-2 border-t border-gray-100 pt-2 grid grid-cols-2 gap-1">
                  {[
                    { label: 'Payable at import', val: '£1,360' },
                    { label: 'Saving vs MFN', val: '£14,189', green: true },
                    { label: 'Landed cost', val: '£119,600' },
                    { label: 'Unit landed cost', val: '£5.00/kg' },
                  ].map(({ label, val, green }) => (
                    <div key={label}>
                      <p className="text-[7px] uppercase text-gray-400">{label}</p>
                      <p className={`text-[10px] font-bold ${green ? 'text-green-600' : 'text-gray-900'}`}>{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom nav */}
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-2">
            <p className="text-[9px] text-gray-500">Daniel Mensah · Customs broker</p>
            <div className="flex gap-2">
              <button className="rounded border border-gray-200 px-2.5 py-1 text-[9px] font-medium text-gray-500">← Previous</button>
              <button className="rounded bg-slate-900 px-3 py-1 text-[9px] font-semibold text-white">Next · Line items →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Importer mockup: Step 5 — Record & valuation ───────────────────────────────

function ImporterMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-xl">
      <div className="flex" style={{ height: 420 }}>
        <MockupSidebar />

        <div className="flex flex-1 flex-col bg-gray-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5">
            <div>
              <p className="text-xs font-bold text-gray-900">Shipments</p>
              <p className="text-[10px] text-gray-400">AI task orchestration across your pipeline</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[9px] text-green-600">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                AI orchestrator online
              </span>
            </div>
          </div>

          {/* Shipment tabs */}
          <div className="flex items-center gap-1 border-b border-gray-200 bg-white px-4 py-1.5">
            <div className="flex items-center gap-1 rounded-t-md border border-b-0 border-gray-300 bg-gray-50 px-3 py-1.5">
              <span className="text-[9px] font-semibold text-gray-700">SH-2026-83411</span>
              <span className="text-[9px] text-gray-400">Steel mounting brackets · £75,000</span>
            </div>
            <div className="ml-auto">
              <button className="flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1 text-[9px] font-medium text-gray-600">
                Clearance workflow <ChevronDown className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>

          <div className="border-b border-gray-100 bg-white px-4 py-1.5">
            <p className="text-[9px] font-medium uppercase tracking-widest text-gray-400">
              Step 5 of 6 · Steel mounting brackets · 12,500 pcs · Gdańsk → Harwich · Kowalski Metalworks
            </p>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <StepRail active={5} />

            <div className="flex flex-1 overflow-hidden">
              {/* Center */}
              <div className="flex-1 overflow-auto p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-gray-900">Record & valuation</p>
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-blue-700">
                      Verify before filing
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] text-gray-400">
                    <span>4 of 6 done</span>
                    <span className="rounded border border-gray-200 px-1.5 py-0.5 font-medium text-gray-600">@ Assign</span>
                  </div>
                </div>
                <p className="text-[9px] text-gray-400">Verify classification and entry · customs value · duty exposure</p>

                {/* Broker's entry verification */}
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                    Your broker's entry — before filing
                  </p>
                  {[
                    { field: 'HS code', brokerVal: '7318.15', verified: true, note: 'Cited — Explanatory Note 7318.15(b)' },
                    { field: 'Origin', brokerVal: 'Poland (PL)', verified: true, note: 'TCA preference claimed — qualifies' },
                    { field: 'Customs value', brokerVal: '£74,200 CIF', verified: false, note: '⚠ Invoice shows £75,000 — £800 unexplained' },
                    { field: 'Incoterm', brokerVal: 'CIF Harwich', verified: true, note: 'Matches B/L and insurance certificate' },
                  ].map(({ field, brokerVal, verified, note }) => (
                    <div key={field} className="mb-1 flex items-center justify-between rounded-lg border border-gray-100 bg-white px-2.5 py-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white ${verified ? 'bg-green-500' : 'bg-orange-400'}`}>
                          {verified ? '✓' : '!'}
                        </span>
                        <div>
                          <p className="text-[9px] text-gray-500">{field}</p>
                          <p className="text-[10px] font-semibold text-gray-900">{brokerVal}</p>
                        </div>
                      </div>
                      <p className={`text-[9px] ${verified ? 'text-gray-400' : 'text-orange-600 font-medium'}`}>{note}</p>
                    </div>
                  ))}
                </div>

                {/* Preference claim */}
                <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2">
                  <p className="text-[9px] font-semibold text-teal-700">Preference saving on screen</p>
                  <p className="text-[9px] text-gray-600 mt-0.5">TCA preference: £0 duty · MFN fallback: £5,926 · You save: <span className="font-bold text-green-700">£5,926</span></p>
                </div>
              </div>

              {/* Right panel: audit trail */}
              <div className="w-36 shrink-0 overflow-auto border-l border-gray-200 bg-white p-3 space-y-2">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400">Audit trail</p>
                {[
                  { who: 'AI engine', action: 'HS code verified — Explanatory Note cited', t: '14:02', ok: true },
                  { who: 'AI engine', action: 'TCA origin qualifies — EUR.1 on file', t: '14:02', ok: true },
                  { who: 'System', action: 'Value discrepancy flagged — broker notified', t: '14:03', ok: false },
                  { who: 'Sofia Reyes', action: 'Opened record for verification', t: '14:08', ok: null },
                ].map(({ who, action, t, ok }) => (
                  <div key={t + who} className="border-l-2 pl-2 py-0.5" style={{ borderColor: ok === true ? '#16a34a' : ok === false ? '#ea580c' : '#9ca3af' }}>
                    <p className="text-[8px] font-semibold text-gray-700">{who}</p>
                    <p className="text-[8px] text-gray-500 leading-snug">{action}</p>
                    <p className="text-[7px] text-gray-300 mt-0.5">{t}</p>
                  </div>
                ))}
                <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-2">
                  <p className="text-[9px] font-semibold text-green-700">Good faith proof</p>
                  <p className="text-[8px] text-gray-500 mt-0.5">All checks logged with source citations — audit-ready</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-2">
            <p className="text-[9px] text-gray-500">Sofia Reyes · Compliance Manager</p>
            <div className="flex gap-2">
              <button className="rounded border border-gray-200 px-2.5 py-1 text-[9px] font-medium text-gray-500">← Previous</button>
              <button className="rounded bg-slate-900 px-3 py-1 text-[9px] font-semibold text-white">Next · Origin & filing →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Exporter mockup: Step 6 — Origin & filing ──────────────────────────────────

function ExporterMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-xl">
      <div className="flex" style={{ height: 420 }}>
        <MockupSidebar />

        <div className="flex flex-1 flex-col bg-gray-50 overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5">
            <div>
              <p className="text-xs font-bold text-gray-900">Shipments</p>
              <p className="text-[10px] text-gray-400">AI task orchestration across your pipeline</p>
            </div>
            <span className="flex items-center gap-1 text-[9px] text-green-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              AI orchestrator online
            </span>
          </div>

          <div className="flex items-center gap-1 border-b border-gray-200 bg-white px-4 py-1.5">
            <div className="flex items-center gap-1 rounded-t-md border border-b-0 border-gray-300 bg-gray-50 px-3 py-1.5">
              <span className="text-[9px] font-semibold text-gray-700">SH-2026-91045</span>
              <span className="text-[9px] text-gray-400">Stainless steel billets · 8t · GB→DE</span>
            </div>
            <div className="ml-auto">
              <button className="flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1 text-[9px] font-medium text-gray-600">
                Clearance workflow <ChevronDown className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>

          <div className="border-b border-gray-100 bg-white px-4 py-1.5">
            <p className="text-[9px] font-medium uppercase tracking-widest text-gray-400">
              Step 6 of 6 · Stainless steel billets · 8 T · Sheffield → Hamburg · Meridian Exports Ltd
            </p>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Step rail — all done except active step 6 */}
            <div className="w-36 shrink-0 border-r border-gray-100 bg-gray-50 px-2.5 py-3 space-y-0.5">
              {CLEARANCE_STEPS.map(({ n, label }) => {
                const isActive = n === 6;
                const isDone = n < 6;
                return (
                  <div
                    key={n}
                    className={`flex items-center gap-1.5 rounded px-2 py-1.5 text-[10px] font-medium ${
                      isActive ? 'bg-slate-900 text-white' : isDone ? 'text-green-700' : 'text-gray-400'
                    }`}
                  >
                    {isDone ? <Check className="h-2.5 w-2.5 shrink-0" /> : <ChevronRight className="h-2.5 w-2.5 shrink-0" />}
                    {n} · {label}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Center */}
              <div className="flex-1 overflow-auto p-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-gray-900">Origin & filing</p>
                  <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-teal-700">
                    Sign-off required
                  </span>
                </div>
                <p className="text-[9px] text-gray-400">BoM assessment · export controls · Proof of Origin — awaiting your sign-off</p>

                {/* BoM result */}
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                    Bill of materials — origin assessment
                  </p>
                  <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[9px] font-bold text-white">✓</span>
                      <p className="text-[10px] font-semibold text-green-800">Qualifies for TCA preferential origin</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[9px]">
                      <div><p className="text-gray-400">Rule applied</p><p className="font-semibold text-gray-800">TCA ORIG.19</p></div>
                      <div><p className="text-gray-400">Method</p><p className="font-semibold text-gray-800">Melt & pour (MTC verified)</p></div>
                      <div><p className="text-gray-400">Evidence</p><p className="font-semibold text-gray-800">Mill-Test-Certificate</p></div>
                      <div><p className="text-gray-400">Non-originating content</p><p className="font-semibold text-gray-800">12.4% &lt; 50% threshold</p></div>
                    </div>
                  </div>
                </div>

                {/* Export controls */}
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                    Export controls + sanctions
                  </p>
                  {[
                    { label: 'UK Strategic Export Control List', result: 'Not listed — no licence required', ok: true },
                    { label: 'EU dual-use Annex I', result: 'Not listed', ok: true },
                    { label: 'Parties screening (UK/EU/US sanctions)', result: 'Meridian Exports · Bremer Stahlwerk — all clear', ok: true },
                  ].map(({ label, result, ok }) => (
                    <div key={label} className="mb-1 flex items-start gap-2">
                      <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-green-500 text-[8px] font-bold text-white">✓</span>
                      <div>
                        <p className="text-[9px] text-gray-500">{label}</p>
                        <p className="text-[10px] font-semibold text-green-800">{result}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Statement of Origin */}
              <div className="w-40 shrink-0 overflow-auto border-l border-gray-200 bg-white p-3 space-y-2">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400">Statement of Origin</p>
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-2.5 space-y-1.5">
                  <p className="text-[9px] font-semibold text-orange-800">Your sign-off required</p>
                  <p className="text-[8px] text-gray-600 leading-snug">
                    The origin evidence package is ready. As the exporter, you must explicitly approve this Statement of Origin — this is never automatic.
                  </p>
                  <button className="w-full rounded bg-slate-900 py-1.5 text-[9px] font-semibold text-white">
                    Review & approve →
                  </button>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[8px] font-semibold text-gray-500">Evidence package includes:</p>
                  {['Mill-Test-Certificate (melt & pour)', 'BoM with non-originating content calc', 'Supplier declaration from steel mill', 'TCA ORIG.19 working shown'].map((item) => (
                    <div key={item} className="flex items-start gap-1">
                      <Check className="mt-0.5 h-2.5 w-2.5 shrink-0 text-green-500" />
                      <p className="text-[8px] text-gray-500">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-teal-200 bg-teal-50 p-2">
                  <p className="text-[9px] font-semibold text-teal-700">Duty saving confirmed</p>
                  <p className="text-[9px] font-bold text-green-700">£8,640 vs MFN</p>
                  <p className="text-[8px] text-gray-500">12% × £72,000 CIF</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-2">
            <p className="text-[9px] text-gray-500">James Meridian · Director, Meridian Exports Ltd</p>
            <div className="flex gap-2">
              <button className="rounded border border-gray-200 px-2.5 py-1 text-[9px] font-medium text-gray-500">← Previous</button>
              <button className="rounded bg-teal-600 px-3 py-1 text-[9px] font-semibold text-white">Approve & issue Statement →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ROLE_MOCKUPS: Record<Role, React.ReactNode> = {
  broker: <BrokerMockup />,
  importer: <ImporterMockup />,
  exporter: <ExporterMockup />,
};

// ── Main component ─────────────────────────────────────────────────────────────

const NAV_DARK = '#0C1220';

export function LandingPage() {
  const [activeRole, setActiveRole] = useState<Role>('broker');
  const [mobileExpanded, setMobileExpanded] = useState<Role | null>('broker');
  const role = ROLES.find((r) => r.id === activeRole)!;

  return (
    <div className="min-h-screen text-gray-900 antialiased">

      {/* ── Nav ── */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/5" style={{ backgroundColor: NAV_DARK }}>
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600">
              <span className="text-[8px] font-bold text-white">VT</span>
            </div>
            <span className="text-sm font-bold text-white">Veritariff</span>
            <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 hidden sm:block">
              Compliance OS
            </span>
          </div>

          <div className="hidden items-center gap-7 sm:flex">
            {[
              { label: 'The Workspace', href: '#workspace' },
              { label: 'TradeWatch', href: '#tradewatch' },
              { label: 'About', href: '#manifesto' },
            ].map(({ label, href }) => (
              <a key={label} href={href} className="text-sm text-slate-400 transition-colors hover:text-white">
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-slate-400 transition-colors hover:text-white">
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-teal-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-teal-500"
            >
              Get early access
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-14" style={{ backgroundColor: '#FAF9F5' }}>
        <div className="mx-auto max-w-6xl px-6 pb-14 pt-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-xs font-medium text-teal-700 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
            Built for UK–EU customs compliance
          </div>

          <h1 className="mx-auto max-w-3xl text-5xl font-bold leading-[1.1] tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            Trade made easy.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-500">
            You weren't meant to fight the paperwork — you were meant to move the world. Veritariff is the compliance
            workspace for UK–EU trade: get your duty, classification and rules of origin right, simulate the filing,
            and audit every decision. Built for the brokers and businesses global trade left behind.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-500"
            >
              Get early access
            </Link>
            <a
              href="#workspace"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
            >
              See the workspace <ChevronDown className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Hero: show the broker workspace */}
        <div className="mx-auto max-w-5xl px-6 pb-0">
          <BrokerMockup />
        </div>
      </section>

      {/* ── The Workspace ── */}
      <section id="workspace" className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-600">The Workspace</p>
          </div>
          <h2 className="mx-auto max-w-2xl text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            One engine. Three lenses. Total control.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-gray-500">
            One unified system, shaped to whoever you are on the shipment.
          </p>

          {/* Desktop tab switcher */}
          <div className="mt-14 hidden lg:block">
            <div className="flex items-center justify-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit mx-auto">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setActiveRole(r.id)}
                  className={`rounded-lg px-8 py-2.5 text-sm font-semibold transition-all ${
                    activeRole === r.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {r.tab}
                </button>
              ))}
            </div>

            <div className="mt-10 grid grid-cols-2 gap-12 items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-teal-600 mb-3">{role.tab}</p>
                <h3 className="text-2xl font-bold text-gray-900">{role.tagline}</h3>
                <p className="mt-3 text-gray-500 leading-relaxed">{role.promise}</p>
                <ul className="mt-8 space-y-3">
                  {role.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100">
                        <Check className="h-3 w-3 text-teal-600" />
                      </span>
                      <span className="text-sm text-gray-700">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-500"
                >
                  Get early access <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div>{ROLE_MOCKUPS[activeRole]}</div>
            </div>
          </div>

          {/* Mobile: expandable cards */}
          <div className="mt-10 space-y-3 lg:hidden">
            {ROLES.map((r) => {
              const open = mobileExpanded === r.id;
              return (
                <div key={r.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                    onClick={() => setMobileExpanded(open ? null : r.id)}
                  >
                    <div>
                      <span className="font-bold text-gray-900">{r.tab}</span>
                      <span className="ml-2 text-xs text-gray-400">{r.tagline}</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && (
                    <div className="border-t border-gray-100 px-5 pb-5 space-y-3">
                      <p className="mt-4 text-sm text-gray-500">{r.promise}</p>
                      <ul className="space-y-2.5">
                        {r.features.map((f) => (
                          <li key={f} className="flex items-start gap-2.5">
                            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-teal-100">
                              <Check className="h-2.5 w-2.5 text-teal-600" />
                            </span>
                            <span className="text-sm text-gray-700">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Core Engine ── */}
      <section className="py-24" style={{ backgroundColor: '#0C1220' }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-16 lg:grid-cols-2 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-teal-400 mb-4">The Engine</p>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Flag, don't guess.<br />
                <span className="text-slate-400">Legal logic built by lawyers — not guessed by a machine.</span>
              </h2>
              <p className="mt-5 text-slate-400 leading-relaxed">
                Unlike generic "AI-powered" tools that guess, Veritariff runs on deterministic, expert-validated
                legal logic. Every output is cited to specific legal text — so you're always ready for post-Brexit
                divergence, CBAM, EUDR and sanctions. We give your experts a decision they can validate in seconds,
                not hours.
              </p>
              <div className="mt-8 space-y-6">
                {ENGINE_PROOFS.map(({ title, desc }) => (
                  <div key={title} className="flex items-start gap-4">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-600">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </span>
                    <div>
                      <p className="font-semibold text-white">{title}</p>
                      <p className="mt-0.5 text-sm text-slate-400">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-8 text-xs italic text-slate-500">
                The engine reads your documents; it never makes the legal call.
              </p>
            </div>

            {/* Flag example */}
            <div className="rounded-2xl border border-white/10 p-6 space-y-4" style={{ backgroundColor: '#111B34' }}>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Example — HS Code Mismatch Flag</p>
              <div className="rounded-xl border border-red-900/40 bg-red-950/30 p-4 space-y-3">
                <span className="inline-block rounded-full border border-red-700/40 bg-red-900/30 px-2.5 py-0.5 text-xs font-semibold text-red-400">
                  Critical · Zero-tolerance field
                </span>
                <p className="text-sm font-semibold text-white">HS code differs between Commercial Invoice and Bill of Lading</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { doc: 'Commercial Invoice', code: '7208.51', page: 'Page 1 · field "HS Code"' },
                    { doc: 'Bill of Lading', code: '7208.52', page: 'Page 2 · field "Commodity"' },
                  ].map(({ doc, code, page }) => (
                    <div key={doc} className="rounded-lg border border-white/10 bg-white/5 p-2.5">
                      <p className="text-[10px] text-slate-400">{doc}</p>
                      <p className="font-mono text-sm font-bold text-white">{code}</p>
                      <p className="text-[10px] text-slate-500">{page}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-teal-900/40 bg-teal-950/30 p-4">
                <p className="text-xs font-semibold text-teal-400 mb-1.5">Proposed resolution</p>
                <p className="text-sm text-slate-300">
                  "2 of 2 other documents state <span className="font-mono font-bold text-white">7208.51</span>.
                  Accept or enter an override — you decide, we record."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Results ── */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-600 mb-4">Results</p>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Trade made easy. Made certain. Made fun.
            </h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto">
              Targets and proof points labelled honestly. No unproven numbers stated as fact — honesty is the brand.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {RESULTS.map(({ value, label, desc, caveat }) => (
              <div key={label} className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                <p className="mt-1 text-sm font-semibold text-gray-700">{label}</p>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{desc}</p>
                <p className="mt-3 text-[10px] italic text-gray-400">{caveat}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TradeWatch ── */}
      <section id="tradewatch" className="py-24" style={{ backgroundColor: '#111B34' }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-400 mb-4">TradeWatch</p>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Get ahead of the news — and out of the panic.
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-slate-400">
              TradeWatch tells you what every change actually does to your shipment — in plain English,
              before it becomes a problem. It watches the noise so you don't have to.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TRADEWATCH_ITEMS.map(({ label, desc }) => (
              <div key={label} className="rounded-xl border border-white/10 p-6" style={{ backgroundColor: '#0C1220' }}>
                <div className="mb-3 h-0.5 w-8 rounded-full bg-teal-500" />
                <h3 className="font-semibold text-white mb-2">{label}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* CDS error example */}
          <div className="mt-8 rounded-2xl border border-white/10 p-6" style={{ backgroundColor: '#0C1220' }}>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
              Example — CDS rejection decoded instantly
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4">
                <p className="text-[10px] font-semibold uppercase text-red-400 mb-2">CDS rejection (raw)</p>
                <p className="font-mono text-xs text-red-300">
                  CDS40105 — Additional procedure code 000 not valid for this goods procedure combination
                </p>
              </div>
              <div className="rounded-xl border border-teal-900/40 bg-teal-950/20 p-4">
                <p className="text-[10px] font-semibold uppercase text-teal-400 mb-2">TradeWatch — plain English + fix</p>
                <p className="text-sm text-slate-300">
                  "You've used procedure 000 on a B4 entry — CDS requires a specific code here.
                  Change to <span className="font-mono font-bold text-white">1CS</span> for customs
                  warehouse discharge, or <span className="font-mono font-bold text-white">1DP</span> for duty paid goods."
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-500"
            >
              Try TradeWatch for free <ChevronRight className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-xs text-slate-500">No credit card required · CDS error explainer available immediately</p>
          </div>
        </div>
      </section>

      {/* ── TradeHub ── */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-14 lg:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 mb-4">
                On the roadmap — not live yet
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Where it's going:<br />your whole trade, in one place.
              </h2>
              <p className="mt-5 text-gray-500 leading-relaxed">
                As the network grows, Veritariff connects you to verified suppliers, importers, forwarders and
                warehouses — with your compliance record already attached. Source from suppliers whose CBAM and
                origin data is already in the system. The hustle days of begging a supplier for the data you need
                are over.
              </p>
              <p className="mt-4 font-semibold text-gray-900">
                The first trade platform where being compliant is the advantage.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { title: 'Verified supplier network', desc: 'Connect to suppliers whose CBAM, origin, and certificate data is already in the system.' },
                { title: 'Compliance as currency', desc: 'A verified shipment history becomes a financial asset — banks and insurers can underwrite it.' },
                { title: 'One shared record', desc: 'Broker, forwarder, importer, exporter — all on the same shipment record, no email chains.' },
              ].map(({ title, desc }) => (
                <div key={title} className="rounded-xl border border-gray-200 bg-gray-50 p-5 flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-teal-300 text-teal-500">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{title}</p>
                    <p className="mt-0.5 text-sm text-gray-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Manifesto ── */}
      <section id="manifesto" className="py-32" style={{ backgroundColor: '#080D18' }}>
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">The world is loud.</h2>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl lg:text-5xl" style={{ color: '#2DD4BF' }}>
            This is the calm.
          </h2>
          <p className="mt-10 text-xl text-slate-300 leading-relaxed">
            We're building the door we wish we'd had — so that moving goods across a border is something anyone
            can do, just by stepping toward it. Clearly. Without fear.
          </p>
          <p className="mt-8 text-2xl font-bold text-white">No barrier.</p>
          <p className="mt-3 text-slate-500">Global trade, finally clear.</p>
        </div>
      </section>

      {/* ── Founding Partners + CTA ── */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">
              Shaped with our founding partners
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 opacity-40">
              {['Partner A', 'Partner B', 'Partner C', 'Partner D', 'Partner E'].map((p) => (
                <div key={p} className="rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-400">
                  {p}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-16 lg:grid-cols-2 items-start">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">Ready when you are.</h2>
              <p className="mt-5 text-gray-500 leading-relaxed">
                We're working closely with a small group of customs brokers and trade teams. Give feedback,
                become a founding partner, your logo joins the wall, and you get first access to everything.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Direct line to the founding team — your view shapes the build',
                  'Founding partner pricing — the best rates we'll ever offer',
                  'Your logo on the wall + first access to TradeHub',
                  'Priority feature requests from day one',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100">
                      <Check className="h-3 w-3 text-teal-600" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-full bg-teal-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-500"
                >
                  Get early access
                </Link>
                <a
                  href="mailto:hello@veritariff.co"
                  className="inline-flex items-center justify-center rounded-full border border-gray-200 px-7 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Share your feedback
                </a>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { quote: 'The audit trail alone changes our posture with HMRC — we go into reviews with confidence now.', role: 'Customs Broker, UK' },
                { quote: 'We were overpaying duty for two years. The preference engine caught it on the first shipment.', role: 'Trade Compliance Manager, EU' },
                { quote: 'The CDS error explainer cut our rejection resolution time from hours to minutes.', role: 'Freight Forwarder, UK' },
              ].map(({ quote, role }) => (
                <div key={role} className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                  <p className="text-sm text-gray-700 leading-relaxed italic">"{quote}"</p>
                  <p className="mt-3 text-xs font-semibold text-gray-500">Founding Partner — {role}</p>
                </div>
              ))}

              <div className="rounded-xl border border-teal-200 bg-teal-50 p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-teal-900">Have a view on what trade compliance should be?</p>
                  <p className="text-xs text-teal-700 mt-0.5">Give feedback → earn a founding partner spot.</p>
                </div>
                <a
                  href="mailto:hello@veritariff.co"
                  className="ml-4 shrink-0 rounded-full bg-teal-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-500"
                >
                  Get in touch
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-12" style={{ backgroundColor: NAV_DARK }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div>
              <p className="text-sm font-bold text-white">Veritariff</p>
              <p className="mt-1 text-xs text-slate-500">The mission: trade, without the barrier.</p>
              <p className="mt-0.5 text-xs italic text-slate-600">Global trade, finally clear.</p>
            </div>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {[
                { label: 'The Workspace', href: '#workspace' },
                { label: 'TradeWatch', href: '#tradewatch' },
                { label: 'About', href: '#manifesto' },
                { label: 'Privacy Policy', href: '#' },
                { label: 'Terms', href: '#' },
                { label: 'Contact', href: 'mailto:hello@veritariff.co' },
              ].map(({ label, href }) => (
                <a key={label} href={href} className="text-xs text-slate-500 transition-colors hover:text-slate-300">
                  {label}
                </a>
              ))}
              <Link to="/login" className="text-xs text-slate-500 transition-colors hover:text-slate-300">Sign in</Link>
              <Link to="/register" className="text-xs text-slate-500 transition-colors hover:text-slate-300">Early access</Link>
            </div>

            <p className="text-xs text-slate-600">© {new Date().getFullYear()} Veritariff Ltd.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
