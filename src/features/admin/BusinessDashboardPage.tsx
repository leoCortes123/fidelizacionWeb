import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import {
  AlertTriangle,
  Building2,
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState, ErrorState, CardSkeleton, ListSkeleton } from "@/components/shared/States";

export function BusinessDashboardPage() {
  const businesses = useBusinesses();
  const { selectedBusiness, setSelectedBusiness } = useBusinessContext();
  const navigate = useNavigate();
  const activeBusinessId = selectedBusiness?.id ?? businesses.data?.[0]?.id ?? "";
  const program = useLoyaltyProgram(activeBusinessId);
  const summary = useBusinessDashboardSummary(activeBusinessId);
  const activity = useBusinessRecentActivity(activeBusinessId, 8);
  const [showInvite, setShowInvite] = useState(false);

  const programUnconfigured =
    !program.data ||
    program.data.id === "00000000-0000-0000-0000-000000000000" ||
    !program.data.configured_at;

  if (businesses.isLoading) return <ListSkeleton rows={3} />;
  if (businesses.isError) {
    return <ErrorState error={businesses.error} onRetry={() => void businesses.refetch()} />;
  }

  const list = businesses.data ?? [];

  if (list.length > 1 && !selectedBusiness) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Selecciona un negocio"
          description="Elige el negocio que deseas administrar."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((business) => (
            <Card
              key={business.id}
              className="cursor-pointer border-l-4 border-primary transition-shadow hover:shadow-md"
              onClick={() => {
                setSelectedBusiness(business);
                navigate(`/admin/dashboard?business=${business.id}`);
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Building2 className="size-8 text-primary" aria-hidden="true" />
                  <div>
                    <h3 className="font-semibold">{business.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {business.slug} · {business.timezone}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Haz clic para entrar al panel de este negocio.
                </p>
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
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Sin negocios" description="No tienes negocios asignados." />
        <EmptyState
          title="Sin negocios"
          description="Regístrate como administrador o solicita acceso a un negocio existente."
          icon={Building2}
        />
      </div>
    );
  }

  const joinUrl = `${publicAppUrl()}/join/${encodeURIComponent(current.slug)}`;
  const data = summary.data;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        kicker="PANEL OPERATIVO · ADMINISTRADOR"
        title={`Inicio — ${current.name}`}
        description={`${current.slug} · ${current.timezone}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {!program.data?.is_active && (
              <Button asChild size="sm">
                <Link to="/admin/onboarding">
                  <Rocket aria-hidden="true" />
                  Completar configuración
                </Link>
              </Button>
            )}
            <Badge variant="default">
              {current.role === "admin"
                ? "Administrador"
                : current.role === "encargado"
                  ? "Encargado"
                  : "Cliente"}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setSelectedBusiness(null)}>
              Cambiar negocio
            </Button>
          </div>
        }
      />

      {/* Hero Operativo Pixel-App */}
      <Card className="overflow-hidden border-2 border-slate-900 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white shadow-sm dark:border-slate-700">
        <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded bg-amber-400 px-2 py-0.5 font-pixel text-[9px] text-slate-950">
                MODO CAJA RÁPIDA
              </span>
              <span className="font-mono text-xs text-blue-200">
                {programUnconfigured
                  ? "Programa pendiente de configurar"
                  : program.data?.is_active
                    ? `1 PTO / ${formatCOP(program.data.cop_per_point_unit)}`
                    : "Programa inactivo"}
              </span>
            </div>
            <h2 className="font-display text-lg font-bold tracking-tight sm:text-xl">
              Acredita loopoints en segundos o aprueba canjes en mostrador
            </h2>
            <p className="text-xs text-slate-300">
              Genera un QR único por venta para que el cliente reclame sus puntos desde el celular.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="secondary" asChild>
              <Link to="/admin/purchases/new">
                <QrCode aria-hidden="true" />
                Generar QR de una venta
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="border-slate-400 bg-slate-800/80 text-white hover:bg-slate-800 hover:text-amber-300"
            >
              <Link to="/admin/redemptions">
                <TicketCheck aria-hidden="true" />
                Ver solicitudes
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {summary.isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <CardSkeleton className="h-28" />
          <CardSkeleton className="h-28" />
          <CardSkeleton className="h-28" />
          <CardSkeleton className="h-28" />
        </div>
      ) : summary.isError || !data ? (
        <ErrorState
          error={summary.error ?? new Error("No pudimos cargar las métricas.")}
          onRetry={() => void summary.refetch()}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={Coins}
            label="Loopoints en circulación"
            value={formatNumber(data.points_outstanding)}
            hint={`Emitidos: ${formatNumber(data.points_issued_total)}`}
          />
          <StatCard
            icon={TicketCheck}
            label="Solicitudes pendientes"
            value={formatNumber(data.pending_redemptions)}
            hint={`${formatNumber(data.approved_pending_delivery)} por entregar`}
            tone={data.pending_redemptions > 0 ? "warning" : "default"}
          />
          <StatCard
            icon={Users}
            label="Clientes frecuentes"
            value={formatNumber(data.frequent_customers)}
            hint={`${formatNumber(data.active_customers)} activos de ${formatNumber(
              data.customers_total,
            )}`}
          />
          <StatCard
            icon={ReceiptText}
            label="Ventas de hoy"
            value={formatCOP(data.sales_today_cop)}
            hint={`${formatNumber(data.purchases_today)} compra(s)`}
          />
          <StatCard
            icon={TrendingUp}
            label="Ventas del mes"
            value={formatCOP(data.sales_month_cop)}
            hint={`${formatNumber(data.purchases_month)} compra(s)`}
          />
          <StatCard
            icon={Wallet}
            label="Presupuesto comprometido"
            value={`${formatNumber(data.budget_committed_percent)} %`}
            hint="Del presupuesto mensual"
          />
          <StatCard
            icon={QrCode}
            label="QR de venta pendientes"
            value={formatNumber(data.pending_qr_count)}
            hint="Esperando al cliente"
          />
          <StatCard
            icon={Gift}
            label="Loopoints canjeados"
            value={formatNumber(data.points_redeemed_total)}
            hint={
              data.last_activity_at
                ? `Última actividad: ${formatDateTimeBogota(data.last_activity_at)}`
                : "Sin actividad todavía"
            }
          />
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-muted-foreground" aria-hidden="true" />
              Actividad reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activity.isLoading ? (
              <ListSkeleton rows={3} />
            ) : activity.isError ? (
              <ErrorState error={activity.error} onRetry={() => void activity.refetch()} />
            ) : !activity.data || activity.data.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aún no hay compras ni canjes. Genera el primer QR de venta.
              </p>
            ) : (
              <ul className="divide-y">
                {activity.data.map((item) => (
                  <li key={`${item.kind}-${item.id}`} className="flex items-start gap-3 py-3">
                    <span
                      className={
                        item.kind === "purchase"
                          ? "grid size-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700"
                          : "grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground"
                      }
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
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDateTimeBogota(item.created_at)}
                        </span>
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.detail}
                        {item.amount_cop ? ` · ${formatCOP(item.amount_cop)}` : ""}
                        {item.points ? ` · ${formatNumber(item.points)} loopoints` : ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardContent className="p-4">
              <details
                open={showInvite}
                onToggle={(event) =>
                  setShowInvite((event.currentTarget as HTMLDetailsElement).open)
                }
                className="group"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-1 py-1">
                  <span className="flex items-center gap-2 text-base font-semibold">
                    <UserPlus className="size-4 text-muted-foreground" aria-hidden="true" />
                    Invitar clientes
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="group-open:hidden">Mostrar QR</span>
                    <span className="hidden group-open:inline">Ocultar</span>
                    <ChevronDown
                      className="size-4 transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </span>
                </summary>
                <div className="space-y-4 pt-3">
                  <p className="text-sm text-muted-foreground">
                    Comparte este enlace o QR. Quien lo abra podrá afiliarse a{" "}
                    <strong>{current.name}</strong> y empezar a acumular.
                  </p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={joinUrl}
                      aria-label="Enlace de invitación"
                      className="min-w-0 flex-1 rounded-md border border-input bg-muted/40 px-3 py-2 text-xs"
                      onFocus={(event) => event.currentTarget.select()}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        void navigator.clipboard
                          .writeText(joinUrl)
                          .then(() => toast.success("Enlace copiado."))
                          .catch(() => toast.error("No se pudo copiar el enlace."));
                      }}
                    >
                      <Copy aria-hidden="true" />
                      Copiar
                    </Button>
                  </div>
                  <div className="mx-auto w-fit rounded-xl border bg-white p-3">
                    <QRCodeCanvas
                      value={joinUrl}
                      size={160}
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
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <QrCode className="size-4 text-muted-foreground" aria-hidden="true" />
                Accesos rápidos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" asChild>
                <Link to="/admin/purchases/new">
                  <QrCode className="mr-2 size-4" aria-hidden="true" />
                  Generar QR de una venta
                </Link>
              </Button>
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                <span className="font-medium">Estado del programa</span>
                <Badge
                  variant={
                    programUnconfigured ? "warning" : program.data?.is_active ? "success" : "muted"
                  }
                >
                  {programUnconfigured
                    ? "Sin configurar"
                    : program.data?.is_active
                      ? "Activo"
                      : "Inactivo"}
                </Badge>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button variant="outline" className="justify-start" asChild>
                  <Link to="/admin/perfil?tab=programa">
                    <Settings2 className="mr-2 size-4" aria-hidden="true" />
                    Programa
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link to="/admin/products">
                    <Package className="mr-2 size-4" aria-hidden="true" />
                    Carta
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link to="/admin/rewards">
                    <CreditCard className="mr-2 size-4" aria-hidden="true" />
                    Recompensas
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link to="/admin/members">
                    <Users className="mr-2 size-4" aria-hidden="true" />
                    Equipo
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warning";
}) {
  return (
    <Card
      className={
        tone === "warning"
          ? "border-t-4 border-t-amber-500 bg-amber-50/30 dark:bg-amber-950/10"
          : "border-t-4 border-t-primary"
      }
    >
      <CardContent className="space-y-1.5 p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <span
            className={
              tone === "warning"
                ? "grid size-7 shrink-0 place-items-center rounded border border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
                : "grid size-7 shrink-0 place-items-center rounded border border-blue-200 bg-blue-50 text-primary dark:border-blue-900 dark:bg-blue-950"
            }
          >
            <Icon className="size-3.5" aria-hidden="true" />
          </span>
        </div>
        <p className="font-display text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">
          {value}
        </p>
        {hint && <p className="truncate text-[11px] text-muted-foreground">{hint}</p>}
        {tone === "warning" && (
          <p className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400">
            <AlertTriangle className="size-3" aria-hidden="true" />
            Requieren atención
          </p>
        )}
      </CardContent>
    </Card>
  );
}
