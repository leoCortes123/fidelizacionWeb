import { Gift, TicketCheck } from 'lucide-react';
import { useMyRedemptions } from '@/features/points/hooks';
import { formatDateTimeBogota } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { RedemptionStatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/shared/States';

export function RedemptionsPage() {
  const redemptions = useMyRedemptions();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Mis canjes"
        description="Recompensas que el equipo ha aplicado a tu cuenta."
      />

      {redemptions.isLoading ? (
        <ListSkeleton rows={3} />
      ) : redemptions.isError ? (
        <ErrorState
          error={redemptions.error}
          onRetry={() => void redemptions.refetch()}
        />
      ) : !redemptions.data || redemptions.data.length === 0 ? (
        <EmptyState
          title="Aún no has canjeado nada"
          description="Cuando tengas puntos suficientes, pide tu recompensa en caja y aparecerá aquí."
          icon={Gift}
        />
      ) : (
        <div className="space-y-3">
          {redemptions.data.map((redemption) => (
            <Card key={redemption.id}>
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                    <TicketCheck className="size-5" aria-hidden="true" />
                  </span>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">{redemption.reward_name}</h3>
                      <RedemptionStatusBadge status={redemption.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {redemption.points_spent} puntos ·{' '}
                      {formatDateTimeBogota(redemption.created_at)}
                    </p>
                    {redemption.status === 'redeemed' && redemption.delivered_at && (
                      <p className="text-xs text-emerald-700">
                        Entregado el {formatDateTimeBogota(redemption.delivered_at)}
                      </p>
                    )}
                    {redemption.status === 'cancelled' && (
                      <p className="text-xs text-muted-foreground">
                        Anulado
                        {redemption.cancelled_at
                          ? ` el ${formatDateTimeBogota(redemption.cancelled_at)}`
                          : ''}{' '}
                        · puntos devueltos
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-right font-display text-2xl font-extrabold text-muted-foreground sm:min-w-20">
                  −{redemption.points_spent}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
