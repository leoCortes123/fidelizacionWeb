import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useBusinesses, useLoyaltyProgram } from '@/features/loyalty/hooks';
import { useBusinessContext } from '@/features/loyalty/businessContext';
import {
  useBusinessDashboardSummary,
  useBusinessRecentActivity,
} from './hooks';
import { publicAppUrl } from '@/lib/config';
import {
  formatCOP,
  formatDateTimeBogota,
  formatNumber,
} from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import {
  EmptyState,
  ErrorState,
  CardSkeleton,
  ListSkeleton,
} from '@/components/shared/States';

export function BusinessDashboardPage() {
  const businesses = useBusinesses();
  const { selectedBusiness, setSelectedBusiness } = useBusinessContext();
  const navigate = useNavigate();
  const activeBusinessId = selectedBusiness?.id ?? businesses.data?.[0]?.id ?? '';
  const program = useLoyaltyProgram(activeBusinessId);
  const summary = useBusinessDashboardSummary(activeBusinessId);
  const activity = useBusinessRecentActivity(activeBusinessId, 8);
  const [showInvite, setShowInvite] = useState(false);

  const programUnconfigured =
    !program.data ||
    program.data.id === '00000000-0000-0000-0000-000000000000' ||
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
        title={`Inicio — ${current.name}`}
        description={`${current.slug} · ${current.timezone}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {!program.data?.is_active && (
              <Button asChild size="sm">
                <Link to="/admin/config?tab=negocio&onboarding=1">
                  <Rocket aria-hidden="true" />
                  Completar configuración
                </Link>
              </Button>
            )}
            <Badge variant="secondary">
              {current.role === 'admin'
                ? 'Administrador'
                : current.role === 'encargado'
                  ? 'Encargado'
                  : 'Cliente'}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setSelectedBusiness(null)}>
              Cambiar negocio
            </Button>
          </div>
        }
      />

      {summary.isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <CardSkeleton className="h-28" />
          <CardSkeleton className="h-28" />
          <CardSkeleton className="h-28" />
          <CardSkeleton className="h-28" />
        </div>
      ) : summary.isError || !data ? (
        <ErrorState
          error={summary.error ?? new Error('No pudimos cargar las métricas.')}
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
            tone={data.pending_redemptions > 0 ? 'warning' : 'default'}
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
                : 'Sin actividad todavía'
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
              <ErrorState
                error={activity.error}
                onRetry={() => void activity.refetch()}
              />
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
                        item.kind === 'purchase'
                          ? 'grid size-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700'
                          : 'grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground'
                      }
                    >
                      {item.kind === 'purchase' ? (
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
                        {item.amount_cop ? ` · ${formatCOP(item.amount_cop)}` : ''}
                        {item.points ? ` · ${formatNumber(item.points)} loopoints` : ''}
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
                    Comparte este enlace o QR. Quien lo abra podrá afiliarse a{' '}
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
                          .then(() => toast.success('Enlace copiado.'))
                          .catch(() => toast.error('No se pudo copiar el enlace.'));
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
                    programUnconfigured
                      ? 'warning'
                      : program.data?.is_active
                        ? 'success'
                        : 'muted'
                  }
                >
                  {programUnconfigured
                    ? 'Sin configurar'
                    : program.data?.is_active
                      ? 'Activo'
                      : 'Inactivo'}
                </Badge>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button variant="outline" className="justify-start" asChild>
                  <Link to="/admin/config?tab=programa">
                    <Settings2 className="mr-2 size-4" aria-hidden="true" />
                    Programa
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link to="/admin/config?tab=carta">
                    <Package className="mr-2 size-4" aria-hidden="true" />
                    Carta
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link to="/admin/config?tab=recompensas">
                    <CreditCard className="mr-2 size-4" aria-hidden="true" />
                    Recompensas
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link to="/admin/config?tab=equipo">
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
  tone = 'default',
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'warning';
}) {
  return (
    <Card>
      <CardContent className="space-y-1 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <Icon
            className={
              tone === 'warning'
                ? 'size-4 shrink-0 text-amber-600'
                : 'size-4 shrink-0 text-muted-foreground'
            }
            aria-hidden="true"
          />
        </div>
        <p className="font-display text-xl font-extrabold leading-tight sm:text-2xl">
          {value}
        </p>
        {hint && <p className="truncate text-[11px] text-muted-foreground">{hint}</p>}
        {tone === 'warning' && (
          <p className="flex items-center gap-1 text-[11px] font-semibold text-amber-700">
            <AlertTriangle className="size-3" aria-hidden="true" />
            Requieren atención
          </p>
        )}
      </CardContent>
    </Card>
  );
}
