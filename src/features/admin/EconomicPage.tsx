import {
  AlertTriangle,
  BadgeDollarSign,
  Calculator,
  Camera,
  PiggyBank,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useBudgetSnapshots,
  useBusinessEconomicDashboard,
  useBusinessEconomicProfile,
  useCreateBudgetSnapshot,
} from '@/features/loyalty/hooks';
import { errorMessage } from '@/lib/errors';
import { formatCOP, formatDateBogota, formatDateTimeBogota, formatNumber } from '@/lib/format';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState, LoadingScreen } from '@/components/shared/States';
import { BusinessGate } from './BusinessGate';
import {
  ECONOMIC_FIELDS,
  ECONOMIC_STATUS_LABEL,
  ECONOMIC_STATUS_VARIANT,
  EconomicDataForm,
} from './EconomicDataForm';
import type {
  Business,
  BusinessEconomicDashboard,
  EconomicDataStatus,
} from '@/types';

export function EconomicPage() {
  return (
    <BusinessGate
      title="Panel económico"
      description="Elige el negocio cuyo presupuesto de recompensas deseas revisar."
      icon={BadgeDollarSign}
      emptyDescription="Registra un negocio para calcular su presupuesto de recompensas."
    >
      {(business) => <EconomicSection key={business.id} business={business} />}
    </BusinessGate>
  );
}

function EconomicSection({ business }: { business: Business }) {
  const profile = useBusinessEconomicProfile(business.id);
  const dashboard = useBusinessEconomicDashboard(business.id);

  if (profile.isLoading || dashboard.isLoading) {
    return <LoadingScreen label="Cargando el panel económico…" />;
  }
  if (profile.isError) {
    return <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />;
  }
  if (dashboard.isError) {
    return <ErrorState error={dashboard.error} onRetry={() => void dashboard.refetch()} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Panel económico — ${business.name}`}
        description="Estimación comercial del costo de las recompensas. No es un costo contable."
      />

      <EconomicDataForm
        key={profile.data?.updated_at ?? 'new'}
        businessId={business.id}
        profile={profile.data ?? null}
      />

      {dashboard.data && <EconomicDashboardCards data={dashboard.data} />}

      <BudgetSnapshotsCard businessId={business.id} />
    </div>
  );
}

function EconomicDashboardCards({ data }: { data: BusinessEconomicDashboard }) {
  const committed = Math.max(0, data.budget_committed_percent);
  const status = data.data_status ?? {};
  const card = (
    label: string,
    value: string,
    hint: string,
    icon: typeof Wallet,
  ) => {
    const Icon = icon;
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="mt-2 font-display text-2xl font-extrabold">{value}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {committed >= 100 ? (
        <Alert variant="destructive">
          <AlertTitle>Presupuesto de recompensas agotado</AlertTitle>
          <AlertDescription>
            El costo comprometido alcanzó el 100 % del presupuesto mensual.
          </AlertDescription>
        </Alert>
      ) : committed >= 80 ? (
        <Alert variant="warning">
          <AlertTitle>Presupuesto cerca del límite</AlertTitle>
          <AlertDescription>
            El costo comprometido supera el 80 % del presupuesto mensual.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {card(
          'Ventas mensuales',
          formatCOP(data.monthly_estimated_sales_cop),
          data.estimated ? 'Estimado con los datos actuales' : 'Calculado',
          TrendingUp,
        )}
        {card(
          'Presupuesto de referencia',
          formatCOP(data.reference_budget_cop),
          `${(data.budget_rate * 100).toFixed(2)} % de las ventas`,
          Calculator,
        )}
        {card(
          'Presupuesto máximo',
          formatCOP(data.max_monthly_reward_budget_cop),
          'Tope mensual configurado',
          PiggyBank,
        )}
        {card(
          'Costo redimido',
          formatCOP(data.redeemed_rewards_cost_cop),
          'Recompensas entregadas',
          Wallet,
        )}
        {card(
          'Costo pendiente',
          formatCOP(data.pending_rewards_cost_cop),
          'Solicitudes pendientes o aprobadas',
          AlertTriangle,
        )}
        {card(
          'Reservado',
          formatCOP(data.reserved_rewards_cost_cop),
          'Comprometido sin entregar',
          BadgeDollarSign,
        )}
        {card(
          'Presupuesto restante',
          formatCOP(data.remaining_budget_cop),
          'Descontando redimido y pendiente',
          PiggyBank,
        )}
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Presupuesto comprometido</p>
              <p className="text-xs text-muted-foreground">
                Costo redimido y pendiente sobre el presupuesto máximo.
              </p>
            </div>
            <p className="font-display text-xl font-extrabold">{committed.toFixed(1)} %</p>
          </div>
          <Progress value={Math.min(committed, 100)} label="Presupuesto comprometido" />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Estados de los datos:</span>
        {ECONOMIC_FIELDS.map((config) => {
          const value = status[config.field];
          const normalised: EconomicDataStatus =
            value === 'confirmed' || value === 'estimated' || value === 'unknown'
              ? value
              : 'unknown';
          return (
            <Badge key={config.field} variant={ECONOMIC_STATUS_VARIANT[normalised]}>
              {config.label}: {ECONOMIC_STATUS_LABEL[normalised]}
            </Badge>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Cálculo actualizado el {formatDateTimeBogota(data.calculated_at)}. Es una
        estimación comercial basada en precios y puntos, no un costo contable.
      </p>
    </div>
  );
}

function BudgetSnapshotsCard({ businessId }: { businessId: string }) {
  const snapshots = useBudgetSnapshots(businessId, 12);
  const createSnapshot = useCreateBudgetSnapshot();

  async function handleCreate() {
    try {
      const snapshot = await createSnapshot.mutateAsync({ businessId });
      toast.success(
        `Snapshot de ${formatDateBogota(snapshot.period_start)} guardado.`,
      );
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Camera className="size-4 text-muted-foreground" aria-hidden="true" />
            Snapshots mensuales
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Fijan los indicadores del mes para comparar el presupuesto en el tiempo.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void handleCreate()}
          loading={createSnapshot.isPending}
        >
          <Camera aria-hidden="true" />
          Guardar snapshot del mes
        </Button>
      </CardHeader>
      <CardContent>
        {snapshots.isError ? (
          <p className="text-sm text-destructive">
            {errorMessage(snapshots.error)}
          </p>
        ) : !snapshots.data || snapshots.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay snapshots. Guarda el primero para dejar constancia del mes
            actual. El job mensual también lo hace automáticamente.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="py-2 pr-4">Periodo</th>
                  <th scope="col" className="py-2 pr-4 text-right">Ventas</th>
                  <th scope="col" className="py-2 pr-4 text-right">Presupuesto</th>
                  <th scope="col" className="py-2 pr-4 text-right">Redimido</th>
                  <th scope="col" className="py-2 pr-4 text-right">Pendiente</th>
                  <th scope="col" className="py-2 text-right">Puntos (emitidos / canjeados)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {snapshots.data.map((snapshot) => (
                  <tr key={snapshot.id}>
                    <td className="py-2 pr-4 font-medium">
                      {formatDateBogota(snapshot.period_start)}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {formatCOP(snapshot.monthly_sales_cop)}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {formatCOP(snapshot.max_budget_cop)}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {formatCOP(snapshot.redeemed_cost_cop)}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {formatCOP(snapshot.pending_cost_cop)}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {formatNumber(snapshot.points_issued)} /{' '}
                      {formatNumber(snapshot.points_redeemed)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
