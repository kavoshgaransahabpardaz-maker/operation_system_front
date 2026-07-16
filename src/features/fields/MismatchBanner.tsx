import { Link } from 'react-router-dom';
import { AlertOctagon, AlertTriangle } from 'lucide-react';
import { FIELD_NAME_LABELS } from '@/lib/constants';
import type { DocumentSummary, FieldMismatch, ShipmentMismatchOut } from '@/types';

interface Props {
  data: ShipmentMismatchOut;
  documents: DocumentSummary[];
}

function filenameFor(documentId: string, documents: DocumentSummary[]): string {
  return documents.find((d) => d.id === documentId)?.filename ?? documentId.slice(0, 8);
}

function MismatchRow({ mismatch, documents }: { mismatch: FieldMismatch; documents: DocumentSummary[] }) {
  const isError = mismatch.severity === 'error';
  const Icon = isError ? AlertOctagon : AlertTriangle;
  const label = FIELD_NAME_LABELS[mismatch.field_name] ?? mismatch.field_name;

  return (
    <div
      className={`rounded-lg border p-3 ${
        isError
          ? 'border-red-200 bg-red-50'
          : 'border-amber-200 bg-amber-50'
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Icon
          className={`h-3.5 w-3.5 shrink-0 ${isError ? 'text-red-600' : 'text-amber-600'}`}
        />
        <span
          className={`text-xs font-semibold uppercase tracking-wide ${
            isError ? 'text-red-700' : 'text-amber-700'
          }`}
        >
          {isError ? 'error' : 'warning'}
        </span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <ul className="space-y-0.5 pl-5">
        {mismatch.values.map((v) => (
          <li key={v.document_id} className="text-xs text-muted-foreground">
            <Link
              to={`/documents/${v.document_id}`}
              className="font-medium text-primary hover:underline"
            >
              {filenameFor(v.document_id, documents)}
            </Link>
            {': '}
            <span className="font-mono">{v.value_normalized ?? v.value_raw}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MismatchBanner({ data, documents }: Props) {
  if (!data.mismatches.length) return null;

  const errors = data.mismatches.filter((m) => m.severity === 'error');
  const warnings = data.mismatches.filter((m) => m.severity === 'warning');

  return (
    <div className="rounded-xl border border-red-200 bg-background">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <AlertOctagon className="h-4 w-4 text-red-500" />
        <h2 className="font-semibold text-sm">
          {data.mismatches.length} field conflict{data.mismatches.length !== 1 ? 's' : ''} detected
        </h2>
        {errors.length > 0 && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            {errors.length} error{errors.length !== 1 ? 's' : ''}
          </span>
        )}
        {warnings.length > 0 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="space-y-2 p-4">
        {[...errors, ...warnings].map((m) => (
          <MismatchRow key={m.field_name} mismatch={m} documents={documents} />
        ))}
      </div>
    </div>
  );
}
