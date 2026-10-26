import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Gift,
  LockKeyhole,
  ReceiptText,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { useDashboard, useMyPurchases, useProgramSettings } from '@/features/points/hooks';
import { useRewards } from '@/features/rewards/hooks';
import { formatCOP, formatDateBogota, formatPoints } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  EmptyState,
  ErrorState,
  CardSkeleton,
  ListSkeleton,
} from '@/components/shared/States';
import { PageHeader } from '@/components/shared/PageHeader';

export function DashboardPage() {
  const { displayName, user } = useAuth();
  const dashboard = useDashboard();
  const rewards = useRewards();
  const settings = useProgramSettings();
  const purchases = useMyPurchases(5, 0);

  if (dashboard.isLoading) {
    return (
      <div className="space-y-5">
        <CardSkeleton className="h-52" />
        <div className="grid gap-4 sm:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <ListSkeleton rows={3} />
      </div>
    );
  }

  if (dashboard.isError) {
    return (
      <ErrorState
        error={dashboard.error}
        onRetry={() => void dashboard.refetch()}
      />
    );
  }

  const data = dashboard.data;
  if (!data) return null;

  const balance = data.points_balance;
  const firstName = displayName.split(' ')[0] || 'hola';
  const unit = settings.data?.cop_per_point_unit;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`¡Hola, ${firstName}!`}
        description={user?.email ?? 'Tu cuenta de cliente'}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/customer/balance">
              <Gift aria-hidden="true" />
              Ver recompensas
            </Link>
          </Button>
        }
      />

      <Card className="overflow-hidden border-0 bg-foreground text-background shadow-lg">
        <CardContent className="relative space-y-6 p-6 sm:p-8">
          <div
            aria-hidden="true"
            className="absolute -right-10 -top-10 size-40 rounded-full bg-primary/30 blur-2xl"
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-background/60">
                Tus loopoints
              </p>
              <p
                data-testid="points-balance"
                className="mt-1 break-all font-display text-7xl font-extrabold leading-none text-amber-300 sm:text-8xl"
              >
                {balance}
              </p>
              <p className="mt-2 text-sm text-background/70">
                {formatPoints(balance)}
              </p>
            </div>
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-background/10 text-2xl">
              ⭐
            </span>
          </div>

          <div className="relative grid grid-cols-2 gap-3 border-t border-background/10 pt-4">
            <div>
              <p className="font-display text-2xl font-extrabold">
                {data.purchase_count}
              </p>
              <p className="text-xs text-background/70">compras registradas</p>
            </div>
            <div>
              <p className="font-display text-2xl font-extrabold">
                {formatCOP(data.total_spent_cop)}
              </p>
              <p className="text-xs text-background/70">acumulado</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-extrabold">Recompensas</h2>
            <p className="text-sm text-muted-foreground">
              Las marcadas en verde ya las puedes pedir en caja.
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            <Sparkles className="mr-1 size-3.5" aria-hidden="true" />
            {data.ready_rewards} disponibles
          </Badge>
        </div>

        {rewards.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : rewards.isError ? (
          <ErrorState error={rewards.error} onRetry={() => void rewards.refetch()} />
        ) : !rewards.data || rewards.data.length === 0 ? (
          <EmptyState
            title="Catálogo en preparación"
            description="Todavía no hay recompensas publicadas. Vuelve pronto."
            icon={Gift}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {rewards.data.map((reward) => {
              const progress = Math.min(
                (balance / reward.points_cost) * 100,
                100,
              );
              return (
                <Card
                  key={reward.id}
                  className={
                    reward.can_redeem
                      ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20'
                      : undefined
                  }
                >
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold leading-tight">{reward.name}</h3>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {reward.description}
                        </p>
                      </div>
                      {reward.can_redeem ? (
                        <Badge variant="success" className="shrink-0">
                          <Check className="mr-1 size-3" aria-hidden="true" />
                          Disponible
                        </Badge>
                      ) : (
                        <Badge variant="muted" className="shrink-0">
                          <LockKeyhole className="mr-1 size-3" aria-hidden="true" />
                          Faltan {reward.remaining}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold">
                          {reward.points_cost} pts
                        </span>
                        <span className="text-muted-foreground">
                          {reward.can_redeem
                            ? 'Muéstrala en caja'
                            : `${Math.floor(progress)}% de avance`}
                        </span>
                      </div>
                      <Progress
                        value={progress}
                        label={`Progreso para ${reward.name}`}
                        className={reward.can_redeem ? '[&>div]:bg-emerald-500' : undefined}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Compras recientes</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/customer/purchases">
              Ver historial
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {purchases.isLoading ? (
            <ListSkeleton rows={2} />
          ) : purchases.isError ? (
            <ErrorState
              error={purchases.error}
              onRetry={() => void purchases.refetch()}
            />
          ) : !purchases.data || purchases.data.length === 0 ? (
            <EmptyState
              title="Aún no tienes compras"
              description="Pide en caja que generen el QR de tu compra y escanéalo con este teléfono."
              icon={ReceiptText}
              className="border-0 bg-transparent py-6"
            />
          ) : (
            <ul className="divide-y">
              {purchases.data.map((purchase) => (
                <li
                  key={purchase.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-semibold">{formatCOP(purchase.amount_cop)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateBogota(purchase.claimed_at)}
                    </p>
                  </div>
                  <Badge variant="success">+{purchase.points_awarded} pts</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed bg-secondary/30">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
            <TrendingUp className="size-4" aria-hidden="true" />
          </span>
          <div className="space-y-1 text-sm">
            <p className="font-semibold">¿Cómo sumo más loopoints?</p>
            <p className="text-muted-foreground">
              Pide en caja que registren tu compra y escanea el QR con este
              teléfono. {unit ? `Ganas 1 loopoint por cada ${formatCOP(unit)}.` : ''}{' '}
              Para canjear, el equipo aplica la recompensa desde el panel y tus
              loopoints se descuentan al instante.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
