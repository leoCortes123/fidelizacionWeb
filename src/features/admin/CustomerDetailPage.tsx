import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Mail, ReceiptText, TicketCheck, TrendingUp } from "lucide-react";
import { useAdminCustomer } from "./hooks";
import { useBusinessContext } from "@/features/loyalty/businessContext";
import { PurchaseDetailDialog } from "@/features/purchases/PurchaseDetailDialog";
import { formatCOP, formatDateTimeBogota, formatPoints } from "@/lib/format";
import type {
  CustomerDetail,
  LoyaltyRedemptionWithCustomer,
  PointsMovementType,
  RedemptionRequestStatus,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { EntityAvatar } from "@/components/shared/EntityAvatar";
import { FrequencyBadge } from "@/components/shared/StatusBadge";
import { EmptyState, ErrorState, LoadingScreen } from "@/components/shared/States";
import { RedemptionsTable } from "./RedemptionsTable";

const movementLabels: Record<PointsMovementType, string> = {
  purchase_credit: "Compra acreditada",
  redemption_debit: "Canje",
  redemption_refund: "Devolución de canje",
  expiry_debit: "Vencimiento de monedas",
  admin_adjustment: "Ajuste administrativo",
  bonus_credit: "Bono acreditado",
};

function mapFallbackRedemptions(
  data: CustomerDetail,
  businessId: string,
): LoyaltyRedemptionWithCustomer[] {
  return data.redemptions.map((item) => {
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
      customer_id: data.profile.id,
      customer_email: data.profile.email,
      customer_nickname: data.profile.nickname ?? null,
      customer_avatar_url: data.profile.avatar_url ?? null,
      reward_id: "",
      reward_name: item.reward_name,
      reward_type: item.reward_type ?? "free_product",
      reward_image_url: item.reward_image_url ?? null,
      points_spent: item.points_spent,
      status: requestStatus,
      code: item.code,
      origin: item.origin ?? "manual",
      idempotency_key: "",
      created_by: data.profile.id,
      created_at: item.created_at,
      approved_by: null,
      approved_at: item.approved_at ?? null,
      delivered_at: item.delivered_at ?? null,
      cancelled_at: item.cancelled_at ?? null,
      cancellation_reason: null,
    };
  });
}

export function CustomerDetailPage() {
  const { id } = useParams();
  const { selectedBusiness, selectedRole, canApproveRedemptions } = useBusinessContext();
  const businessId = selectedBusiness?.id ?? "";
  const customer = useAdminCustomer(businessId, id);
  const [detailId, setDetailId] = useState<string | null>(null);

  const canAct =
    selectedRole === "admin" || (selectedRole === "encargado" && canApproveRedemptions);
  const canCancel = selectedRole === "admin";

  const customerRedemptions = useMemo(() => {
    if (!customer.data) return [];
    return mapFallbackRedemptions(customer.data, businessId);
  }, [businessId, customer.data]);

  if (customer.isLoading) return <LoadingScreen label="Cargando cliente…" />;
  if (customer.isError || !customer.data) {
    return (
      <div className="space-y-4">
        <div className="px-4 sm:px-0">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/admin/customers">
              <ArrowLeft aria-hidden="true" />
              Volver a clientes
            </Link>
          </Button>
        </div>
        <ErrorState
          error={customer.error ?? new Error("Cliente no encontrado")}
          onRetry={() => void customer.refetch()}
        />
      </div>
    );
  }

  const data = customer.data;
  const balance = data.points_balance;
  const lastPurchaseAt = data.last_purchase_at ?? null;

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      <div className="px-4 sm:px-0">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/admin/customers">
            <ArrowLeft aria-hidden="true" />
            Volver a clientes
          </Link>
        </Button>
      </div>

      <PageHeader
        title={data.profile.full_name || "Cliente sin nombre"}
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

      <Card className="border-[3px] border-[var(--lp-ink)] bg-[var(--lp-surface-elevated-deep)] text-[var(--lp-surface-elevated-text)] shadow-[5px_5px_0_var(--lp-ink)]">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <EntityAvatar
              src={data.profile.avatar_url}
              alt={data.profile.full_name || data.profile.email}
              fallbackText={data.profile.full_name || data.profile.email}
              sizeClassName="size-16"
              className="border-[var(--lp-ink)] bg-[var(--lp-surface-elevated)] text-base text-[var(--lp-gold)]"
            />
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lp-surface-elevated-muted)]">
                Saldo disponible
              </p>
              <p
                data-testid="customer-points-balance"
                className="mt-1 break-all font-display text-6xl font-extrabold leading-none text-[var(--lp-gold)] [text-shadow:3px_3px_0_#16262e]"
              >
                {balance}
              </p>
              <p className="mt-2 text-sm text-[var(--lp-surface-elevated-soft)]">
                {formatPoints(balance)}
              </p>
            </div>
          </div>
          <div className="space-y-1 text-sm text-[var(--lp-surface-elevated-soft)] sm:text-right">
            <p className="flex items-center gap-1.5 break-all sm:justify-end">
              <Mail className="size-3.5 shrink-0" aria-hidden="true" />
              {data.profile.email}
            </p>
            <p>
              {data.purchase_count} compras · {formatCOP(data.total_spent)}
            </p>
            <p className="text-xs text-[var(--lp-surface-elevated-muted)]">
              {lastPurchaseAt
                ? `Última compra: ${formatDateTimeBogota(lastPurchaseAt)}`
                : "Sin compras registradas"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Tabs defaultValue="purchases">
          <CardHeader className="pb-3">
            <TabsList className="flex w-full overflow-x-auto sm:grid sm:grid-cols-3">
              <TabsTrigger value="purchases" className="gap-1.5 whitespace-nowrap">
                <ReceiptText className="size-4 shrink-0" aria-hidden="true" />
                Compras
                <Badge variant="outline" className="ml-1 font-mono text-[10px]">
                  {data.purchases.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="movements" className="gap-1.5 whitespace-nowrap">
                <TrendingUp className="size-4 shrink-0" aria-hidden="true" />
                Movimientos de monedas
                <Badge variant="outline" className="ml-1 font-mono text-[10px]">
                  {data.movements.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="redemptions" className="gap-1.5 whitespace-nowrap">
                <TicketCheck className="size-4 shrink-0" aria-hidden="true" />
                Canjes
                <Badge variant="outline" className="ml-1 font-mono text-[10px]">
                  {customerRedemptions.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent>
            <TabsContent value="purchases" className="mt-0">
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
                            : " · sin detalle"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant="success">+{purchase.points_awarded} monedas</Badge>
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
            </TabsContent>

            <TabsContent value="movements" className="mt-0">
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
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="redemptions" className="mt-0">
              {customerRedemptions.length === 0 ? (
                <EmptyState
                  title="Sin canjes"
                  description="Cuando el cliente solicite una recompensa aparecerá aquí."
                  icon={TicketCheck}
                  className="border-0 bg-transparent py-6"
                />
              ) : (
                <RedemptionsTable
                  businessId={businessId}
                  rows={customerRedemptions}
                  showCustomerColumn={false}
                  canAct={canAct}
                  canCancel={canCancel}
                  onActionComplete={() => {
                    void customer.refetch();
                  }}
                />
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
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
