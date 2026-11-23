import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronRight,
  PackageCheck,
  QrCode,
  ReceiptText,
  TicketCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useBusinessContext } from "@/features/loyalty/businessContext";
import {
  useApproveRedemption,
  useBusinesses,
  useLoyaltyRedemptions,
} from "@/features/loyalty/hooks";
import { useBusinessPurchases } from "@/features/purchases/hooks";
import { PurchaseDetailDialog } from "@/features/purchases/PurchaseDetailDialog";
import { formatCOP, formatDateTimeBogota, formatPoints } from "@/lib/format";
import { errorMessage } from "@/lib/errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/shared/States";
import { PurchaseStatusBadge, RedemptionRequestStatusBadge } from "@/components/shared/StatusBadge";
import type { Business, LoyaltyRedemptionWithCustomer } from "@/types";

export function EncargadoDashboardPage() {
  const businesses = useBusinesses();
  const { selectedBusiness, setSelectedBusiness } = useBusinessContext();
  const navigate = useNavigate();

  if (businesses.isLoading) return <ListSkeleton rows={3} />;
  if (businesses.isError) {
    return <ErrorState error={businesses.error} onRetry={() => void businesses.refetch()} />;
  }

  const list = (businesses.data ?? []).filter(
    (business) => business.role === "admin" || business.role === "encargado",
  );

  if (list.length > 1 && !selectedBusiness) {
    return (
      <div className="space-y-4 sm:space-y-5 animate-fade-in">
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight sm:text-3xl">
            Selecciona un negocio
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Elige el negocio donde vas a operar la terminal de caja.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((business) => (
            <Card
              key={business.id}
              className="cursor-pointer transition-colors hover:bg-[var(--lp-tip-bg)]"
            >
              <CardContent className="p-4 text-center sm:p-6">
                <TicketCheck className="mx-auto mb-3 size-12 text-primary" aria-hidden="true" />
                <h3 className="font-semibold">{business.name}</h3>
                <p className="text-xs text-muted-foreground">@{business.slug}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => {
                    setSelectedBusiness(business);
                    navigate("/encargado");
                  }}
                >
                  Seleccionar negocio
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const current = selectedBusiness ?? list[0];
  if (!current) {
    return (
      <div className="space-y-4 sm:space-y-5 animate-fade-in">
        <EmptyState
          title="Sin negocios asignados"
          description="Debes tener rol de colaborador o administrador en un negocio para acceder a esta terminal."
          icon={AlertCircle}
        />
      </div>
    );
  }

  return <EncargadoDashboardSection key={current.id} business={current} />;
}

function EncargadoDashboardSection({ business }: { business: Business }) {
  const { selectedRole, canApproveRedemptions } = useBusinessContext();
  const canAct =
    selectedRole === "admin" || (selectedRole === "encargado" && canApproveRedemptions);

  const pending = useLoyaltyRedemptions(business.id, "pending");
  const approved = useLoyaltyRedemptions(business.id, "approved");
  const purchases = useBusinessPurchases(business.id, 0, 5, "");

  const approveRedemption = useApproveRedemption();
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const pendingRows = pending.data ?? [];
  const approvedRows = approved.data ?? [];
  const recentPurchases = purchases.data ?? [];

  const dateLabel = new Date().toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  async function handleQuickApprove(redemption: LoyaltyRedemptionWithCustomer) {
    setApprovingId(redemption.id);
    try {
      await approveRedemption.mutateAsync({
        businessId: business.id,
        redemptionId: redemption.id,
        approve: true,
      });
      toast.success(`Solicitud de ${redemption.reward_name} aprobada.`);
      void pending.refetch();
      void approved.refetch();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado operativo */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span
              className="size-2.5 border border-[var(--lp-ink)] bg-[var(--lp-green-badge)] animate-pulse"
              aria-hidden="true"
            />
            Terminal de caja · {dateLabel}
          </div>
          <h1 className="mt-1 font-display text-2xl font-black tracking-tight [text-shadow:var(--lp-h1-shadow)] sm:text-3xl">
            {business.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona ventas y atiende las solicitudes de recompensas de tus clientes.
          </p>
        </div>

        <Button asChild className="h-11">
          <Link to="/encargado/venta">
            <QrCode className="size-4" aria-hidden="true" />
            Registrar venta
          </Link>
        </Button>
      </div>

      {/* Indicadores clave */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Solicitudes pendientes */}
        <Card className={pendingRows.length > 0 ? "bg-[var(--lp-tip-bg)]" : ""}>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Por aprobar
              </span>
              <TicketCheck
                className="size-4 text-amber-600 dark:text-amber-400"
                aria-hidden="true"
              />
            </div>
            <p className="mt-2 font-display text-3xl font-extrabold text-foreground">
              {pendingRows.length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {pendingRows.length === 1
                ? "1 solicitud esperando aprobación"
                : `${pendingRows.length} solicitudes esperando aprobación`}
            </p>
            <Button
              variant="link"
              size="sm"
              asChild
              className="mt-2 h-auto p-0 font-semibold text-primary"
            >
              <Link to="/encargado/solicitudes">
                Ir a solicitudes <ArrowRight className="ml-1 size-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Por entregar */}
        <Card
          className={
            approvedRows.length > 0
              ? "border-emerald-400/80 bg-emerald-50/30 dark:bg-emerald-950/20"
              : ""
          }
        >
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Por entregar
              </span>
              <PackageCheck
                className="size-4 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
            </div>
            <p className="mt-2 font-display text-3xl font-extrabold text-foreground">
              {approvedRows.length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {approvedRows.length === 1
                ? "1 recompensa lista para entregar"
                : `${approvedRows.length} recompensas listas para entregar`}
            </p>
            <Button
              variant="link"
              size="sm"
              asChild
              className="mt-2 h-auto p-0 font-semibold text-primary"
            >
              <Link to="/encargado/solicitudes">
                Ver mostrador <ArrowRight className="ml-1 size-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Clientes por puntos */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Fidelización
              </span>
              <Users className="size-4 text-primary" aria-hidden="true" />
            </div>
            <p className="mt-2 font-display text-lg font-bold text-foreground">
              Ranking de clientes
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Consulta a los clientes ordenados por monedas acumuladas.
            </p>
            <Button
              variant="link"
              size="sm"
              asChild
              className="mt-2 h-auto p-0 font-semibold text-primary"
            >
              <Link to="/encargado/solicitudes">
                Ver lista de clientes <ArrowRight className="ml-1 size-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Sección de solicitudes pendientes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TicketCheck className="size-4 text-primary" aria-hidden="true" />
              Solicitudes de recompensa pendientes
            </CardTitle>
            <CardDescription>
              Los clientes solicitan recompensas desde su portal y aquí las apruebas al instante.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/encargado/solicitudes">Ver todas</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {pending.isLoading ? (
            <ListSkeleton rows={2} />
          ) : pendingRows.length === 0 ? (
            <EmptyState
              title="Sin solicitudes pendientes"
              description="Cuando un cliente canjee una recompensa, aparecerá aquí para que la apruebes."
              icon={TicketCheck}
              className="border-0 bg-transparent py-6"
            />
          ) : (
            <div className="divide-y">
              {pendingRows.map((redemption) => (
                <div
                  key={redemption.id}
                  className="flex flex-col gap-3 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{redemption.reward_name}</p>
                      <Badge variant="outline" className="font-mono text-xs">
                        -{formatPoints(redemption.points_spent)}
                      </Badge>
                      <RedemptionRequestStatusBadge status={redemption.status} />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      Cliente:{" "}
                      {redemption.customer_nickname
                        ? `@${redemption.customer_nickname}`
                        : redemption.customer_email}{" "}
                      · {formatDateTimeBogota(redemption.created_at)}
                    </p>
                  </div>

                  {canAct && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => void handleQuickApprove(redemption)}
                        loading={approvingId === redemption.id}
                      >
                        <Check className="mr-1 size-4" />
                        Aprobar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sección de últimas ventas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ReceiptText className="size-4 text-primary" aria-hidden="true" />
              Últimas ventas registradas
            </CardTitle>
            <CardDescription>
              Toca una venta para consultar sus productos, importe y cliente.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/encargado/venta">Nueva venta</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {purchases.isLoading ? (
            <ListSkeleton rows={3} />
          ) : recentPurchases.length === 0 ? (
            <EmptyState
              title="Aún no hay ventas"
              description="Registra la primera venta para que el cliente acumule sus monedas."
              icon={ReceiptText}
              className="border-0 bg-transparent py-6"
            />
          ) : (
            <ul className="divide-y">
              {recentPurchases.map((purchase) => (
                <li key={purchase.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedPurchaseId(purchase.id)}
                    className="flex w-full flex-wrap items-center justify-between gap-3 rounded-none py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary first:pt-0 last:pb-0"
                    aria-label={`Ver detalle de la venta por ${formatCOP(purchase.amount_cop)}`}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">{formatCOP(purchase.amount_cop)}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatDateTimeBogota(purchase.created_at)} ·{" "}
                        {purchase.customer_name ?? "Sin reclamar"}
                        {purchase.items_count ? ` · ${purchase.items_count} ítem(s)` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {purchase.points_awarded > 0 ? formatPoints(purchase.points_awarded) : ""}
                      </span>
                      <PurchaseStatusBadge status={purchase.status} />
                      <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <PurchaseDetailDialog
        open={Boolean(selectedPurchaseId)}
        onOpenChange={(open) => {
          if (!open) setSelectedPurchaseId(null);
        }}
        purchaseId={selectedPurchaseId}
        businessId={business.id}
        mode="business"
      />
    </div>
  );
}
