import { Calendar, Mail, ReceiptText, TicketCheck, UserRound } from "lucide-react";
import { useAdminCustomer } from "@/features/admin/hooks";
import { formatCOP, formatDateTimeBogota, formatPoints } from "@/lib/format";
import type { CustomerDetail } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, ErrorState, LoadingScreen } from "@/components/shared/States";
import { EntityAvatar } from "@/components/shared/EntityAvatar";
import {
  FrequencyBadge,
  PurchaseStatusBadge,
  RedemptionStatusBadge,
} from "@/components/shared/StatusBadge";

interface CustomerDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | null;
  businessId: string;
}

export function CustomerDetailDialog({
  open,
  onOpenChange,
  customerId,
  businessId,
}: CustomerDetailDialogProps) {
  const customer = useAdminCustomer(businessId, open && customerId ? customerId : undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserRound className="size-5 text-primary" aria-hidden="true" />
            Detalle del cliente
          </DialogTitle>
          <DialogDescription>
            Datos personales, monedas acumuladas e historial de actividad en el negocio.
          </DialogDescription>
        </DialogHeader>

        {customer.isLoading ? (
          <LoadingScreen label="Cargando datos del cliente…" />
        ) : customer.isError || !customer.data ? (
          <ErrorState
            error={customer.error ?? new Error("No se pudo cargar la información del cliente.")}
            onRetry={() => void customer.refetch()}
          />
        ) : (
          <CustomerDetailContent data={customer.data} />
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CustomerDetailContent({ data }: { data: CustomerDetail }) {
  const { profile, purchases, redemptions } = data;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 1. Datos básicos del cliente y saldo */}
      <Card className="border-[3px] border-[var(--lp-ink)] bg-[var(--lp-surface-elevated-deep)] text-[var(--lp-surface-elevated-text)] shadow-[5px_5px_0_var(--lp-ink)]">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <EntityAvatar
                src={profile.avatar_url}
                alt={profile.full_name || profile.email}
                fallbackText={profile.full_name || profile.email}
                sizeClassName="size-12"
                className="border-[var(--lp-ink)] bg-[var(--lp-surface-elevated)] text-[var(--lp-gold)]"
              />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-xl font-black text-[var(--lp-surface-elevated-text)]">
                    {profile.full_name || "Cliente sin nombre"}
                  </h3>
                  {profile.nickname && (
                    <Badge
                      variant="outline"
                      className="border-[var(--lp-ink)] bg-[var(--lp-surface-elevated)] font-mono text-xs text-[var(--lp-surface-elevated-text)]"
                    >
                      @{profile.nickname}
                    </Badge>
                  )}
                  <FrequencyBadge
                    isFrequent={Boolean(data.is_frequent)}
                    isActive={Boolean(data.is_frequent_active)}
                    isRecovering={Boolean(data.is_recovering)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[var(--lp-surface-elevated-soft)]">
                  <span className="flex items-center gap-1">
                    <Mail className="size-3.5" aria-hidden="true" />
                    {profile.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" aria-hidden="true" />
                    Cliente desde {formatDateTimeBogota(profile.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="sm:text-right">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--lp-surface-elevated-muted)]">
                Monedas acumuladas
              </p>
              <p className="mt-1 font-display text-4xl font-extrabold leading-none text-[var(--lp-gold)] [text-shadow:2px_2px_0_#16262e]">
                {data.points_balance}
              </p>
              <p className="mt-1 text-xs text-[var(--lp-surface-elevated-soft)]">
                monedas acumuladas
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-[var(--lp-ink)] pt-3 text-xs text-[var(--lp-surface-elevated-soft)]">
            <span>
              <strong>{data.purchase_count}</strong> compras registradas · Total gastado:{" "}
              <strong>{formatCOP(data.total_spent)}</strong>
            </span>
            <span>
              {data.last_purchase_at
                ? `Última compra: ${formatDateTimeBogota(data.last_purchase_at)}`
                : "Sin compras registradas"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Historial de compras */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ReceiptText className="size-4 text-primary" aria-hidden="true" />
              Historial de compras
            </CardTitle>
            <Badge variant="outline" className="font-mono text-xs">
              {purchases.length} compra(s)
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {purchases.length === 0 ? (
            <EmptyState
              title="Sin compras registradas"
              description="Este cliente aún no ha registrado compras en el negocio."
              icon={ReceiptText}
              className="border-0 bg-transparent py-4"
            />
          ) : (
            <div className="max-h-56 overflow-y-auto divide-y pr-1">
              {purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-semibold text-foreground">
                      {formatCOP(purchase.amount_cop)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {formatDateTimeBogota(purchase.claimed_at)}
                      {purchase.items_count ? ` · ${purchase.items_count} ítem(s)` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="success">+{formatPoints(purchase.points_awarded)}</Badge>
                    <PurchaseStatusBadge status={purchase.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Historial de recompensas reclamadas */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TicketCheck className="size-4 text-primary" aria-hidden="true" />
              Historial de recompensas reclamadas
            </CardTitle>
            <Badge variant="outline" className="font-mono text-xs">
              {redemptions.length} canje(s)
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {redemptions.length === 0 ? (
            <EmptyState
              title="Sin recompensas reclamadas"
              description="El cliente todavía no ha solicitado ni reclamado recompensas."
              icon={TicketCheck}
              className="border-0 bg-transparent py-4"
            />
          ) : (
            <div className="max-h-56 overflow-y-auto divide-y pr-1">
              {redemptions.map((redemption) => (
                <div
                  key={redemption.id}
                  className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{redemption.reward_name}</p>
                      <RedemptionStatusBadge status={redemption.status} />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      Código: <span className="font-mono">{redemption.code}</span> · Solicitado:{" "}
                      {formatDateTimeBogota(redemption.created_at)}
                      {redemption.delivered_at
                        ? ` · Entregado: ${formatDateTimeBogota(redemption.delivered_at)}`
                        : ""}
                      {redemption.cancelled_at
                        ? ` · Cancelado: ${formatDateTimeBogota(redemption.cancelled_at)}`
                        : ""}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="self-start sm:self-auto shrink-0 font-mono text-xs"
                  >
                    -{formatPoints(redemption.points_spent)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
