import { useQuery } from '@tanstack/react-query';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { fieldsApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Spinner } from '@/components/shared/Spinner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { isoFlag } from './fieldFormatting';

interface Props {
  documentId: string;
}

export function DocumentProductsPanel({ documentId }: Props) {
  const { data: products, isLoading } = useQuery({
    queryKey: queryKeys.documentProducts(documentId),
    queryFn: () => fieldsApi.getProductsForDocument(documentId).then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Spinner size="sm" /> Loading products…
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <p className="p-4 text-sm text-muted-foreground">No products extracted from this document.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>HS Code</TableHead>
          <TableHead>Qty</TableHead>
          <TableHead>Unit Price</TableHead>
          <TableHead>Line Total</TableHead>
          <TableHead>Weight (net/gross)</TableHead>
          <TableHead>Lot / Expiry</TableHead>
          <TableHead>Origin → Dest</TableHead>
          <TableHead>Ready?</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="max-w-[200px]">
              <p className="truncate text-sm font-medium">{p.product_name ?? p.description ?? '—'}</p>
              {p.material && (
                <p className="text-xs text-muted-foreground">{p.material}</p>
              )}
              {p.ship_from && (
                <p className="text-xs text-muted-foreground">From: {p.ship_from}</p>
              )}
            </TableCell>
            <TableCell>
              {p.existing_hs_code ? (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">
                  {p.existing_hs_code}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
              {p.existing_national_code && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {p.existing_national_code_jurisdiction
                    ? `${p.existing_national_code_jurisdiction}: `
                    : ''}
                  {p.existing_national_code}
                </p>
              )}
            </TableCell>
            <TableCell className="text-sm">{p.quantity ?? '—'}</TableCell>
            <TableCell className="text-sm">
              {p.unit_price ? `${p.unit_price}${p.currency ? ` ${p.currency}` : ''}` : '—'}
            </TableCell>
            <TableCell className="text-sm">
              {p.line_total ? `${p.line_total}${p.currency ? ` ${p.currency}` : ''}` : '—'}
            </TableCell>
            <TableCell className="text-sm text-nowrap">
              {p.net_weight || p.gross_weight ? (
                <span>{p.net_weight ?? '?'} / {p.gross_weight ?? '?'}</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell className="text-sm">
              {p.lot_number || p.expiry_date ? (
                <span>
                  {p.lot_number && <span className="block">Lot: {p.lot_number}</span>}
                  {p.expiry_date && <span className="block text-muted-foreground">Exp: {p.expiry_date}</span>}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell className="text-sm">
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
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              {p.is_ready_to_classify ? (
                <span className="flex items-center gap-1 text-xs text-green-700">
                  <CheckCircle className="h-3.5 w-3.5" /> Ready
                </span>
              ) : (
                <span className="flex items-start gap-1 text-xs text-amber-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Missing: {(p.missing_required_fields ?? []).join(', ')}
                </span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
