import { Link } from 'react-router-dom';
import { AlertOctagon, AlertTriangle } from 'lucide-react';
import { FIELD_NAME_LABELS } from '@/lib/constants';
import type { DocumentSummary, FieldMismatch, ProductGroupMismatch, UnmatchedProduct, ShipmentMismatchOut, FieldName } from '@/types';

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
  const label = FIELD_NAME_LABELS[mismatch.field_name as FieldName] ?? mismatch.field_name;

  return (
    <div
      className={`rounded-lg border p-3 ${
        isError ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={`h-3.5 w-3.5 shrink-0 ${isError ? 'text-red-600' : 'text-amber-600'}`} />
        <span className={`text-xs font-semibold uppercase tracking-wide ${isError ? 'text-red-700' : 'text-amber-700'}`}>
          {isError ? 'error' : 'warning'}
        </span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <ul className="space-y-0.5 pl-5">
        {mismatch.values.map((v) => (
          <li key={v.document_id} className="text-xs text-muted-foreground">
            <Link to={`/documents/${v.document_id}`} className="font-medium text-primary hover:underline">
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

function ProductGroupRow({
  group,
  documents,
}: {
  group: ProductGroupMismatch;
  documents: DocumentSummary[];
}) {
  const errors = group.field_mismatches.filter((m) => m.severity === 'error');
  const warnings = group.field_mismatches.filter((m) => m.severity === 'warning');

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Product</span>
        <span className="text-sm font-medium font-mono">{group.product_key}</span>
        {group.hs_code && (
          <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-700 font-mono">
            HS {group.hs_code}
          </span>
        )}
        {errors.length > 0 && (
          <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
            {errors.length} error{errors.length !== 1 ? 's' : ''}
          </span>
        )}
        {warnings.length > 0 && (
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
            {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="space-y-1.5 pl-2">
        {[...errors, ...warnings].map((fm) => {
          const isError = fm.severity === 'error';
          const Icon = isError ? AlertOctagon : AlertTriangle;
          return (
            <div key={fm.field_name} className={`rounded border p-2 ${isError ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`h-3 w-3 shrink-0 ${isError ? 'text-red-600' : 'text-amber-600'}`} />
                <span className="text-xs font-medium">{fm.display_label}</span>
              </div>
              <ul className="space-y-0.5 pl-4">
                {fm.values.map((v) => (
                  <li key={v.product_id} className="text-xs text-muted-foreground">
                    <Link to={`/documents/${v.document_id}`} className="font-medium text-primary hover:underline">
                      {filenameFor(v.document_id, documents)}
                    </Link>
                    {v.product_name && (
                      <span className="text-muted-foreground"> ({v.product_name})</span>
                    )}
                    {': '}
                    <span className="font-mono">{v.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UnmatchedProductRow({
  product,
  documents,
}: {
  product: UnmatchedProduct;
  documents: DocumentSummary[];
}) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
        <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">missing product</span>
        <Link to={`/documents/${product.document_id}`} className="text-sm font-medium text-primary hover:underline">
          {filenameFor(product.document_id, documents)}
        </Link>
      </div>
      <div className="pl-5 space-y-0.5">
        <p className="text-xs font-medium">
          {product.product_name ?? 'Unnamed product'}
          {product.hs_code && (
            <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 font-mono text-amber-700">
              HS {product.hs_code}
            </span>
          )}
        </p>
        {(product.quantity || product.unit_price) && (
          <p className="text-xs text-muted-foreground font-mono">
            {[
              product.quantity && `qty: ${product.quantity}`,
              product.unit_price && `${product.unit_price}${product.currency ? ` ${product.currency}` : ''}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
        <p className="text-xs text-amber-700">
          Not found in:{' '}
          {product.missing_in.map((docId, i) => (
            <span key={docId}>
              {i > 0 && ', '}
              <Link to={`/documents/${docId}`} className="font-medium hover:underline">
                {filenameFor(docId, documents)}
              </Link>
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}

export function MismatchBanner({ data, documents }: Props) {
  const fieldErrors = data.mismatches.filter((m) => m.severity === 'error');
  const fieldWarnings = data.mismatches.filter((m) => m.severity === 'warning');
  const productGroups = data.product_mismatches ?? [];
  const unmatchedProducts = data.unmatched_products ?? [];

  const productErrorCount = productGroups.reduce(
    (sum, g) => sum + g.field_mismatches.filter((m) => m.severity === 'error').length,
    0,
  );
  const productWarningCount = productGroups.reduce(
    (sum, g) => sum + g.field_mismatches.filter((m) => m.severity === 'warning').length,
    0,
  );

  const totalErrors = fieldErrors.length + productErrorCount;
  const totalWarnings = fieldWarnings.length + productWarningCount + unmatchedProducts.length;
  const totalItems = data.mismatches.length + productGroups.length + unmatchedProducts.length;

  if (totalItems === 0) return null;

  return (
    <div className="rounded-xl border border-red-200 bg-background">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <AlertOctagon className="h-4 w-4 text-red-500" />
        <h2 className="font-semibold text-sm">
          {totalItems} conflict{totalItems !== 1 ? 's' : ''} detected
        </h2>
        {totalErrors > 0 && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            {totalErrors} error{totalErrors !== 1 ? 's' : ''}
          </span>
        )}
        {totalWarnings > 0 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            {totalWarnings} warning{totalWarnings !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="space-y-4 p-4">
        {(fieldErrors.length > 0 || fieldWarnings.length > 0) && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Document Conflicts
            </p>
            <div className="space-y-2">
              {[...fieldErrors, ...fieldWarnings].map((m) => (
                <MismatchRow key={m.field_name} mismatch={m} documents={documents} />
              ))}
            </div>
          </div>
        )}
        {productGroups.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Product Conflicts
            </p>
            <div className="space-y-2">
              {productGroups.map((g) => (
                <ProductGroupRow key={g.product_key} group={g} documents={documents} />
              ))}
            </div>
          </div>
        )}
        {unmatchedProducts.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Missing Products
            </p>
            <div className="space-y-2">
              {unmatchedProducts.map((p) => (
                <UnmatchedProductRow key={p.product_id} product={p} documents={documents} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
