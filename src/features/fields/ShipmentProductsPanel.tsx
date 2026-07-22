import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { fieldsApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Spinner } from '@/components/shared/Spinner';
import { FileIcon } from '@/components/shared/FileIcon';
import { isoFlag } from './fieldFormatting';
import { HsGenieCell, HsGeniePanel } from './HsGenieCell';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { DocumentSummary, ShipmentMismatchOut, DocumentProduct, HsGenieRunOut } from '@/types';

interface Props {
  shipmentId: string;
  documents: DocumentSummary[];
  mismatches?: ShipmentMismatchOut;
}

function abbrev(filename: string, max = 18): string {
  if (filename.length <= max) return filename;
  const dot = filename.lastIndexOf('.');
  const ext = dot > 0 ? filename.slice(dot) : '';
  const name = dot > 0 ? filename.slice(0, dot) : filename;
  return name.slice(0, max - ext.length - 1) + '…' + ext;
}

function dash(val: string | null | undefined) {
  return val ?? <span className="text-muted-foreground/50">—</span>;
}

/** Returns mismatch conflict chips for a product's HS code, or null if no conflict. */
function buildMismatchChips(
  product: DocumentProduct,
  productGroupKey: string,
  mismatches: ShipmentMismatchOut | undefined,
  canConflict: boolean,
): React.ReactNode | null {
  if (!canConflict || !mismatches) return null;

  const group = mismatches.product_mismatches.find(
    (pm) => pm.product_key === productGroupKey || pm.hs_code === product.existing_hs_code,
  );
  const hsMismatch = group?.field_mismatches.find(
    (fm) => fm.field_name === 'existing_hs_code',
  );
  if (!hsMismatch || !hsMismatch.values.some((v) => v.product_id === product.id)) return null;

  return (
    <div className="flex flex-col gap-0.5">
      {hsMismatch.values.map((v) => (
        <span
          key={v.document_id}
          className="inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 font-mono text-[10.5px] text-red-800"
        >
          {v.value}
        </span>
      ))}
    </div>
  );
}

export function ShipmentProductsPanel({ shipmentId, documents, mismatches }: Props) {
  const [activeGenieProductId, setActiveGenieProductId] = useState<string | null>(null);
  const [activeGenieRun, setActiveGenieRun] = useState<HsGenieRunOut | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: queryKeys.shipmentProducts(shipmentId),
    queryFn: () => fieldsApi.getProductsForShipment(shipmentId).then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-background">
        <div className="border-b px-4 py-3 font-semibold text-sm">Products</div>
        <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
          <Spinner size="sm" /> Loading products…
        </div>
      </div>
    );
  }

  const canConflict = documents.length >= 2;
  const count = products?.length ?? 0;

  const unmatchedMap = new Map(
    (mismatches?.unmatched_products ?? []).map((up) => [up.product_id, up]),
  );

  const productMismatchMap = new Map(
    (mismatches?.product_mismatches ?? []).map((pm) => [pm.product_key, pm]),
  );

  function getProductKey(p: DocumentProduct): string {
    return p.existing_hs_code ?? p.product_name ?? p.id;
  }

  function getRowStyle(p: DocumentProduct): string {
    if (!canConflict) return '';
    if (unmatchedMap.has(p.id)) return 'bg-amber-50/60';
    const key = getProductKey(p);
    const group = productMismatchMap.get(key);
    if (!group) return '';
    const hasError = group.field_mismatches.some((fm) => fm.severity === 'error');
    return hasError
      ? 'border-l-4 border-l-red-400 bg-red-50/30'
      : 'border-l-4 border-l-amber-400 bg-amber-50/30';
  }

  function openGenie(product: DocumentProduct, run: HsGenieRunOut) {
    setActiveGenieProductId(product.id);
    setActiveGenieRun(run);
  }

  function closeGenie() {
    setActiveGenieProductId(null);
    setActiveGenieRun(null);
  }

  const colCount = 10;

  return (
    <div className="rounded-xl border bg-background">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <h2 className="font-semibold text-sm">Products</h2>
        {count > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{count}</span>
        )}
      </div>

      {count === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">
          No products extracted across this shipment.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">Source</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>HS Code</TableHead>
                <TableHead>Qty / Pcs</TableHead>
                <TableHead>Net Wt.</TableHead>
                <TableHead>Gross Wt.</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Line Total</TableHead>
                <TableHead>Lot / Expiry</TableHead>
                <TableHead>Origin → Dest.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products!.map((p) => {
                const doc = documents.find((d) => d.id === p.document_id);
                const unmatched = canConflict ? unmatchedMap.get(p.id) : undefined;
                const rowCls = getRowStyle(p);
                const productKey = getProductKey(p);
                const mismatchChips = buildMismatchChips(p, productKey, mismatches, canConflict);
                const isGenieActive = activeGenieProductId === p.id;

                return (
                  <>
                    <TableRow key={p.id} className={rowCls}>
                      {/* Source */}
                      <TableCell>
                        {doc ? (
                          <Link
                            to={`/documents/${p.document_id}`}
                            className="flex items-center gap-1.5 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FileIcon
                              contentType={doc.content_type ?? ''}
                              className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                            />
                            <span className="max-w-[110px] truncate text-xs">
                              {abbrev(doc.filename)}
                            </span>
                          </Link>
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground">
                            {p.document_id.slice(0, 8)}
                          </span>
                        )}
                      </TableCell>

                      {/* Product + mismatch badge */}
                      <TableCell className="max-w-[200px]">
                        <p className="truncate text-sm font-medium font-serif">
                          {p.product_name ?? p.description ?? '—'}
                        </p>
                        {p.material && (
                          <p className="text-xs text-muted-foreground">{p.material}</p>
                        )}
                        {p.intended_use && (
                          <p className="text-xs text-muted-foreground italic">{p.intended_use}</p>
                        )}
                        {unmatched && (
                          <span className="mt-1 inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                            <AlertTriangle className="h-3 w-3" />
                            Missing in{' '}
                            {unmatched.missing_in
                              .map((docId) => {
                                const d = documents.find((x) => x.id === docId);
                                return d ? abbrev(d.filename, 12) : docId.slice(0, 8);
                              })
                              .join(', ')}
                          </span>
                        )}
                      </TableCell>

                      {/* HS Code — Genie cell */}
                      <TableCell>
                        <HsGenieCell
                          product={p}
                          mismatchChips={mismatchChips}
                          onGenieOpen={(run) => openGenie(p, run)}
                        />
                      </TableCell>

                      {/* Qty / Pcs */}
                      <TableCell className="text-sm">{dash(p.quantity)}</TableCell>

                      {/* Net Weight */}
                      <TableCell className="text-sm">{dash(p.net_weight)}</TableCell>

                      {/* Gross Weight */}
                      <TableCell className="text-sm">{dash(p.gross_weight)}</TableCell>

                      {/* Unit Price */}
                      <TableCell className="text-sm whitespace-nowrap">
                        {p.unit_price
                          ? `${p.unit_price}${p.currency ? ` ${p.currency}` : ''}`
                          : <span className="text-muted-foreground/50">—</span>}
                      </TableCell>

                      {/* Line Total */}
                      <TableCell className="text-sm whitespace-nowrap">
                        {p.line_total
                          ? `${p.line_total}${p.currency ? ` ${p.currency}` : ''}`
                          : <span className="text-muted-foreground/50">—</span>}
                      </TableCell>

                      {/* Lot / Expiry */}
                      <TableCell className="text-sm">
                        {p.lot_number || p.expiry_date ? (
                          <span>
                            {p.lot_number && <span className="block">{p.lot_number}</span>}
                            {p.expiry_date && (
                              <span className="block text-muted-foreground">{p.expiry_date}</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </TableCell>

                      {/* Origin → Dest. */}
                      <TableCell className="text-sm whitespace-nowrap">
                        {p.origin_country || p.destination_country ? (
                          <span>
                            {p.origin_country
                              ? `${isoFlag(p.origin_country)} ${p.origin_country}`
                              : '?'}
                            {' → '}
                            {p.destination_country
                              ? `${isoFlag(p.destination_country)} ${p.destination_country}`
                              : '?'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* HS Genie panel — expands below this product row */}
                    {isGenieActive && activeGenieRun && (
                      <TableRow key={`${p.id}-genie`}>
                        <TableCell colSpan={colCount} className="p-0">
                          <HsGeniePanel
                            product={p}
                            run={activeGenieRun}
                            onClose={closeGenie}
                            onCodeSelected={(code) => {
                              // optimistic: update run's chosen_code so feedback shows
                              setActiveGenieRun((r) => r ? { ...r, chosen_code: code } : r);
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
