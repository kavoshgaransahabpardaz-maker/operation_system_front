import { Link } from 'react-router-dom';
import {
  FileText, Mail, Shield, Users, BarChart3, ChevronRight, Check,
  Ship, Tag, ArrowRight, AlertTriangle, GitCompare, Newspaper,
  Search, Bell, Lightbulb, Network, Star, Globe2,
} from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────

const STATS = [
  { value: '10x', label: 'Faster processing' },
  { value: '99%', label: 'Classification accuracy' },
  { value: '50+', label: 'Document types handled' },
  { value: '24/7', label: 'Automated monitoring' },
];

const FEATURES = [
  {
    icon: FileText,
    title: 'Intelligent Document Classification',
    description:
      'Upload any shipping document and our AI classifies it instantly — commercial invoices, bills of lading, certificates of origin, CMR notes, mill certificates, and more. Confidence scores show exactly how certain the system is.',
  },
  {
    icon: Ship,
    title: 'Shipment Workspace',
    description:
      'Every shipment gets a unified workspace. All related documents, extracted fields, flags, and activity logs in one place. Track B/L, AWB, PO, container, and invoice numbers across your entire operation.',
  },
  {
    icon: GitCompare,
    title: 'Field Extraction & Cross-Check',
    description:
      'Key fields — shipper, consignee, invoice value, HS code, country of origin, incoterm — are extracted from every document. Mismatches and zero-tolerance discrepancies are flagged automatically.',
  },
  {
    icon: AlertTriangle,
    title: 'Intelligent Issue Flagging',
    description:
      'Missing documents, field mismatches, low-confidence extractions, and HS code inconsistencies surface as ranked flags. Each flag links directly to its source page in the original document — one click, no guessing.',
  },
  {
    icon: Mail,
    title: 'Email Integration',
    description:
      'Connect Gmail, Microsoft 365, Outlook, or any IMAP mailbox. Attachments are automatically imported, classified, and matched to shipments — no manual sorting required.',
  },
  {
    icon: Newspaper,
    title: 'Personalised Trade Intelligence',
    description:
      'Subscribe to HS codes, countries, trade lanes, industries, and party names. Your feed shows only what matters to your shipments — with AI-generated summaries tailored to your specific interests, not a generic news feed.',
  },
  {
    icon: Network,
    title: 'Knowledge Graph',
    description:
      'Explore the web of relationships between trade regulations, HS codes, countries, and parties. See how a new tariff ruling connects to your active lanes and suppliers — visually, not as a flat list.',
  },
  {
    icon: Lightbulb,
    title: 'AI-Assisted Resolution',
    description:
      'When flags need a decision, the system proposes values with citations from source documents — "3 of 4 documents state EUR". You review, choose, and confirm. Nothing is auto-resolved without your approval.',
  },
  {
    icon: Shield,
    title: 'Full Audit Trail',
    description:
      'Every extraction, correction, flag resolution, and status change is logged with who did it and when. Resolved flags never disappear — they collapse into an audit section. Always audit-ready.',
  },
  {
    icon: Globe2,
    title: 'Curated Source Preferences',
    description:
      'Control which trade intelligence sources feed into your dashboard. Enable or disable sources by category — regulatory bodies, industry publications, sanctions lists — so your feed stays signal, not noise.',
  },
  {
    icon: Star,
    title: 'Interest-Based Alerts',
    description:
      'Set email alerts for HS chapters, headings, or 6-digit codes, specific countries, named parties, and industries. Critical sanctions hits automatically escalate to flags inside the affected shipment.',
  },
  {
    icon: Users,
    title: 'Team Management',
    description:
      'Role-based access control for Admins, Managers, and Operators. Invite team members by email — they sign in with Google, no passwords to manage. Full activity trail for compliance.',
  },
];

const DOCUMENT_TYPES = [
  'Commercial Invoice', 'Packing List', 'Bill of Lading', 'Air Waybill',
  'Certificate of Origin', 'Insurance Certificate', 'Customs Declaration',
  'Purchase Order', 'Delivery Order', 'Mill Certificate', "Supplier's Declaration", 'CMR Consignment Note',
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Upload or connect',
    description: 'Drag & drop documents or connect your email inbox. Supports PDF and all major image formats up to 50 MB.',
  },
  {
    step: '02',
    title: 'AI extracts and cross-checks',
    description: 'OCR, classification, field extraction, and cross-document comparison run automatically. Mismatches and missing items surface as ranked flags with source links.',
  },
  {
    step: '03',
    title: 'Review, decide, and clear',
    description: 'Work through flagged issues with source pages one click away. Confirm fields, resolve flags, and mark the shipment clear — every action logged.',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">

      {/* ── Nav ── */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <span className="text-base font-semibold tracking-tight">Veritariff</span>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">How it works</a>
            <a href="#intel" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Intelligence</a>
            <Link
              to="/login"
              className="rounded-full bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-36 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-xs font-medium text-gray-600 mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Built for customs brokers &amp; freight forwarders
        </div>

        <h1 className="mx-auto max-w-3xl text-5xl font-semibold leading-tight tracking-tight text-gray-900 sm:text-6xl">
          Shipping compliance,{' '}
          <span className="text-gray-400">verified automatically.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500 leading-relaxed">
          Veritariff classifies documents, extracts key fields, cross-checks for mismatches, and flags issues
          — with every value traceable to its exact source page. Plus personalised trade intelligence matched to your shipments, HS codes, and trade lanes.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
          >
            Get started free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Sign in <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-gray-200 sm:grid-cols-4">
          {STATS.map(({ value, label }) => (
            <div key={label} className="bg-gray-50 px-8 py-10 text-center">
              <p className="text-4xl font-semibold tracking-tight text-gray-900">{value}</p>
              <p className="mt-1 text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── App preview ── */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-sm">
          {/* Mock browser chrome */}
          <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="h-3 w-3 rounded-full bg-green-400" />
            <div className="mx-4 flex-1 rounded-md bg-gray-100 px-3 py-1 text-xs text-gray-400">
              app.veritariff.co
            </div>
          </div>

          {/* Mock dashboard */}
          <div className="grid grid-cols-12 divide-x divide-gray-200">
            {/* Sidebar */}
            <div className="col-span-2 bg-slate-900 p-3 space-y-0.5">
              {['Dashboard', 'Documents', 'Shipments', 'Email', 'Intelligence', 'Sources'].map((item, i) => (
                <div
                  key={item}
                  className={`rounded-md px-3 py-2 text-xs font-medium ${
                    i === 0 ? 'bg-white/10 text-white' : 'text-slate-400'
                  }`}
                >
                  {item}
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="col-span-10 p-5 space-y-5">
              {/* Stat cards */}
              <div className="grid grid-cols-6 gap-3">
                {[
                  { label: 'Total Shipments', value: '248', color: 'text-gray-900', bg: '' },
                  { label: 'Imported Today', value: '34', color: 'text-gray-900', bg: '' },
                  { label: 'Needs Classification', value: '7', color: 'text-gray-900', bg: '' },
                  { label: 'Needs Review', value: '3', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
                  { label: 'Critical Issues', value: '2', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
                  { label: 'Intel Matched', value: '11', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className={`rounded-xl border p-3 ${bg || 'bg-white border-gray-200'}`}>
                    <p className="text-[10px] text-gray-500 leading-tight">{label}</p>
                    <p className={`mt-1 text-xl font-bold tabular-nums ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Mock shipment issue */}
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-xs font-medium text-red-800">2 open issues — review required</p>
                <span className="ml-auto text-xs text-red-600 underline cursor-pointer">Review</span>
              </div>

              {/* Mock intel card */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 px-4 py-3 flex items-center gap-3">
                <Newspaper className="h-4 w-4 text-blue-500 shrink-0" />
                <p className="text-xs font-medium text-blue-800">EU anti-dumping duty update matched to 4 shipments — <span className="underline cursor-pointer">View intel</span></p>
                <span className="ml-auto rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700">Impact 4/5</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Everything your operation needs</h2>
          <p className="mt-3 text-gray-500">One platform for the entire compliance lifecycle — documents, shipments, and trade intelligence.</p>
        </div>

        <div className="grid gap-px bg-gray-200 sm:grid-cols-2 lg:grid-cols-3 rounded-2xl overflow-hidden">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="bg-white p-8 hover:bg-gray-50 transition-colors">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                <Icon className="h-5 w-5 text-gray-700" />
              </div>
              <h3 className="mb-2 text-base font-semibold">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="bg-gray-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
            <p className="mt-3 text-gray-500">From upload to cleared — every step logged.</p>
          </div>

          <div className="grid gap-12 sm:grid-cols-3">
            {HOW_IT_WORKS.map(({ step, title, description }) => (
              <div key={step}>
                <p className="mb-4 text-5xl font-semibold text-gray-200">{step}</p>
                <h3 className="mb-2 text-base font-semibold">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>

          {/* Pipeline visual */}
          <div className="mt-20 overflow-hidden rounded-2xl border border-gray-200 bg-white p-8">
            <p className="mb-6 text-xs font-medium uppercase tracking-widest text-gray-400">Document pipeline</p>
            <div className="flex items-center gap-2 flex-wrap">
              {['Uploaded', 'OCR Pending', 'Processing', 'Fields Extracted', 'Matched'].map((stage, i, arr) => (
                <div key={stage} className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                    i === 3 ? 'bg-green-100 text-green-700'
                    : i === 4 ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-600'
                  }`}>
                    {i === 4 && <Check className="h-3.5 w-3.5" />}
                    {stage}
                  </div>
                  {i < arr.length - 1 && <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />}
                </div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { label: 'High confidence', range: '≥ 70%', bar: 'bg-green-500', width: 'w-3/4', desc: 'Auto-matched to shipment' },
                { label: 'Needs review', range: '50–69%', bar: 'bg-amber-500', width: 'w-1/2', desc: 'Flagged for human review' },
                { label: 'Low confidence', range: '< 50%', bar: 'bg-red-400', width: 'w-1/4', desc: 'Manual override recommended' },
              ].map(({ label, range, bar, width, desc }) => (
                <div key={label} className="rounded-xl border border-gray-100 p-4">
                  <div className="mb-3 h-1.5 w-full rounded-full bg-gray-100">
                    <div className={`h-1.5 rounded-full ${bar} ${width}`} />
                  </div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-gray-400">{range} — {desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trade Intelligence ── */}
      <section id="intel" className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-16 lg:grid-cols-2 items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              <Newspaper className="h-3.5 w-3.5" /> Trade Intelligence
            </div>
            <h2 className="text-3xl font-semibold tracking-tight">Stay ahead of regulatory changes</h2>
            <p className="mt-4 text-gray-500 leading-relaxed">
              Veritariff monitors tariff changes, sanctions updates, trade agreements, and market notices — and matches them to your actual shipments, HS codes, and trade lanes. Not a generic news feed.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                { icon: Search, text: 'Semantic search and filters across all trade intelligence events' },
                { icon: Bell, text: 'Email alerts for events matching your HS codes, countries, industries, and named parties' },
                { icon: Lightbulb, text: 'AI-generated summaries of articles tailored to your specific active shipments and interests' },
                { icon: Network, text: 'Knowledge graph to explore how regulations, parties, and HS codes interconnect' },
                { icon: Ship, text: 'Intel tab inside each shipment — only events matched to that specific shipment' },
                { icon: AlertTriangle, text: 'Sanctions hits escalate as critical flags, not buried news items' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <Icon className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600">{text}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Mock intel card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400">Live example</p>

            {[
              {
                type: 'Tariff Change', typeColor: 'bg-orange-100 text-orange-700',
                title: 'EU raises anti-dumping duties on hot-rolled steel (HS 7208)',
                reason: 'Matches HS 7208 — 4 of your active shipments',
                impact: 'Impact 4/5',
                impactColor: 'bg-orange-100 text-orange-700',
              },
              {
                type: 'Trade Agreement', typeColor: 'bg-green-100 text-green-700',
                title: 'UK–India FTA: preferential rates for textile chapters 50–63',
                reason: 'Lane IN→GB — 2 open shipments, matches HS chapter 52',
                impact: 'Impact 3/5',
                impactColor: 'bg-amber-100 text-amber-700',
              },
            ].map((card) => (
              <div key={card.title} className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${card.typeColor}`}>{card.type}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${card.impactColor}`}>{card.impact}</span>
                  <span className="rounded-full bg-blue-100 border border-blue-200 px-2 py-0.5 text-xs font-medium text-blue-700">Matched</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{card.title}</p>
                <div className="rounded-lg bg-blue-100 px-3 py-2 text-xs text-blue-800">
                  <span className="font-semibold">Why this matters: </span>{card.reason}
                </div>
              </div>
            ))}

            {/* Personalised summary teaser */}
            <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-500">AI Summary — your shipments</p>
              <p className="text-xs text-gray-700 leading-relaxed">
                "This ruling directly affects shipment BL-2024-0041 (steel coils, CN→DE). The 12.4% additional duty applies from 01 Feb — consider adjusting the declared customs value before clearance."
              </p>
              <p className="text-[10px] text-gray-400">Generated from 3 matched interests: HS 7208, China, Steel Industry</p>
            </div>

            <p className="text-[11px] italic text-gray-400">
              Impact scores are model estimates — not verified compliance flags. Sanctions hits appear as critical flags in each shipment's Flags tab.
            </p>
          </div>
        </div>
      </section>

      {/* ── Document types ── */}
      <section id="documents" className="bg-gray-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Every document type, covered</h2>
            <p className="mt-3 text-gray-500">Trained on the full range of international trade documentation.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {DOCUMENT_TYPES.map((type) => (
              <div
                key={type}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm text-gray-700"
              >
                <Tag className="h-3.5 w-3.5 text-gray-400" />
                {type}
              </div>
            ))}
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              { icon: FileText, label: 'PDF', desc: 'Scanned or digital' },
              { icon: BarChart3, label: 'Images', desc: 'JPG, PNG — any quality' },
              { icon: FileText, label: 'Office', desc: 'DOCX, XLSX, CSV' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                  <Icon className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-gray-900 py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl font-semibold text-white tracking-tight">
            Ready to automate your compliance workflow?
          </h2>
          <p className="mt-4 text-gray-400">
            Sign up with Google in seconds. No credit card required.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors"
            >
              Create free account <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full border border-gray-700 px-6 py-3 text-sm font-medium text-gray-300 hover:border-gray-500 hover:text-white transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <span className="text-sm font-semibold">Veritariff</span>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Veritariff. Built for customs brokers and freight forwarders.
          </p>
          <div className="flex gap-5">
            <Link to="/login" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Sign in</Link>
            <Link to="/register" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Register</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
