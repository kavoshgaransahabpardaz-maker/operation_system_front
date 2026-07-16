import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronDown } from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────

type WorkspaceTab = 'broker' | 'importer' | 'exporter';

const WORKSPACE_TABS: { id: WorkspaceTab; label: string; headline: string; sub: string; bullets: string[] }[] = [
  {
    id: 'broker',
    label: 'Customs Broker',
    headline: 'Pre-declaration ready in 8 minutes.',
    sub: 'From document upload to a cleared, flagged, audit-ready package — faster than a coffee break.',
    bullets: [
      '12 document types classified automatically',
      'Key fields extracted with source-page links',
      'HS code suggestion from description or commodity',
      'Cross-document mismatch flags — zero-tolerance fields always caught',
      'Full audit trail: who changed what and when',
      'Email import from Gmail, Microsoft 365, or any IMAP mailbox',
      'Unified shipment workspace — every document in one place',
      'Role-based team access for Admin, Manager, and Operator',
    ],
  },
  {
    id: 'importer',
    label: 'Importer',
    headline: 'Know your liability before the goods move.',
    sub: 'Duty estimates, preference validation, and origin checks — before declaration, not after.',
    bullets: [
      'Customs value verified against invoice and packing list',
      'Duty liability estimate before declaration',
      'Preference certificate and country-of-origin validation',
      'Missing or expired document alerts',
      'Trade intelligence filtered to your HS codes and lanes',
      'Sanctions and restricted-party screening alerts',
    ],
  },
  {
    id: 'exporter',
    label: 'Exporter',
    headline: 'Export controls and origin — handled.',
    sub: 'Identify dual-use items, calculate origin, and confirm preference eligibility before shipment.',
    bullets: [
      'Export licence check against commodity and destination',
      'Dual-use classification support',
      'Origin calculation under substantial transformation rules',
      'Supplier declaration and REX validation',
      'Trade agreement preference rate identification',
    ],
  },
];

const STATS: { value: string; label: string; caveat: string }[] = [
  { value: '<8 min', label: 'Average pre-declaration prep', caveat: 'Target — pilot data' },
  { value: '100%', label: 'Audit trail coverage', caveat: 'Every field, every change' },
  { value: '12', label: 'Document types recognised', caveat: 'At launch' },
  { value: '3×', label: 'Faster issue triage', caveat: 'vs. manual review — roadmap' },
];

const TRADEWATCH_ITEMS: { title: string; desc: string }[] = [
  {
    title: 'Tariff & duty changes',
    desc: 'Anti-dumping rulings, MFN rate revisions, and suspension notices matched to your HS chapters.',
  },
  {
    title: 'Sanctions & restricted parties',
    desc: 'OFAC, EU, and UKOFSI updates cross-referenced against named parties in your shipments.',
  },
  {
    title: 'Trade agreements',
    desc: 'Preferential rate changes, new FTA entry-into-force dates, and quota updates on your lanes.',
  },
  {
    title: 'Regulatory notices',
    desc: 'HMRC, CBAM, and Border Target Operating Model changes flagged before they affect your clearances.',
  },
];

const NAV_LINKS = [
  { label: 'The Workspace', href: '#workspace' },
  { label: 'TradeWatch', href: '#tradewatch' },
  { label: 'About', href: '#manifesto' },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function WorkspaceMockup({ tab }: { tab: WorkspaceTab }) {
  const colours: Record<WorkspaceTab, string> = {
    broker: 'bg-teal-600',
    importer: 'bg-violet-600',
    exporter: 'bg-sky-600',
  };
  const textColours: Record<WorkspaceTab, string> = {
    broker: 'text-teal-600',
    importer: 'text-violet-600',
    exporter: 'text-sky-600',
  };
  const labels: Record<WorkspaceTab, string[]> = {
    broker: ['Commercial Invoice', 'Bill of Lading', 'Packing List', 'Certificate of Origin'],
    importer: ['Duty Estimate', 'Preference Certificate', 'Origin Declaration', 'Customs Value'],
    exporter: ['Export Licence', 'Dual-Use Check', 'Origin Calculation', 'Supplier Declaration'],
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
      {/* browser chrome */}
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        <div className="mx-4 flex-1 rounded bg-white px-3 py-0.5 text-[11px] text-gray-400 border border-gray-200">
          app.veritariff.co
        </div>
      </div>

      {/* sidebar + content */}
      <div className="flex min-h-[260px]">
        <div className="w-28 shrink-0 border-r border-gray-100 bg-slate-900 p-2.5 space-y-0.5">
          {['Dashboard', 'Workspace', 'TradeWatch', 'Intel', 'Admin'].map((item, i) => (
            <div
              key={item}
              className={`rounded px-2.5 py-1.5 text-[11px] font-medium ${
                i === 1 ? 'bg-white/10 text-white' : 'text-slate-400'
              }`}
            >
              {item}
            </div>
          ))}
        </div>

        <div className="flex-1 p-4 space-y-3">
          {/* status row */}
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${colours[tab]}`} />
            <span className="text-[11px] font-semibold text-gray-700">
              Shipment BL-2024-0041 — Active
            </span>
            <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
              Cleared
            </span>
          </div>

          {/* document chips */}
          <div className="flex flex-wrap gap-1.5">
            {labels[tab].map((l) => (
              <span
                key={l}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-700"
              >
                <Check className={`h-3 w-3 ${textColours[tab]}`} />
                {l}
              </span>
            ))}
          </div>

          {/* progress bar */}
          <div className="relative h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div className={`absolute inset-y-0 left-0 w-3/4 rounded-full ${colours[tab]}`} />
          </div>
          <p className="text-[10px] text-gray-400">3 of 4 documents matched — 0 critical flags</p>

          {/* flag row */}
          <div className="rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${colours[tab]}`} />
            <p className="text-[11px] text-teal-800 font-medium">All zero-tolerance fields match across documents</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function LandingPage() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('broker');
  const [expandedCard, setExpandedCard] = useState<WorkspaceTab | null>(null);
  const tab = WORKSPACE_TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="min-h-screen text-gray-900 antialiased" style={{ backgroundColor: '#FAF9F5' }}>

      {/* ── Nav ── */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-gray-200/60 backdrop-blur-md" style={{ backgroundColor: 'rgba(250,249,245,0.92)' }}>
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <span className="text-sm font-bold tracking-tight text-gray-900">Veritariff</span>

          <div className="hidden items-center gap-7 sm:flex">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-sm text-gray-500 transition-colors hover:text-gray-900"
              >
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-gray-500 transition-colors hover:text-gray-900"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-teal-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
            >
              Get early access
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-36 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-xs font-medium text-teal-700 mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
          Built for UK–EU customs compliance
        </div>

        <h1 className="mx-auto max-w-3xl text-5xl font-bold leading-[1.12] tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
          Trade made easy.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500 leading-relaxed">
          One platform for UK–EU customs compliance. Classify documents, check HS codes, flag mismatches,
          and stay ahead of regulatory changes — with a full audit trail on every decision.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
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
      </section>

      {/* ── The Workspace ── */}
      <section id="workspace" className="py-24 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-600">The Workspace</p>
          </div>
          <h2 className="mx-auto max-w-2xl text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            One engine. Three lenses. Total control.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-gray-500">
            The same deterministic compliance engine — surfaced differently for every role in your trade operation.
          </p>

          {/* ── Desktop: tab switcher ── */}
          <div className="mt-14 hidden lg:block">
            <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit mx-auto">
              {WORKSPACE_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`rounded-lg px-6 py-2 text-sm font-medium transition-all ${
                    activeTab === t.id
                      ? 'bg-white shadow-sm text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-2 gap-12 items-start">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{tab.headline}</h3>
                <p className="mt-3 text-gray-500 leading-relaxed">{tab.sub}</p>
                <ul className="mt-8 space-y-3">
                  {tab.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100">
                        <Check className="h-3 w-3 text-teal-600" />
                      </span>
                      <span className="text-sm text-gray-700">{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
                  >
                    Get early access
                  </Link>
                </div>
              </div>

              <WorkspaceMockup tab={activeTab} />
            </div>
          </div>

          {/* ── Mobile: stacked expandable cards ── */}
          <div className="mt-10 space-y-3 lg:hidden">
            {WORKSPACE_TABS.map((t) => {
              const open = expandedCard === t.id;
              return (
                <div key={t.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                    onClick={() => setExpandedCard(open ? null : t.id)}
                  >
                    <span className="font-semibold text-gray-900">{t.label}</span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && (
                    <div className="px-5 pb-5 space-y-4 border-t border-gray-100">
                      <p className="mt-4 text-sm font-semibold text-gray-900">{t.headline}</p>
                      <p className="text-sm text-gray-500">{t.sub}</p>
                      <ul className="space-y-2.5">
                        {t.bullets.map((b) => (
                          <li key={b} className="flex items-start gap-2.5">
                            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-teal-100">
                              <Check className="h-2.5 w-2.5 text-teal-600" />
                            </span>
                            <span className="text-sm text-gray-700">{b}</span>
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
      <section className="py-24" style={{ backgroundColor: '#FAF9F5' }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-16 lg:grid-cols-2 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-teal-600 mb-4">The Engine</p>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Flag, don't guess.
              </h2>
              <p className="mt-5 text-gray-500 leading-relaxed">
                Veritariff doesn't produce probabilities and call them decisions. Every flag is tied to a
                specific document field, a specific source page, and a specific rule. You get cited logic — not
                a black box.
              </p>
              <div className="mt-8 space-y-5">
                {[
                  {
                    title: 'Cited',
                    desc: 'Every extracted value links to the exact page and field in the original document. One click, no hunting.',
                  },
                  {
                    title: 'Expert-validated',
                    desc: 'Built alongside practising customs brokers and trade compliance specialists — not assembled from generic datasets.',
                  },
                  {
                    title: 'Data stays yours',
                    desc: 'Your documents are never used for training. Processed, stored securely, returned to you — full stop.',
                  },
                ].map(({ title, desc }) => (
                  <div key={title} className="flex items-start gap-4">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white text-xs">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900">{title}</p>
                      <p className="mt-1 text-sm text-gray-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Example flag card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Example flag</p>
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-red-100 border border-red-200 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                    Critical — HS Code Mismatch
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  HS code differs between Commercial Invoice and Bill of Lading
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-white border border-red-100 p-2">
                    <p className="text-gray-400">Commercial Invoice</p>
                    <p className="font-mono font-bold text-gray-900 mt-0.5">7208.51</p>
                    <p className="text-gray-400 mt-0.5">Page 1, field "HS Code"</p>
                  </div>
                  <div className="rounded-lg bg-white border border-red-100 p-2">
                    <p className="text-gray-400">Bill of Lading</p>
                    <p className="font-mono font-bold text-gray-900 mt-0.5">7208.52</p>
                    <p className="text-gray-400 mt-0.5">Page 2, field "Commodity"</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 italic">
                  Zero-tolerance field — flagged regardless of tolerance settings.
                </p>
              </div>
              <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
                <p className="text-xs font-semibold text-teal-700 mb-1">Proposed resolution</p>
                <p className="text-sm text-gray-700">
                  "2 of 2 other documents state <span className="font-mono font-bold">7208.51</span>. Accept or override."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Results ── */}
      <section className="py-24 bg-gray-900">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-400 mb-4">Results</p>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              What we're building toward.
            </h2>
            <p className="mt-4 text-gray-400">
              Early data and design targets — labelled honestly.
            </p>
          </div>

          <div className="grid gap-px bg-gray-800 sm:grid-cols-2 lg:grid-cols-4 rounded-2xl overflow-hidden">
            {STATS.map(({ value, label, caveat }) => (
              <div key={label} className="bg-gray-900 px-8 py-10 text-center">
                <p className="text-4xl font-bold tracking-tight text-white">{value}</p>
                <p className="mt-2 text-sm text-gray-300">{label}</p>
                <p className="mt-2 text-xs text-gray-500 italic">{caveat}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TradeWatch ── */}
      <section id="tradewatch" className="py-24 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-600 mb-4">TradeWatch</p>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              The regulatory world moves fast.
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-gray-500">
              TradeWatch monitors the sources that matter and delivers only what's relevant to your
              shipments, HS codes, and trade lanes.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRADEWATCH_ITEMS.map(({ title, desc }) => (
              <div key={title} className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                <div className="mb-3 h-1 w-8 rounded-full bg-teal-500" />
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Live example */}
          <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Example alert</p>
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-orange-200 bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                  Tariff Change
                </span>
                <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                  Impact 4/5
                </span>
                <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
                  Matched to your shipments
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                EU raises anti-dumping duties on hot-rolled steel — HS 7208
              </p>
              <div className="rounded-lg bg-orange-100/60 px-3 py-2 text-xs text-orange-800">
                <span className="font-semibold">Why this matters: </span>
                Matches HS 7208 — 4 of your active shipments on the CN→DE lane.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TradeHub ── */}
      <section className="py-24" style={{ backgroundColor: '#FAF9F5' }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-14 lg:grid-cols-2 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-teal-600 mb-4">TradeHub — Roadmap</p>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                A network where every member makes everyone smarter.
              </h2>
              <p className="mt-5 text-gray-500 leading-relaxed">
                TradeHub is the long-term vision: a shared intelligence layer across Veritariff users.
                Anonymised classification patterns, HS code precedents, and ruling outcomes — pooled
                across the network, improving accuracy for everyone.
              </p>
              <p className="mt-4 text-sm text-gray-400 italic">
                Coming after core workspace — building the right foundations first.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { title: 'Shared HS precedents', desc: 'Classification decisions (anonymised) surface as community precedents for similar commodities.' },
                { title: 'Ruling database', desc: 'BTI rulings and advance tariff decisions indexed and searchable across the network.' },
                { title: 'Lane intelligence', desc: 'Aggregate duty rates, document requirements, and clearance times by trade lane.' },
              ].map(({ title, desc }) => (
                <div key={title} className="rounded-xl border border-gray-200 bg-white p-5 flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-teal-300 text-teal-500 text-sm font-bold">
                    →
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
      <section id="manifesto" className="py-28 bg-gray-900">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-2xl font-bold leading-snug text-white sm:text-3xl lg:text-4xl">
            "The world is loud.<br />
            <span className="text-teal-400">This is the calm."</span>
          </p>
          <p className="mt-8 text-lg text-gray-300 leading-relaxed">
            Trade compliance doesn't have to mean chasing attachments, second-guessing HS codes, and
            hoping the auditor never calls. It can be clear, traceable, and under control.
          </p>
          <p className="mt-6 text-lg font-semibold text-white">
            No barrier. Just trade — done right.
          </p>
          <p className="mt-3 text-gray-400">
            Global trade, finally clear.
          </p>
        </div>
      </section>

      {/* ── Founding Partners + CTA ── */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-16 lg:grid-cols-2 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-teal-600 mb-4">Founding Partners</p>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                Ready when you are.
              </h2>
              <p className="mt-5 text-gray-500 leading-relaxed">
                We're working closely with a small group of customs brokers and trade teams during early
                access. Your feedback shapes the product — and you get the best rates we'll ever offer.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Direct line to the founding team',
                  'Priority feature requests',
                  'Founding partner pricing — locked in',
                  'Early access to TradeHub when it launches',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100">
                      <Check className="h-3 w-3 text-teal-600" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link
                  to="/register"
                  className="inline-flex items-center rounded-full bg-teal-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
                >
                  Apply for early access
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  quote: "Finally, a tool that actually understands what a customs broker does. The audit trail alone is worth it.",
                  name: 'Founding Partner',
                  role: 'Customs Broker, UK',
                },
                {
                  quote: "The HS code suggestion from description saved us hours in the first week alone.",
                  name: 'Founding Partner',
                  role: 'Trade Compliance Manager, EU',
                },
              ].map(({ quote, name, role }) => (
                <div key={role} className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                  <p className="text-sm text-gray-700 leading-relaxed italic">"{quote}"</p>
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-900">{name}</p>
                    <p className="text-xs text-gray-500">{role}</p>
                  </div>
                </div>
              ))}

              <div className="rounded-xl border border-teal-200 bg-teal-50 p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-teal-900">Spots limited</p>
                  <p className="text-xs text-teal-700 mt-0.5">Onboarding founding partners in cohorts</p>
                </div>
                <Link
                  to="/register"
                  className="rounded-full bg-teal-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-700 whitespace-nowrap"
                >
                  Join waitlist
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div>
              <p className="text-sm font-bold text-gray-900">Veritariff</p>
              <p className="mt-1 text-xs text-gray-400">Global trade, finally clear.</p>
            </div>

            <div className="flex flex-wrap justify-center gap-6">
              <a href="#workspace" className="text-xs text-gray-400 transition-colors hover:text-gray-700">The Workspace</a>
              <a href="#tradewatch" className="text-xs text-gray-400 transition-colors hover:text-gray-700">TradeWatch</a>
              <a href="#manifesto" className="text-xs text-gray-400 transition-colors hover:text-gray-700">About</a>
              <Link to="/login" className="text-xs text-gray-400 transition-colors hover:text-gray-700">Sign in</Link>
              <Link to="/register" className="text-xs text-gray-400 transition-colors hover:text-gray-700">Early access</Link>
            </div>

            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Veritariff Ltd.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
