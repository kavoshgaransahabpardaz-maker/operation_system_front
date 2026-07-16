import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { fieldsApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Spinner } from '@/components/shared/Spinner';
import { FileIcon } from '@/components/shared/FileIcon';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { DocumentSummary } from '@/types';

interface Props {
  shipmentId: string;
  documents: DocumentSummary[];
}

export function ShipmentProductsPanel({ shipmentId, documents }: Props) {
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

  const count = products?.length ?? 0;

  return (
    <div className="rounded-xl border bg-background">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <h2 className="font-semibold">Products</h2>
        {count > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{count}</span>
        )}
      </div>

      {count === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">
          No products extracted across this shipment.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source Document</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>HS Code</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Origin → Dest.</TableHead>
              <TableHead>Ready?</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products!.map((p) => {
              const doc = documents.find((d) => d.id === p.document_id);
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    {doc ? (
                      <Link
                        to={`/documents/${p.document_id}`}
                        className="flex items-center gap-1.5 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FileIcon contentType={doc.content_type} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="max-w-[160px] truncate text-xs">{doc.filename}</span>
                      </Link>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">
                        {p.document_id.slice(0, 8)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[180px]">
                    <p className="truncate text-sm font-medium">{p.product_name ?? p.description ?? '—'}</p>
                    {p.material && (
                      <p className="text-xs text-muted-foreground">{p.material}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    {p.existing_hs_code ? (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
                        {p.existing_hs_code}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{p.quantity ?? '—'}</TableCell>
                  <TableCell className="text-sm">
                    {p.unit_price
                      ? `${p.unit_price}${p.currency ? ` ${p.currency}` : ''}`
                      : '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {p.origin_country || p.destination_country ? (
                      `${p.origin_country ?? '?'} → ${p.destination_country ?? '?'}`
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
                        {(p.missing_required_fields ?? []).join(', ')}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
