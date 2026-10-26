import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gift, QrCode, RefreshCw, TicketCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  useMyLoyaltyRedemptions,
  useReissueRedemptionToken,
} from '@/features/loyalty/hooks';
import { errorMessage } from '@/lib/errors';
import { formatDateTimeBogota, formatPoints } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/shared/States';
import { RedemptionRequestStatusBadge } from '@/components/shared/StatusBadge';
import { RedemptionQrDialog } from '@/features/loyalty/RedemptionQrDialog';
import {
  readRedemptionToken,
  saveRedemptionToken,
  type StoredRedemptionToken,
} from '@/features/loyalty/redemptionTokens';
import type { MyLoyaltyRedemption } from '@/types';

interface QrState extends StoredRedemptionToken {
  redemption: MyLoyaltyRedemption;
}

export function RedemptionsPage() {
  const redemptions = useMyLoyaltyRedemptions();
  const reissue = useReissueRedemptionToken();

  const [qr, setQr] = useState<QrState | null>(null);
  const [reissuingId, setReissuingId] = useState<string | null>(null);

  function openStoredQr(redemption: MyLoyaltyRedemption) {
    const stored = readRedemptionToken(redemption.id);
    if (!stored) {
      toast.error('No encontramos el QR en este dispositivo. Reemítelo.');
      return;
    }
    setQr({ ...stored, redemption });
  }

  async function reissueQr(redemption: MyLoyaltyRedemption) {
    setReissuingId(redemption.id);
    try {
      const result = await reissue.mutateAsync({ redemptionId: redemption.id });
      const stored: StoredRedemptionToken = {
        token: result.token,
        expires_at: result.expires_at,
        code: redemption.code,
      };
      saveRedemptionToken(redemption.id, stored);
      setQr({ ...stored, redemption });
      toast.success('QR reemitido. El anterior dejó de ser válido.');
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setReissuingId(null);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Mis canjes"
        description="Solicitudes de recompensa, su estado y el código QR de entrega."
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
          title="Aún no has solicitado recompensas"
          description="Cuando tengas loopoints suficientes, solicita una recompensa y aquí verás su QR."
          icon={Gift}
          action={
            <Button variant="outline" asChild>
              <Link to="/customer/balance">Ver recompensas</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {redemptions.data.map((redemption) => {
            const pending = redemption.status === 'pending';
            const stored = pending ? readRedemptionToken(redemption.id) : null;

            return (
              <Card key={redemption.id}>
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                      <TicketCheck className="size-5" aria-hidden="true" />
                    </span>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold">{redemption.reward_name}</h3>
                        <RedemptionRequestStatusBadge status={redemption.status} />
                        <Badge variant="outline">{redemption.business_name}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatPoints(redemption.points_spent)} ·{' '}
                        {formatDateTimeBogota(redemption.created_at)}
                      </p>

                      {pending && (
                        <p className="text-xs text-amber-800">
                          Muestra el QR al encargado. Si cierras la pestaña, puedes
                          recuperarlo aquí.
                        </p>
                      )}
                      {redemption.status === 'approved' && (
                        <p className="text-xs text-sky-800">
                          El encargado ya validó el QR. Acércate a caja para que
                          confirme la entrega.
                        </p>
                      )}
                      {redemption.status === 'delivered' && redemption.delivered_at && (
                        <p className="text-xs text-emerald-700">
                          Entregado el {formatDateTimeBogota(redemption.delivered_at)}
                        </p>
                      )}
                      {(redemption.status === 'cancelled' ||
                        redemption.status === 'expired') && (
                        <p className="text-xs text-muted-foreground">
                          {redemption.cancelled_at
                            ? `Cancelado el ${formatDateTimeBogota(redemption.cancelled_at)} · loopoints devueltos`
                            : 'Sin canje efectivo · loopoints devueltos'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <p className="mr-auto font-display text-2xl font-extrabold text-muted-foreground sm:mr-2">
                      −{redemption.points_spent}
                    </p>
                    {pending && stored && (
                      <Button size="sm" onClick={() => openStoredQr(redemption)}>
                        <QrCode aria-hidden="true" />
                        Ver QR
                      </Button>
                    )}
                    {pending && !stored && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void reissueQr(redemption)}
                        loading={reissuingId === redemption.id}
                      >
                        <RefreshCw aria-hidden="true" />
                        Recuperar QR
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        El QR contiene solo un token aleatorio, nunca datos personales. Al aprobar
        la entrega queda inválido y los loopoints se descuentan de tu saldo.
      </p>

      <RedemptionQrDialog
        open={qr !== null}
        onOpenChange={(open) => {
          if (!open) setQr(null);
        }}
        rewardName={qr?.redemption.reward_name ?? ''}
        code={qr?.redemption.code ?? ''}
        token={qr?.token ?? null}
        expiresAt={qr?.expires_at || null}
        businessName={qr?.redemption.business_name}
        onReissue={
          qr && qr.redemption.status === 'pending'
            ? () => void reissueQr(qr.redemption)
            : undefined
        }
        reissuing={qr ? reissuingId === qr.redemption.id : false}
      />
    </div>
  );
}
