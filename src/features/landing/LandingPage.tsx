import { Link } from 'react-router-dom';
import {
  FileText,
  Zap,
  Mail,
  Shield,
  Users,
  BarChart3,
  ChevronRight,
  Check,
  Ship,
  Tag,
  ArrowRight,
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
      'Upload any shipping document and our AI classifies it instantly — commercial invoices, bills of lading, certificates of origin, and more. Confidence scores show you exactly how certain the system is.',
  },
  {
    icon: Ship,
    title: 'Shipment Workspace',
    description:
      'Every shipment gets a unified workspace. All related documents, references, and activity logs in one place. Track B/L, AWB, PO, container, and invoice numbers across your entire operation.',
  },
  {
    icon: Mail,
    title: 'Email Integration',
    description:
      'Connect Gmail, Microsoft 365, Outlook, or any IMAP mailbox. Attachments are automatically imported, classified, and matched to shipments — no manual sorting required.',
  },
  {
    icon: Zap,
    title: 'Automated OCR Pipeline',
    description:
      'Documents are scanned, extracted, and processed in the background the moment they arrive. Real-time status updates keep you informed at every step.',
  },
  {
    icon: Shield,
    title: 'Duplicate Detection',
    description:
      'Automatically identifies and flags duplicate documents before they create problems. Every upload is cross-referenced against existing records.',
  },
  {
    icon: Users,
    title: 'Team Management',
    description:
      'Role-based access control for Admins, Managers, and Operators. Invite team members, manage permissions, and maintain a full activity trail for compliance.',
  },
];

const DOCUMENT_TYPES = [
  'Commercial Invoice',
  'Packing List',
  'Bill of Lading',
  'Air Waybill',
  'Certificate of Origin',
  'Insurance Certificate',
  'Customs Declaration',
  'Purchase Order',
  'Delivery Order',
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Upload or connect',
    description: 'Drag & drop documents or connect your email inbox. Supports PDF and all major image formats up to 50 MB.',
  },
  {
    step: '02',
    title: 'AI classifies instantly',
    description: 'Our pipeline runs OCR and classification automatically. Each document gets a type, confidence score, and is matched to the right shipment.',
  },
  {
    step: '03',
    title: 'Review and action',
    description: 'Low-confidence items are flagged for human review. Override any classification with one click. Full audit trail kept automatically.',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">

      {/* ── Nav ── */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <span className="text-base font-semibold tracking-tight">BrokerAI</span>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">How it works</a>
            <a href="#documents" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Documents</a>
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
          Built for customs brokers & freight forwarders
        </div>

        <h1 className="mx-auto max-w-3xl text-5xl font-semibold leading-tight tracking-tight text-gray-900 sm:text-6xl">
          Shipping documents,{' '}
          <span className="text-gray-400">handled automatically.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg text-gray-500 leading-relaxed">
          BrokerAI classifies, matches, and organises every document in your supply chain —
          from the moment it arrives to the moment it's filed.
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

      {/* ── Dashboard preview ── */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-sm">
          {/* Mock browser chrome */}
          <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="h-3 w-3 rounded-full bg-green-400" />
            <div className="mx-4 flex-1 rounded-md bg-gray-100 px-3 py-1 text-xs text-gray-400">
              app.brokerai.co
            </div>
          </div>

          {/* Mock dashboard */}
          <div className="grid grid-cols-12 divide-x divide-gray-200">
            {/* Sidebar */}
            <div className="col-span-2 bg-white p-4 space-y-1">
              {['Dashboard', 'Documents', 'Shipments', 'Email', 'Users'].map((item, i) => (
                <div
                  key={item}
                  className={`rounded-md px-3 py-2 text-xs font-medium ${i === 0 ? 'bg-gray-900 text-white' : 'text-gray-500'}`}
                >
                  {item}
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="col-span-10 p-6 space-y-6">
              {/* Stat cards */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Total Shipments', value: '248', color: 'text-gray-900' },
                  { label: 'Imported Today', value: '34', color: 'text-gray-900' },
                  { label: 'Needs Classification', value: '7', color: 'text-amber-600' },
                  { label: 'Needs Review', value: '3', color: 'text-red-500' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className={`mt-1 text-2xl font-semibold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Mock table */}
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="border-b border-gray-100 px-4 py-3 text-xs font-medium text-gray-500">
                  Recent Documents
                </div>
                {[
                  { name: 'Invoice_MAEU_2024.pdf', type: 'Commercial Invoice', status: 'Matched', conf: '96%', color: 'text-green-600 bg-green-50' },
                  { name: 'BL_COSCO_Shanghai.pdf', type: 'Bill of Lading', status: 'Classified', conf: '89%', color: 'text-green-600 bg-green-50' },
                  { name: 'PackingList_Dec.pdf', type: 'Packing List', status: 'Needs Review', conf: '54%', color: 'text-amber-600 bg-amber-50' },
                  { name: 'unknown_doc_4.jpg', type: '—', status: 'OCR Pending', conf: '—', color: 'text-blue-600 bg-blue-50' },
                ].map((row) => (
                  <div key={row.name} className="flex items-center gap-4 border-b border-gray-50 px-4 py-3 text-xs last:border-0">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <span className="flex-1 font-medium text-gray-700 truncate">{row.name}</span>
                    <span className="w-32 text-gray-500">{row.type}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.color}`}>{row.status}</span>
                    <span className="w-10 text-right tabular-nums text-gray-500">{row.conf}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Everything your operation needs</h2>
          <p className="mt-3 text-gray-500">One platform for the entire document lifecycle.</p>
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
            <p className="mt-3 text-gray-500">From upload to filed — in seconds.</p>
          </div>

          <div className="grid gap-12 sm:grid-cols-3">
            {HOW_IT_WORKS.map(({ step, title, description }) => (
              <div key={step} className="relative">
                <p className="mb-4 text-5xl font-semibold text-gray-200">{step}</p>
                <h3 className="mb-2 text-base font-semibold">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>

          {/* Processing pipeline visual */}
          <div className="mt-20 overflow-hidden rounded-2xl border border-gray-200 bg-white p-8">
            <p className="mb-6 text-xs font-medium uppercase tracking-widest text-gray-400">Document pipeline</p>
            <div className="flex items-center gap-2 flex-wrap">
              {['Uploaded', 'OCR Pending', 'Processing', 'Classified', 'Matched'].map((stage, i, arr) => (
                <div key={stage} className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                    i === 3
                      ? 'bg-green-100 text-green-700'
                      : i === 4
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    {i === 4 && <Check className="h-3.5 w-3.5" />}
                    {stage}
                  </div>
                  {i < arr.length - 1 && (
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                  )}
                </div>
              ))}
            </div>

            {/* Confidence levels */}
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

      {/* ── Document types ── */}
      <section id="documents" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Every document type, covered</h2>
          <p className="mt-3 text-gray-500">Trained on the full range of international trade documentation.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {DOCUMENT_TYPES.map((type) => (
            <div
              key={type}
              className="flex items-center gap-2 rounded-full border border-gray-200 px-5 py-2.5 text-sm text-gray-700"
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
            { icon: FileText, label: 'Office', desc: 'DOCX, XLSX' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-4 rounded-2xl border border-gray-200 p-5">
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
      </section>

      {/* ── CTA ── */}
      <section className="bg-gray-900 py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl font-semibold text-white tracking-tight">
            Ready to automate your document workflow?
          </h2>
          <p className="mt-4 text-gray-400">
            Get started in minutes. No credit card required.
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
          <span className="text-sm font-semibold">BrokerAI</span>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} BrokerAI. Built for customs brokers and freight forwarders.
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
