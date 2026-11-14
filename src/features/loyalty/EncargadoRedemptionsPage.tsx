import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  ReceiptText,
  Search,
  ShieldAlert,
  TicketCheck,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useBusinessContext } from "@/features/loyalty/businessContext";
import {
  useApproveRedemption,
  useBusinesses,
  useDeliverRedemption,
  useLoyaltyRedemptions,
} from "@/features/loyalty/hooks";
import { useAdminCustomers } from "@/features/admin/hooks";
import { errorMessage } from "@/lib/errors";
import { formatCOP, formatDateTimeBogota, formatPoints } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CustomerDetailDialog } from "@/features/loyalty/CustomerDetailDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/shared/States";
import {
  FrequencyBadge,
  RedemptionRequestStatusBadge,
} from "@/components/shared/StatusBadge";
import type { Business, LoyaltyRedemptionWithCustomer } from "@/types";

const CUSTOMERS_PAGE_SIZE = 20;

export function EncargadoRedemptionsPage() {
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
            Elige el negocio para atender solicitudes de recompensa.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((business) => (
            <Card key={business.id} className="cursor-pointer transition-shadow hover:shadow-md">
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
                    navigate("/encargado/solicitudes");
                  }}
                >
                  Seleccionar
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
          title="Sin negocios"
          description="Debes tener rol en un negocio para atender sus solicitudes."
          icon={TicketCheck}
        />
      </div>
    );
  }

  return <EncargadoRedemptionsSection key={current.id} business={current} />;
}

function EncargadoRedemptionsSection({ business }: { business: Business }) {
  const { selectedRole, canApproveRedemptions } = useBusinessContext();
  const canAct =
    selectedRole === "admin" || (selectedRole === "encargado" && canApproveRedemptions);

  const pending = useLoyaltyRedemptions(business.id, "pending");
  const approved = useLoyaltyRedemptions(business.id, "approved");
  const approveRedemption = useApproveRedemption();
  const deliverRedemption = useDeliverRedemption();

  const [customerSearchInput, setCustomerSearchInput] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerPage, setCustomerPage] = useState(0);
  const [acting, setActing] = useState<{
    id: string;
    action: "approve" | "reject" | "deliver";
  } | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCustomerSearch(customerSearchInput.trim());
      setCustomerPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearchInput]);

  const customers = useAdminCustomers(
    business.id,
    customerSearch,
    customerPage,
    CUSTOMERS_PAGE_SIZE,
    "points",
    "desc",
  );

  const pendingRows = pending.data ?? [];
  const approvedRows = approved.data ?? [];
  const customerRows = customers.data ?? [];
  const totalCustomers = customerRows[0]?.total_count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCustomers / CUSTOMERS_PAGE_SIZE));

  async function handleApprove(redemption: LoyaltyRedemptionWithCustomer) {
    setActing({ id: redemption.id, action: "approve" });
    try {
      await approveRedemption.mutateAsync({
        businessId: business.id,
        redemptionId: redemption.id,
        approve: true,
      });
      toast.success(`Solicitud de ${redemption.reward_name} aprobada. Puedes confirmar la entrega.`);
      void pending.refetch();
      void approved.refetch();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setActing(null);
    }
  }

  async function handleReject(redemption: LoyaltyRedemptionWithCustomer) {
    setActing({ id: redemption.id, action: "reject" });
    try {
      await approveRedemption.mutateAsync({
        businessId: business.id,
        redemptionId: redemption.id,
        approve: false,
      });
      toast.success(`Solicitud rechazada. Los loopoints fueron devueltos al cliente.`);
      void pending.refetch();
      void approved.refetch();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setActing(null);
    }
  }

  async function handleDeliver(redemption: LoyaltyRedemptionWithCustomer) {
    setActing({ id: redemption.id, action: "deliver" });
    try {
      await deliverRedemption.mutateAsync({
        businessId: business.id,
        redemptionId: redemption.id,
      });
      toast.success(`Entrega confirmada para ${redemption.reward_name}. Loopoints consumidos.`);
      void pending.refetch();
      void approved.refetch();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
            {business.name} · Terminal
          </div>
          <h1 className="mt-1 font-display text-2xl font-black tracking-tight sm:text-3xl">
            Solicitudes de recompensa
          </h1>
          <p className="text-sm text-muted-foreground">
            Aprueba las solicitudes de tus clientes y revisa la lista de clientes con más puntos acumulados.
          </p>
        </div>

        <Button asChild variant="outline">
          <Link to="/encargado/venta">
            <ReceiptText className="mr-1.5 size-4" />
            Registrar venta
          </Link>
        </Button>
      </div>

      {!canAct && (
        <Card className="border-amber-300 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/20">
          <CardContent className="flex items-start gap-3 p-4">
            <ShieldAlert className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="text-sm text-amber-900 dark:text-amber-200">
              <p className="font-semibold">Sin permiso de aprobación</p>
              <p className="mt-0.5 text-xs text-amber-800/90 dark:text-amber-300/90">
                Tu rol es <strong>{selectedRole ?? "sin rol"}</strong>. Puedes ver las solicitudes,
                pero necesitas que el administrador active el permiso “Puede aprobar redenciones”
                para autorizar o entregar canjes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="solicitudes" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="solicitudes" className="relative">
            Solicitudes pendientes
            {pendingRows.length > 0 && (
              <Badge variant="secondary" className="ml-2 font-mono text-xs">
                {pendingRows.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="clientes">
            Clientes
          </TabsTrigger>
        </TabsList>

        {/* PESTAÑA 1: SOLICITUDES PENDIENTES */}
        <TabsContent value="solicitudes" className="space-y-6">
          {/* Solicitudes por aprobar */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <TicketCheck className="size-4 text-primary" aria-hidden="true" />
                    Solicitudes pendientes de aprobación
                  </CardTitle>
                  <CardDescription>
                    Canjes solicitados por los clientes desde su cuenta. No requieren código QR: apruébalos directamente desde aquí.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  {pendingRows.length} pendiente(s)
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {pending.isLoading ? (
                <ListSkeleton rows={3} />
              ) : pending.isError ? (
                <ErrorState error={pending.error} onRetry={() => void pending.refetch()} />
              ) : pendingRows.length === 0 ? (
                <EmptyState
                  title="Sin solicitudes pendientes"
                  description="Cuando un cliente canjee una recompensa, aparecerá en esta lista para que la apruebes."
                  icon={TicketCheck}
                  className="border-0 bg-transparent py-8"
                />
              ) : (
                <div className="divide-y">
                  {pendingRows.map((redemption) => (
                    <div
                      key={redemption.id}
                      className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-foreground sm:text-base">
                            {redemption.reward_name}
                          </p>
                          <Badge variant="secondary" className="font-mono text-xs">
                            -{formatPoints(redemption.points_spent)}
                          </Badge>
                          <RedemptionRequestStatusBadge status={redemption.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Cliente:{" "}
                          <strong className="font-medium text-foreground">
                            {redemption.customer_nickname
                              ? `@${redemption.customer_nickname}`
                              : redemption.customer_email}
                          </strong>{" "}
                          · Código: <span className="font-mono">{redemption.code}</span> ·{" "}
                          {formatDateTimeBogota(redemption.created_at)}
                        </p>
                      </div>

                      {canAct && (
                        <div className="flex shrink-0 items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => void handleApprove(redemption)}
                            loading={acting?.id === redemption.id && acting.action === "approve"}
                            disabled={acting?.id === redemption.id}
                          >
                            <Check className="mr-1.5 size-4" />
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => void handleReject(redemption)}
                            loading={acting?.id === redemption.id && acting.action === "reject"}
                            disabled={acting?.id === redemption.id}
                          >
                            <X className="mr-1.5 size-4" />
                            Rechazar
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Solicitudes aprobadas listas para entrega */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <PackageCheck className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    Aprobadas listas para entrega en mostrador
                  </CardTitle>
                  <CardDescription>
                    Solicitudes aprobadas que esperan la entrega física de la recompensa al cliente.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  {approvedRows.length} en espera
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {approved.isLoading ? (
                <ListSkeleton rows={2} />
              ) : approved.isError ? (
                <ErrorState error={approved.error} onRetry={() => void approved.refetch()} />
              ) : approvedRows.length === 0 ? (
                <EmptyState
                  title="Nada por entregar"
                  description="Las recompensas aprobadas aparecerán aquí hasta que confirmes la entrega en mostrador."
                  icon={PackageCheck}
                  className="border-0 bg-transparent py-6"
                />
              ) : (
                <div className="divide-y">
                  {approvedRows.map((redemption) => (
                    <div
                      key={redemption.id}
                      className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-foreground">{redemption.reward_name}</p>
                          <RedemptionRequestStatusBadge status={redemption.status} />
                          <Badge variant="outline" className="font-mono text-xs">
                            -{formatPoints(redemption.points_spent)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Cliente:{" "}
                          <strong className="font-medium text-foreground">
                            {redemption.customer_nickname
                              ? `@${redemption.customer_nickname}`
                              : redemption.customer_email}
                          </strong>{" "}
                          · Código: <span className="font-mono">{redemption.code}</span>
                        </p>
                      </div>

                      {canAct && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => void handleDeliver(redemption)}
                          loading={acting?.id === redemption.id && acting.action === "deliver"}
                          disabled={acting?.id === redemption.id}
                          className="shrink-0"
                        >
                          <PackageCheck className="mr-1.5 size-4" />
                          Confirmar entrega
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PESTAÑA 2: CLIENTES POR PUNTOS ACUMULADOS */}
        <TabsContent value="clientes" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Users className="size-4 text-primary" aria-hidden="true" />
                    Clientes ordenados por puntos acumulados
                  </CardTitle>
                  <CardDescription>
                    Ranking de clientes del negocio según su saldo actual de loopoints.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    aria-label="Buscar cliente"
                    placeholder="Buscar cliente…"
                    value={customerSearchInput}
                    onChange={(event) => setCustomerSearchInput(event.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {customers.isLoading ? (
                <ListSkeleton rows={5} />
              ) : customers.isError ? (
                <ErrorState error={customers.error} onRetry={() => void customers.refetch()} />
              ) : customerRows.length === 0 ? (
                <EmptyState
                  title="Sin clientes encontrados"
                  description={
                    customerSearch
                      ? `No hay clientes que coincidan con “${customerSearch}”.`
                      : "Aún no hay clientes registrados en este negocio."
                  }
                  icon={Users}
                  className="border-0 bg-transparent py-8"
                />
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {customerRows.map((customer, index) => {
                      const rank = customerPage * CUSTOMERS_PAGE_SIZE + index + 1;
                      return (
                        <Card
                          key={customer.id}
                          role="button"
                          tabIndex={0}
                          aria-label={`Ver detalle de ${customer.full_name || customer.email}`}
                          onClick={() => setSelectedCustomerId(customer.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedCustomerId(customer.id);
                            }
                          }}
                          className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.99] group text-left border"
                        >
                          <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex items-center justify-center size-6 rounded-full font-mono text-xs font-extrabold shadow-sm bg-muted text-muted-foreground">
                                  {rank === 1 ? (
                                    <span className="size-full rounded-full bg-amber-400 text-black flex items-center justify-center font-extrabold">
                                      1
                                    </span>
                                  ) : rank === 2 ? (
                                    <span className="size-full rounded-full bg-slate-300 text-black flex items-center justify-center font-extrabold">
                                      2
                                    </span>
                                  ) : rank === 3 ? (
                                    <span className="size-full rounded-full bg-amber-700 text-white flex items-center justify-center font-extrabold">
                                      3
                                    </span>
                                  ) : (
                                    rank
                                  )}
                                </span>

                                <div className="text-right">
                                  <p className="font-pixel text-base font-bold text-primary leading-none">
                                    {formatPoints(customer.points_balance)}
                                  </p>
                                </div>
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <p className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                    {customer.full_name || "Sin nombre"}
                                  </p>
                                  {customer.nickname && (
                                    <Badge variant="outline" className="text-[11px] py-0 px-1.5 font-mono">
                                      @{customer.nickname}
                                    </Badge>
                                  )}
                                  <FrequencyBadge
                                    isFrequent={Boolean(customer.is_frequent)}
                                    isActive={Boolean(customer.is_frequent_active)}
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  {customer.email}
                                </p>
                              </div>
                            </div>

                            <div className="border-t border-border/70 pt-2.5 flex items-center justify-between text-xs text-muted-foreground">
                              <span>
                                {customer.purchase_count} compra(s) · {formatCOP(customer.total_spent)}
                              </span>
                              <span className="flex items-center gap-0.5 text-primary font-semibold group-hover:underline">
                                Ver detalle
                                <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {pageCount > 1 && (
                    <div className="flex items-center justify-between border-t pt-3">
                      <p className="text-xs text-muted-foreground">
                        Página {customerPage + 1} de {pageCount} ({totalCustomers} clientes)
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={customerPage === 0}
                          onClick={() => setCustomerPage((p) => Math.max(0, p - 1))}
                        >
                          <ChevronLeft className="size-4" />
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={customerPage >= pageCount - 1}
                          onClick={() => setCustomerPage((p) => p + 1)}
                        >
                          Siguiente
                          <ChevronRight className="size-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CustomerDetailDialog
        open={Boolean(selectedCustomerId)}
        onOpenChange={(open) => {
          if (!open) setSelectedCustomerId(null);
        }}
        customerId={selectedCustomerId}
        businessId={business.id}
      />
    </div>
  );
}
