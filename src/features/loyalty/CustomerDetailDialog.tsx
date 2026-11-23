import { useMemo } from "react";
import { Calendar, Mail, ReceiptText, TicketCheck, TrendingUp, UserRound } from "lucide-react";
import { useAdminCustomer } from "@/features/admin/hooks";
import { RedemptionsTable } from "@/features/admin/RedemptionsTable";
import { useBusinessContext } from "@/features/loyalty/businessContext";
import { formatCOP, formatDateTimeBogota, formatPoints } from "@/lib/format";
import type {
  CustomerDetail,
  LoyaltyRedemptionWithCustomer,
  PointsMovementType,
  RedemptionRequestStatus,
} from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { FrequencyBadge, PurchaseStatusBadge } from "@/components/shared/StatusBadge";

const movementLabels: Record<PointsMovementType, string> = {
  purchase_credit: "Compra acreditada",
  redemption_debit: "Canje",
  redemption_refund: "Devolución de canje",
  expiry_debit: "Vencimiento de monedas",
  admin_adjustment: "Ajuste administrativo",
  bonus_credit: "Bono acreditado",
};

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
      <DialogContent className="sm:max-w-2xl">
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
          <CustomerDetailContent
            data={customer.data}
            businessId={businessId}
            onRefresh={() => void customer.refetch()}
          />
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

function CustomerDetailContent({
  data,
  businessId,
  onRefresh,
}: {
  data: CustomerDetail;
  businessId: string;
  onRefresh: () => void;
}) {
  const { profile, purchases, movements, redemptions } = data;
  const { selectedRole, canApproveRedemptions } = useBusinessContext();
  const canAct =
    selectedRole === "admin" || (selectedRole === "encargado" && canApproveRedemptions);
  const canCancel = selectedRole === "admin";

  const customerRedemptions = useMemo<LoyaltyRedemptionWithCustomer[]>(() => {
    return redemptions.map((item) => {
      const requestStatus: RedemptionRequestStatus =
        item.request_status ??
        (item.status === "redeemed"
          ? "delivered"
          : item.status === "cancelled"
            ? "cancelled"
            : "pending");
      return {
        id: item.id,
        business_id: businessId,
        account_id: "",
        customer_id: profile.id,
        customer_email: profile.email,
        customer_nickname: profile.nickname ?? null,
        customer_avatar_url: profile.avatar_url ?? null,
        reward_id: "",
        reward_name: item.reward_name,
        reward_type: item.reward_type ?? "free_product",
        reward_image_url: item.reward_image_url ?? null,
        points_spent: item.points_spent,
        status: requestStatus,
        code: item.code,
        origin: item.origin ?? "manual",
        idempotency_key: "",
        created_by: profile.id,
        created_at: item.created_at,
        approved_by: null,
        approved_at: item.approved_at ?? null,
        delivered_at: item.delivered_at ?? null,
        cancelled_at: item.cancelled_at ?? null,
        cancellation_reason: null,
      };
    });
  }, [businessId, profile, redemptions]);

  return (
    <div className="space-y-5 animate-fade-in">
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

      <Card>
        <Tabs defaultValue="purchases">
          <CardHeader className="pb-3">
            <TabsList className="flex w-full overflow-x-auto sm:grid sm:grid-cols-3">
              <TabsTrigger value="purchases" className="gap-1.5 whitespace-nowrap">
                <ReceiptText className="size-4 shrink-0" aria-hidden="true" />
                Compras ({purchases.length})
              </TabsTrigger>
              <TabsTrigger value="movements" className="gap-1.5 whitespace-nowrap">
                <TrendingUp className="size-4 shrink-0" aria-hidden="true" />
                Movimientos ({movements.length})
              </TabsTrigger>
              <TabsTrigger value="redemptions" className="gap-1.5 whitespace-nowrap">
                <TicketCheck className="size-4 shrink-0" aria-hidden="true" />
                Canjes ({customerRedemptions.length})
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent>
            <TabsContent value="purchases" className="mt-0">
              {purchases.length === 0 ? (
                <EmptyState
                  title="Sin compras registradas"
                  description="Este cliente aún no ha registrado compras en el negocio."
                  icon={ReceiptText}
                  className="border-0 bg-transparent py-4"
                />
              ) : (
                <div className="divide-y">
                  {purchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <p className="font-semibold text-foreground">
                          {formatCOP(purchase.amount_cop)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {formatDateTimeBogota(purchase.claimed_at)}
                          {purchase.items_count ? ` · ${purchase.items_count} ítem(s)` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant="success">+{formatPoints(purchase.points_awarded)}</Badge>
                        <PurchaseStatusBadge status={purchase.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="movements" className="mt-0">
              {movements.length === 0 ? (
                <EmptyState
                  title="Sin movimientos"
                  description="Aún no hay créditos ni débitos de monedas."
                  icon={TrendingUp}
                  className="border-0 bg-transparent py-4"
                />
              ) : (
                <div className="divide-y">
                  {movements.map((movement) => (
                    <div
                      key={movement.id}
                      className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {movementLabels[movement.movement_type] ?? movement.movement_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTimeBogota(movement.created_at)}
                        </p>
                      </div>
                      <span
                        className={
                          movement.points >= 0
                            ? "shrink-0 text-sm font-bold text-[var(--lp-green-text)]"
                            : "shrink-0 text-sm font-bold text-destructive"
                        }
                      >
                        {movement.points > 0 ? "+" : ""}
                        {movement.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="redemptions" className="mt-0">
              {customerRedemptions.length === 0 ? (
                <EmptyState
                  title="Sin canjes"
                  description="El cliente todavía no ha solicitado ni reclamado recompensas."
                  icon={TicketCheck}
                  className="border-0 bg-transparent py-4"
                />
              ) : (
                <RedemptionsTable
                  businessId={businessId}
                  rows={customerRedemptions}
                  showCustomerColumn={false}
                  canAct={canAct}
                  canCancel={canCancel}
                  onActionComplete={() => {
                    onRefresh();
                  }}
                />
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
