import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  ReceiptText,
  TicketCheck,
  TrendingUp,
} from 'lucide-react';
import { useAdminCustomer } from './hooks';
import { useBusinessContext } from '@/features/loyalty/businessContext';
import { PurchaseDetailDialog } from '@/features/purchases/PurchaseDetailDialog';
import {
  formatCOP,
  formatDateTimeBogota,
  formatPoints,
} from '@/lib/format';
import type { PointsMovementType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { FrequencyBadge, RedemptionStatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState, ErrorState, LoadingScreen } from '@/components/shared/States';

const movementLabels: Record<PointsMovementType, string> = {
  purchase_credit: 'Compra acreditada',
  redemption_debit: 'Canje',
  redemption_refund: 'Devolución de canje',
  expiry_debit: 'Vencimiento de loopoints',
  admin_adjustment: 'Ajuste administrativo',
  bonus_credit: 'Bono acreditado',
};

/**
 * Detalle de un cliente del negocio. Los canjes se consultan en modo lectura;
 * la operación de canje vive en Solicitudes y en el QR del cliente (Fase 6).
 */
export function CustomerDetailPage() {
  const { id } = useParams();
  const { selectedBusiness } = useBusinessContext();
  const businessId = selectedBusiness?.id ?? '';
  const customer = useAdminCustomer(businessId, id);
  const [detailId, setDetailId] = useState<string | null>(null);

  if (customer.isLoading) return <LoadingScreen label="Cargando cliente…" />;
  if (customer.isError || !customer.data) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/customers">
            <ArrowLeft aria-hidden="true" />
            Volver a clientes
          </Link>
        </Button>
        <ErrorState
          error={customer.error ?? new Error('Cliente no encontrado')}
          onRetry={() => void customer.refetch()}
        />
      </div>
    );
  }

  const data = customer.data;
  const balance = data.points_balance;
  const lastPurchaseAt = data.last_purchase_at ?? null;

  return (
    <div className="space-y-6 animate-fade-in">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/admin/customers">
          <ArrowLeft aria-hidden="true" />
          Volver a clientes
        </Link>
      </Button>

      <PageHeader
        title={data.profile.full_name || 'Cliente sin nombre'}
        description={
          data.profile.nickname
            ? `@${data.profile.nickname} · registrado el ${formatDateTimeBogota(
                data.profile.created_at,
              )}`
            : `Registrado el ${formatDateTimeBogota(data.profile.created_at)}`
        }
        actions={
          <FrequencyBadge
            isFrequent={Boolean(data.is_frequent)}
            isActive={Boolean(data.is_frequent_active)}
            isRecovering={Boolean(data.is_recovering)}
          />
        }
      />

      <Card className="border-0 bg-foreground text-background shadow-lg">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-background/60">
              Saldo disponible
            </p>
            <p
              data-testid="customer-points-balance"
              className="mt-1 font-display text-6xl font-extrabold leading-none text-amber-300"
            >
              {balance}
            </p>
            <p className="mt-2 text-sm text-background/70">
              {formatPoints(balance)}
            </p>
          </div>
          <div className="space-y-1 text-sm text-background/80 sm:text-right">
            <p className="flex items-center gap-1.5 break-all sm:justify-end">
              <Mail className="size-3.5 shrink-0" aria-hidden="true" />
              {data.profile.email}
            </p>
            <p>
              {data.purchase_count} compras · {formatCOP(data.total_spent)}
            </p>
            <p className="text-xs text-background/60">
              {lastPurchaseAt
                ? `Última compra: ${formatDateTimeBogota(lastPurchaseAt)}`
                : 'Sin compras registradas'}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ReceiptText className="size-4 text-muted-foreground" aria-hidden="true" />
              Compras
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.purchases.length === 0 ? (
              <EmptyState
                title="Sin compras"
                description="Este cliente aún no tiene compras en el negocio."
                icon={ReceiptText}
                className="border-0 bg-transparent py-6"
              />
            ) : (
              <ul className="divide-y">
                {data.purchases.map((purchase) => (
                  <li
                    key={purchase.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">{formatCOP(purchase.amount_cop)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTimeBogota(purchase.claimed_at)}
                        {purchase.items_count
                          ? ` · ${purchase.items_count} ítem(s)`
                          : ' · sin detalle'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="success">+{purchase.points_awarded} pts</Badge>
                      {purchase.items_count ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailId(purchase.id)}
                        >
                          Detalle
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-muted-foreground" aria-hidden="true" />
              Movimientos de loopoints
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.movements.length === 0 ? (
              <EmptyState
                title="Sin movimientos"
                description="Aún no hay créditos ni débitos."
                icon={TrendingUp}
                className="border-0 bg-transparent py-6"
              />
            ) : (
              <ul className="divide-y">
                {data.movements.map((movement) => (
                  <li
                    key={movement.id}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {movementLabels[movement.movement_type] ??
                          movement.movement_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTimeBogota(movement.created_at)}
                      </p>
                    </div>
                    <span
                      className={
                        movement.points >= 0
                          ? 'shrink-0 text-sm font-bold text-emerald-700'
                          : 'shrink-0 text-sm font-bold text-destructive'
                      }
                    >
                      {movement.points > 0 ? '+' : ''}
                      {movement.points}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TicketCheck className="size-4 text-muted-foreground" aria-hidden="true" />
            Canjes del cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.redemptions.length === 0 ? (
            <EmptyState
              title="Sin canjes"
              description="Cuando el cliente solicite una recompensa aparecerá aquí."
              icon={TicketCheck}
              className="border-0 bg-transparent py-6"
            />
          ) : (
            <ul className="divide-y">
              {data.redemptions.map((redemption) => (
                <li
                  key={redemption.id}
                  className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{redemption.reward_name}</p>
                      <RedemptionStatusBadge status={redemption.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTimeBogota(redemption.created_at)} · −
                      {redemption.points_spent} loopoints
                      {redemption.cancelled_at
                        ? ` · anulado ${formatDateTimeBogota(redemption.cancelled_at)}`
                        : ''}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="self-start">
                    <Link to="/admin/redemptions">Ver en Solicitudes</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <PurchaseDetailDialog
        open={Boolean(detailId)}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
        purchaseId={detailId}
        businessId={businessId}
      />
    </div>
  );
}
