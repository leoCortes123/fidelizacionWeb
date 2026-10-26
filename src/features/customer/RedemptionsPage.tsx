import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Gift, QrCode, RefreshCw, TicketCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  useMyLoyaltyRedemptions,
  useReissueRedemptionToken,
} from '@/features/loyalty/hooks';
import { useBusinessContext } from '@/features/loyalty/businessContext';
import { errorMessage } from '@/lib/errors';
import { formatDateTimeBogota, formatPoints } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  const { businesses } = useBusinessContext();

  const [qr, setQr] = useState<QrState | null>(null);
  const [reissuingId, setReissuingId] = useState<string | null>(null);
  const [businessFilter, setBusinessFilter] = useState('');
  const [detail, setDetail] = useState<MyLoyaltyRedemption | null>(null);

  const rows = (redemptions.data ?? []).filter(
    (redemption) =>
      !businessFilter || redemption.business_id === businessFilter,
  );

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
        description="Solicitudes de recompensa en todos tus negocios, su estado y el código QR de entrega."
      />

      {businesses.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Filtrar por negocio
          </span>
          <Select
            value={businessFilter || 'all'}
            onValueChange={(value) =>
              setBusinessFilter(value === 'all' ? '' : value)
            }
          >
            <SelectTrigger
              className="w-full sm:w-64"
              aria-label="Filtrar canjes por negocio"
            >
              <SelectValue placeholder="Todos los negocios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los negocios</SelectItem>
              {businesses.map((business) => (
                <SelectItem key={business.id} value={business.id}>
                  {business.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

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
              <Link to="/customer">Ver mis negocios</Link>
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Sin canjes en este negocio"
          description="Prueba con otro negocio o revisa todos tus canjes."
          icon={Gift}
          action={
            <Button
              variant="outline"
              onClick={() => setBusinessFilter('')}
            >
              Ver todos
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {rows.map((redemption) => {
            const pending = redemption.status === 'pending';
            const stored = pending ? readRedemptionToken(redemption.id) : null;

            return (
              <Card key={redemption.id}>
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-secondary text-secondary-foreground">
                      {redemption.business_logo_url ? (
                        <img
                          src={redemption.business_logo_url}
                          alt={`Logo de ${redemption.business_name}`}
                          className="size-full object-cover"
                        />
                      ) : (
                        <TicketCheck className="size-5" aria-hidden="true" />
                      )}
                    </span>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold">{redemption.reward_name}</h3>
                        <RedemptionRequestStatusBadge status={redemption.status} />
                        <Badge variant="outline">
                          <Building2 className="mr-1 size-3" aria-hidden="true" />
                          {redemption.business_name}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatPoints(redemption.points_spent)} ·{' '}
                        {formatDateTimeBogota(redemption.created_at)}
                        {redemption.business_slug
                          ? ` · @${redemption.business_slug}`
                          : ''}
                      </p>

                      {pending && (
                        <p className="text-xs text-amber-800 dark:text-amber-300">
                          Muestra el QR al encargado. Si cierras la pestaña,
                          puedes recuperarlo aquí.
                        </p>
                      )}
                      {redemption.status === 'approved' && (
                        <p className="text-xs text-sky-800 dark:text-sky-300">
                          El encargado ya validó el QR. Acércate a caja para que
                          confirme la entrega.
                        </p>
                      )}
                      {redemption.status === 'delivered' &&
                        redemption.delivered_at && (
                          <p className="text-xs text-emerald-700 dark:text-emerald-300">
                            Entregado el{' '}
                            {formatDateTimeBogota(redemption.delivered_at)}
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
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDetail(redemption)}
                    >
                      Ver detalle
                    </Button>
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

      <Dialog open={detail !== null} onOpenChange={() => setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detail?.reward_name}</DialogTitle>
            <DialogDescription>
              Canje en {detail?.business_name}
              {detail?.business_slug ? ` (@${detail.business_slug})` : ''}.
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Estado</dt>
              <dd>
                <RedemptionRequestStatusBadge status={detail.status} />
              </dd>
              <dt className="text-muted-foreground">Loopoints</dt>
              <dd>{formatPoints(detail.points_spent)}</dd>
              <dt className="text-muted-foreground">Código</dt>
              <dd className="font-mono text-xs">{detail.code}</dd>
              <dt className="text-muted-foreground">Solicitado</dt>
              <dd>{formatDateTimeBogota(detail.created_at)}</dd>
              {detail.approved_at && (
                <>
                  <dt className="text-muted-foreground">Aprobado</dt>
                  <dd>{formatDateTimeBogota(detail.approved_at)}</dd>
                </>
              )}
              {detail.delivered_at && (
                <>
                  <dt className="text-muted-foreground">Entregado</dt>
                  <dd>{formatDateTimeBogota(detail.delivered_at)}</dd>
                </>
              )}
              {detail.cancelled_at && (
                <>
                  <dt className="text-muted-foreground">Cancelado</dt>
                  <dd>{formatDateTimeBogota(detail.cancelled_at)}</dd>
                </>
              )}
            </dl>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetail(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
