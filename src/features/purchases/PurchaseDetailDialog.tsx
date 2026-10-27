import { Package, ReceiptText, ShieldCheck, UserRound } from 'lucide-react';
import {
  useBusinessPurchaseDetail,
  useMyPurchaseDetail,
} from './hooks';
import {
  formatCOP,
  formatDateTimeBogota,
  formatPoints,
} from '@/lib/format';
import type { PurchaseDetail } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ErrorState, LoadingScreen } from '@/components/shared/States';
import { PurchaseStatusBadge } from '@/components/shared/StatusBadge';

export function PurchaseDetailDialog({
  open,
  onOpenChange,
  purchaseId,
  businessId,
  mode = 'business',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseId: string | null;
  businessId?: string;
  mode?: 'business' | 'customer';
}) {
  const businessDetail = useBusinessPurchaseDetail(
    mode === 'business' ? businessId ?? '' : '',
    mode === 'business' ? purchaseId : null,
  );
  const customerDetail = useMyPurchaseDetail(
    mode === 'customer' ? purchaseId : null,
  );
  const query = mode === 'business' ? businessDetail : customerDetail;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ReceiptText className="size-5 text-muted-foreground" aria-hidden="true" />
            Detalle de la compra
          </DialogTitle>
          <DialogDescription>
            Líneas, loopoints y datos de la venta.
          </DialogDescription>
        </DialogHeader>

        {query.isLoading ? (
          <LoadingScreen label="Cargando detalle…" />
        ) : query.isError || !query.data ? (
          <ErrorState
            error={query.error ?? new Error('No encontramos la compra.')}
            onRetry={() => void query.refetch()}
          />
        ) : (
          <PurchaseDetailBody detail={query.data} />
        )}
      </DialogContent>
    </Dialog>
  );
}

export function PurchaseDetailBody({ detail }: { detail: PurchaseDetail }) {
  const { purchase, business, customer, registrar } = detail;
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 rounded-xl border bg-muted/30 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {business.name}
          </p>
          <p className="font-display text-3xl font-extrabold">
            {formatCOP(purchase.amount_cop)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDateTimeBogota(purchase.created_at)}
          </p>
        </div>
        <PurchaseStatusBadge status={purchase.status} />
      </div>

      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-lg border p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Package className="size-3.5" aria-hidden="true" />
            Loopoints
          </p>
          <p className="mt-1 font-semibold">
            {formatPoints(purchase.points_awarded)}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <UserRound className="size-3.5" aria-hidden="true" />
            Cliente
          </p>
          <p className="mt-1 truncate font-semibold">
            {customer
              ? customer.full_name || customer.nickname || customer.email
              : 'Sin reclamar'}
          </p>
          {customer?.nickname && (
            <Badge variant="outline" className="mt-1">
              @{customer.nickname}
            </Badge>
          )}
        </div>
      </div>

      {registrar && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Registrada por {registrar.full_name || registrar.email}
        </p>
      )}

      <div className="space-y-2">
        <p className="text-sm font-semibold">Productos</p>
        {detail.items.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Sin detalle de productos.
          </p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {detail.items.map((item) => (
              <li key={item.id} className="space-y-1 p-3">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="min-w-0">
                    <span className="font-semibold">{item.quantity} × </span>
                    {item.name}
                    {item.is_combo && (
                      <Badge variant="secondary" className="ml-2">
                        Combo
                      </Badge>
                    )}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {formatCOP(item.line_total_cop)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCOP(item.unit_price_cop)} c/u
                </p>
                {item.is_combo && item.combo_detail.length > 0 && (
                  <ul className="ml-3 space-y-0.5 text-xs text-muted-foreground">
                    {item.combo_detail.map((component) => (
                      <li key={component.product_id}>
                        · {component.quantity} × {component.name}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {detail.items.length > 0 && (
        <div className="flex items-baseline justify-between border-t pt-3 text-sm font-bold">
          <span>Total</span>
          <span>{formatCOP(purchase.amount_cop)}</span>
        </div>
      )}
    </div>
  );
}

