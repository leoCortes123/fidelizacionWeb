import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  Coins,
  Copy,
  CreditCard,
  Gift,
  Package,
  QrCode,
  ReceiptText,
  Rocket,
  Settings2,
  Sparkles,
  TicketCheck,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useBusinesses, useLoyaltyProgram } from "@/features/loyalty/hooks";
import { useBusinessContext } from "@/features/loyalty/businessContext";
import { useBusinessDashboardSummary, useBusinessRecentActivity } from "./hooks";
import { publicAppUrl } from "@/lib/config";
import { formatCOP, formatDateTimeBogota, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/PageHeader";
import { CardSkeleton, EmptyState, ErrorState, ListSkeleton } from "@/components/shared/States";

export function BusinessDashboardPage() {
  const businesses = useBusinesses();
  const { selectedBusiness, setSelectedBusiness } = useBusinessContext();
  const navigate = useNavigate();
  const list = businesses.data ?? [];
  const adminBusinesses = list.filter((business) => business.role === "admin");
  const activeSelected =
    selectedBusiness &&
    selectedBusiness.role === "admin" &&
    adminBusinesses.some((business) => business.id === selectedBusiness.id)
      ? selectedBusiness
      : null;
  const showPicker = adminBusinesses.length > 1 && !activeSelected;
  const current = showPicker ? null : (activeSelected ?? adminBusinesses[0] ?? null);
  const activeBusinessId = !businesses.isLoading && current ? current.id : "";
  const program = useLoyaltyProgram(activeBusinessId);
  const summary = useBusinessDashboardSummary(activeBusinessId);
  const activity = useBusinessRecentActivity(activeBusinessId, 8);
  const [showInvite, setShowInvite] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const programUnconfigured =
    !program.isLoading &&
    (!program.data ||
      program.data.id === "00000000-0000-0000-0000-000000000000" ||
      !program.data.configured_at);

  if (businesses.isLoading) return <ListSkeleton rows={3} />;
  if (businesses.isError) {
    return <ErrorState error={businesses.error} onRetry={() => void businesses.refetch()} />;
  }

  if (showPicker) {
    return (
      <div className="space-y-4 sm:space-y-5 animate-fade-in">
        <PageHeader
          kicker="SELECCIÓN DE NEGOCIO"
          title="Selecciona un negocio"
          description="Elige el negocio que deseas administrar."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {adminBusinesses.map((business) => (
            <button
              key={business.id}
              type="button"
              onClick={() => {
                setSelectedBusiness(business);
                navigate("/admin/dashboard");
              }}
              className="group cursor-pointer rounded-none text-left focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--lp-focus-ring)]"
            >
              <Card className="h-full border-l-4 border-l-primary transition-colors duration-150 group-hover:bg-[var(--lp-tip-bg)]">
                <CardContent className="space-y-4 p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-none bg-primary/10 text-primary">
                      <Building2 className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate font-bold">{business.name}</h3>
                      <p className="truncate text-xs text-muted-foreground">
                        @{business.slug} · {business.timezone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/70 pt-3 text-xs font-semibold text-primary">
                    <span>Entrar al panel</span>
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="space-y-4 sm:space-y-5 animate-fade-in">
        <PageHeader title="Sin negocios" description="No tienes negocios asignados." />
        <EmptyState
          title="Sin negocios"
          description="Regístrate como administrador o solicita acceso a un negocio existente."
          icon={Building2}
          action={
            <Button asChild size="sm">
              <Link to="/admin/onboarding?new=1">
                <Rocket aria-hidden="true" />
                Registrar negocio
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const joinUrl = `${publicAppUrl()}/join/${encodeURIComponent(current.slug)}`;
  const data = summary.data;

  const activeCustomerRatio =
    data && data.customers_total > 0
      ? Math.min(100, Math.round((data.active_customers / data.customers_total) * 100))
      : 0;
  const budgetPercent = data ? Math.max(0, Math.min(100, data.budget_committed_percent)) : 0;
  const budgetIndicatorClass =
    budgetPercent >= 90
      ? "bg-[var(--lp-red-dark)]"
      : budgetPercent >= 70
        ? "bg-[var(--lp-gold-dark)]"
        : "bg-[var(--lp-green)]";

  function handleCopyInvite() {
    void navigator.clipboard
      .writeText(joinUrl)
      .then(() => {
        setCopiedInvite(true);
        toast.success("Enlace copiado.");
        if (copyTimerRef.current !== null) {
          window.clearTimeout(copyTimerRef.current);
        }
        copyTimerRef.current = window.setTimeout(() => {
          setCopiedInvite(false);
          copyTimerRef.current = null;
        }, 2000);
      })
      .catch(() => toast.error("No se pudo copiar el enlace."));
  }

  const showCompleteConfig =
    !program.isLoading && !program.isError && Boolean(program.data && !program.data.is_active);

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      <PageHeader
        kicker="PANEL OPERATIVO · ADMINISTRADOR"
        title="Inicio"
        description={`@${current.slug} · ${current.timezone}`}
        actionsClassName={showCompleteConfig ? undefined : "hidden sm:flex"}
        actions={
          <>
            {showCompleteConfig && (
              <Button asChild size="sm">
                <Link to="/admin/onboarding">
                  <Rocket aria-hidden="true" />
                  Completar configuración
                </Link>
              </Button>
            )}
            <Badge variant="default" className="hidden sm:inline-flex">
              Administrador
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedBusiness(null)}
              className="hidden sm:inline-flex"
            >
              Cambiar negocio
            </Button>
          </>
        }
      />

      {/* Hero Operativo */}
      <Card className="relative overflow-hidden border-[3px] border-[var(--lp-ink)] bg-[var(--lp-surface-elevated-deep)] text-[var(--lp-surface-elevated-text)] shadow-[6px_6px_0_var(--lp-blue)]">
        <CardContent className="relative flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-none border-2 border-[var(--lp-ink)] bg-[var(--lp-gold)] px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#16262e] shadow-[2px_2px_0_var(--lp-ink)]">
                <QrCode className="size-3" aria-hidden="true" />
                Modo caja rápida
              </span>
              <span className="rounded-none border-2 border-[var(--lp-ink)] bg-[var(--lp-surface-elevated)] px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--lp-gold)]">
                {program.isLoading
                  ? "Verificando programa…"
                  : programUnconfigured
                    ? "Programa pendiente de configurar"
                    : program.data?.is_active
                      ? `1 MONEDA / ${formatCOP(program.data.cop_per_point_unit)}`
                      : "Programa inactivo"}
              </span>
            </div>
            <h2 className="font-display text-xl font-extrabold tracking-tight text-[var(--lp-surface-elevated-text)] [text-shadow:2px_2px_0_#16262e] sm:text-2xl">
              Acredita monedas en segundos o aprueba canjes en mostrador
            </h2>
            <p className="max-w-2xl text-sm text-[var(--lp-surface-elevated-soft)]">
              Genera un QR único por venta para que el cliente reclame sus monedas desde el celular.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2.5">
            <Button variant="secondary" asChild>
              <Link to="/admin/purchases/new">
                <QrCode aria-hidden="true" />
                Generar QR de una venta
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="border-[var(--lp-ink)] bg-[var(--lp-surface-elevated)] text-[var(--lp-surface-elevated-text)] hover:bg-[var(--lp-tab-hover-bg)] hover:text-[var(--lp-gold)]"
            >
              <Link to="/admin/redemptions">
                <TicketCheck aria-hidden="true" />
                Ver solicitudes
                {data && data.pending_redemptions > 0 && (
                  <span className="ml-1 border border-[var(--lp-ink)] bg-[var(--lp-gold)] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#16262e]">
                    {data.pending_redemptions}
                  </span>
                )}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tier 1: KPIs operativos principales */}
      {summary.isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <CardSkeleton className="h-32" />
          <CardSkeleton className="h-32" />
          <CardSkeleton className="h-32" />
          <CardSkeleton className="h-32" />
        </div>
      ) : summary.isError || !data ? (
        <ErrorState
          error={summary.error ?? new Error("No pudimos cargar las métricas.")}
          onRetry={() => void summary.refetch()}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            <KpiCard
              icon={ReceiptText}
              label="Ventas de hoy"
              value={formatCOP(data.sales_today_cop)}
              hint={`${formatNumber(data.purchases_today)} compra(s)`}
              accent="blue"
            />
            <KpiCard
              icon={TrendingUp}
              label="Ventas del mes"
              value={formatCOP(data.sales_month_cop)}
              hint={`${formatNumber(data.purchases_month)} compra(s)`}
              accent="emerald"
            />
            <KpiCard
              icon={TicketCheck}
              label="Solicitudes pendientes"
              value={formatNumber(data.pending_redemptions)}
              hint={`${formatNumber(data.approved_pending_delivery)} por entregar`}
              accent={data.pending_redemptions > 0 ? "warning" : "slate"}
              actionHref={data.pending_redemptions > 0 ? "/admin/redemptions" : undefined}
              actionLabel={data.pending_redemptions > 0 ? "Atender canjes" : undefined}
            />
            <Card className="relative min-w-0 overflow-hidden border-t-4 border-t-primary">
              <CardContent className="space-y-2 p-3.5 sm:space-y-2.5 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 text-[11px] font-semibold uppercase leading-snug tracking-wider text-muted-foreground sm:text-xs">
                    Clientes frecuentes
                  </p>
                  <span className="grid size-7 shrink-0 place-items-center rounded-none bg-primary/10 text-primary sm:size-8">
                    <Users className="size-3.5 sm:size-4" aria-hidden="true" />
                  </span>
                </div>
                <p className="truncate font-display text-lg font-extrabold tabular-nums leading-tight tracking-tight min-[400px]:text-xl sm:text-3xl">
                  {formatNumber(data.frequent_customers)}
                </p>
                <div className="space-y-1.5">
                  <p className="truncate text-xs text-muted-foreground">
                    {formatNumber(data.active_customers)} activos de{" "}
                    {formatNumber(data.customers_total)}
                  </p>
                  <div
                    aria-hidden="true"
                    className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500"
                      style={{ width: `${activeCustomerRatio}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tier 2: Bento asimétrico de economía, actividad e invitación */}
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-12">
            <div className="space-y-4 sm:space-y-5 lg:col-span-7">
              {/* Economía y telemetría de monedas */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Coins className="size-4 text-primary" aria-hidden="true" />
                    Economía de monedas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-none border border-border/80 bg-muted/25 p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Monedas en circulación
                        </span>
                        <Coins className="size-3.5 text-primary" aria-hidden="true" />
                      </div>
                      <p className="mt-1.5 font-display text-xl font-extrabold tabular-nums">
                        {formatNumber(data.points_outstanding)}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        Emitidas: {formatNumber(data.points_issued_total)}
                      </p>
                    </div>

                    <div className="rounded-none border border-border/80 bg-muted/25 p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Monedas canjeadas
                        </span>
                        <Gift
                          className="size-3.5 text-emerald-700 dark:text-emerald-300"
                          aria-hidden="true"
                        />
                      </div>
                      <p className="mt-1.5 font-display text-xl font-extrabold tabular-nums">
                        {formatNumber(data.points_redeemed_total)}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {data.last_activity_at
                          ? `Última: ${formatDateTimeBogota(data.last_activity_at)}`
                          : "Sin actividad todavía"}
                      </p>
                    </div>

                    <div className="rounded-none border border-border/80 bg-muted/25 p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          QR de venta pendientes
                        </span>
                        <QrCode className="size-3.5 text-[var(--lp-gold-ink)]" aria-hidden="true" />
                      </div>
                      <p className="mt-1.5 font-display text-xl font-extrabold tabular-nums">
                        {formatNumber(data.pending_qr_count)}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        Esperando al cliente
                      </p>
                    </div>
                  </div>

                  {/* Medidor de presupuesto */}
                  <div className="space-y-2 rounded-none border border-border/80 bg-muted/20 p-3.5 sm:p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <Wallet className="size-3.5 text-primary" aria-hidden="true" />
                        Presupuesto comprometido
                      </span>
                      <span className="font-mono text-sm font-bold tabular-nums text-foreground">
                        {formatNumber(data.budget_committed_percent)} %
                      </span>
                    </div>
                    <Progress
                      value={budgetPercent}
                      label="Presupuesto comprometido"
                      indicatorClassName={budgetIndicatorClass}
                    />
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>Del presupuesto mensual</span>
                      <Link
                        to="/admin/perfil?tab=economico"
                        className="font-semibold text-primary hover:underline"
                      >
                        Ver detalle económico →
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actividad reciente */}
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="size-4 text-primary" aria-hidden="true" />
                    Actividad reciente
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin/purchases">
                      Ver ventas
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {activity.isLoading ? (
                    <ListSkeleton rows={3} />
                  ) : activity.isError ? (
                    <ErrorState error={activity.error} onRetry={() => void activity.refetch()} />
                  ) : !activity.data || activity.data.length === 0 ? (
                    <div className="rounded-none border border-dashed border-border bg-muted/20 p-5 text-center sm:p-6">
                      <p className="text-sm text-muted-foreground">
                        Aún no hay compras ni canjes. Genera el primer QR de venta.
                      </p>
                      <Button asChild size="sm" variant="outline" className="mt-3">
                        <Link to="/admin/purchases/new">
                          <QrCode aria-hidden="true" />
                          Registrar primera venta
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <ul className="divide-y divide-border/70">
                      {activity.data.map((item) => (
                        <li
                          key={`${item.kind}-${item.id}`}
                          className="flex items-start gap-3.5 py-3.5 first:pt-1 last:pb-1"
                        >
                          <span
                            className={cn(
                              "grid size-9 shrink-0 place-items-center rounded-none",
                              item.kind === "purchase"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : "bg-primary/10 text-primary",
                            )}
                          >
                            {item.kind === "purchase" ? (
                              <ReceiptText className="size-4" aria-hidden="true" />
                            ) : (
                              <Gift className="size-4" aria-hidden="true" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline justify-between gap-2">
                              <span className="truncate text-sm font-semibold">{item.title}</span>
                              <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                                {formatDateTimeBogota(item.created_at)}
                              </span>
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                              {item.detail}
                              {item.amount_cop ? ` · ${formatCOP(item.amount_cop)}` : ""}
                              {item.points ? ` · ${formatNumber(item.points)} monedas` : ""}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Columna derecha: Invitar clientes + Accesos rápidos */}
            <div className="space-y-4 sm:space-y-5 lg:col-span-5">
              <Card>
                <CardContent className="p-4 sm:p-5">
                  <details
                    open={showInvite}
                    onToggle={(event) =>
                      setShowInvite((event.currentTarget as HTMLDetailsElement).open)
                    }
                    className="group"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-none px-1 py-1">
                      <span className="flex items-center gap-2.5 text-base font-bold">
                        <span className="grid size-8 place-items-center rounded-none bg-primary/10 text-primary">
                          <UserPlus className="size-4" aria-hidden="true" />
                        </span>
                        Invitar clientes
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                        <span className="group-open:hidden">Mostrar QR</span>
                        <span className="hidden group-open:inline">Ocultar</span>
                        <ChevronDown
                          className="size-3.5 transition-transform group-open:rotate-180"
                          aria-hidden="true"
                        />
                      </span>
                    </summary>
                    <div className="space-y-4 pt-4">
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        Comparte este enlace o QR. Quien lo abra podrá afiliarse a{" "}
                        <strong>{current.name}</strong> y empezar a acumular.
                      </p>
                      <div className="flex gap-2">
                        <input
                          readOnly
                          value={joinUrl}
                          aria-label="Enlace de invitación"
                          className="h-10 min-w-0 flex-1 rounded-none border-2 border-input bg-card px-2.5 py-1 font-mono text-base text-foreground shadow-[2px_2px_0_var(--lp-ink)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--lp-focus-ring)] dark:bg-[var(--lp-paper-deep)] sm:text-xs"
                          onFocus={(event) => event.currentTarget.select()}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCopyInvite}
                        >
                          {copiedInvite ? (
                            <Check
                              className="text-emerald-700 dark:text-emerald-300"
                              aria-hidden="true"
                            />
                          ) : (
                            <Copy aria-hidden="true" />
                          )}
                          {copiedInvite ? "Copiado" : "Copiar"}
                        </Button>
                      </div>
                      <div className="mx-auto w-fit rounded-none border-2 border-[var(--lp-ink)] bg-white p-3.5 shadow-[4px_4px_0_var(--lp-ink)]">
                        <QRCodeCanvas
                          value={joinUrl}
                          size={168}
                          marginSize={2}
                          level="M"
                          aria-label="QR de invitación al negocio"
                        />
                      </div>
                    </div>
                  </details>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <QrCode className="size-4 text-primary" aria-hidden="true" />
                    Accesos rápidos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between gap-3 rounded-none border border-border/80 bg-muted/30 px-3 py-2 text-sm sm:px-3.5 sm:py-2.5">
                    <span className="font-semibold">Estado del programa</span>
                    <Badge
                      variant={
                        programUnconfigured
                          ? "warning"
                          : program.data?.is_active
                            ? "success"
                            : "muted"
                      }
                    >
                      {programUnconfigured
                        ? "Sin configurar"
                        : program.data?.is_active
                          ? "Activo"
                          : "Inactivo"}
                    </Badge>
                  </div>

                  <Button className="w-full justify-between" asChild>
                    <Link to="/admin/purchases/new">
                      <span className="flex items-center gap-2">
                        <QrCode className="size-4" aria-hidden="true" />
                        Generar QR de una venta
                      </span>
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <QuickTile
                      to="/admin/perfil?tab=programa"
                      icon={Settings2}
                      label="Programa"
                      hint="Reglas y vigencia"
                    />
                    <QuickTile
                      to="/admin/products"
                      icon={Package}
                      label="Carta"
                      hint="Productos y precios"
                    />
                    <QuickTile
                      to="/admin/rewards"
                      icon={CreditCard}
                      label="Recompensas"
                      hint="Recompensas activas"
                    />
                    <QuickTile
                      to="/admin/members"
                      icon={Users}
                      label="Miembros"
                      hint="Encargados y roles"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  actionHref,
  actionLabel,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  accent: "blue" | "emerald" | "warning" | "slate";
  actionHref?: string;
  actionLabel?: string;
}) {
  const accentStyles = {
    blue: {
      border: "border-t-primary",
      iconWrap: "bg-primary/10 text-primary",
      cardBg: "",
    },
    emerald: {
      border: "border-t-emerald-500",
      iconWrap: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
      cardBg: "",
    },
    warning: {
      border: "border-t-amber-500",
      iconWrap: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300",
      cardBg: "bg-amber-50/40 dark:bg-amber-950/15",
    },
    slate: {
      border: "border-t-muted-foreground/40",
      iconWrap: "bg-muted text-muted-foreground",
      cardBg: "",
    },
  }[accent];

  return (
    <Card
      className={cn("min-w-0 overflow-hidden border-t-4", accentStyles.border, accentStyles.cardBg)}
    >
      <CardContent className="space-y-2 p-3.5 sm:space-y-2.5 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 text-[11px] font-semibold uppercase leading-snug tracking-wider text-muted-foreground sm:text-xs">
            {label}
          </p>
          <span
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-none sm:size-8",
              accentStyles.iconWrap,
            )}
          >
            <Icon className="size-3.5 sm:size-4" aria-hidden="true" />
          </span>
        </div>
        <p className="truncate font-display text-lg font-extrabold tabular-nums leading-tight tracking-tight min-[400px]:text-xl sm:text-3xl">
          {value}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
          {accent === "warning" && actionHref && actionLabel && (
            <Link
              to={actionHref}
              className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-amber-800 hover:underline dark:text-amber-300"
            >
              <AlertTriangle className="size-3" aria-hidden="true" />
              {actionLabel}
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickTile({
  to,
  icon: Icon,
  label,
  hint,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  hint: string;
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-1 rounded-none border-2 border-[var(--lp-ink)] bg-[var(--lp-paper)] p-3.5 shadow-[3px_3px_0_var(--lp-ink)] transition-[transform,box-shadow,background-color] duration-150 hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[var(--lp-tip-bg)] hover:shadow-[2px_2px_0_var(--lp-ink)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--lp-focus-ring)] motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="grid size-8 place-items-center rounded-none border-2 border-[var(--lp-ink)] bg-[var(--lp-gold)] text-[#16262e]">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <ArrowRight
          className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
          aria-hidden="true"
        />
      </div>
      <span className="mt-1 font-display text-sm font-bold text-foreground">{label}</span>
      <span className="text-[11px] text-muted-foreground">{hint}</span>
    </Link>
  );
}
