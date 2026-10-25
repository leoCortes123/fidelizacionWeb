import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Gift, Building2, TicketCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  useLoyaltyPointAccount,
  useLoyaltyPointTransactions,
  useLoyaltyRewardsAvailable,
  useRequestRedemption,
  useBusinesses,
} from '@/features/loyalty/hooks';
import { useBusinessContext } from '@/features/loyalty/businessContext';
import { errorMessage } from '@/lib/errors';
import { formatPoints } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState, ListSkeleton, LoadingScreen } from '@/components/shared/States';
import { RedemptionQrDialog } from '@/features/loyalty/RedemptionQrDialog';
import { saveRedemptionToken } from '@/features/loyalty/redemptionTokens';
import type { LoyaltyRewardAvailable, RedemptionRequestResult } from '@/types';

export function BusinessBalancePage() {
  const { user } = useAuth();
  const businesses = useBusinesses();
  const { selectedBusiness, setSelectedBusiness } = useBusinessContext();
  const navigate = useNavigate();
  const customerId = user?.id ?? '';

  const account = useLoyaltyPointAccount(selectedBusiness?.id ?? '', customerId);
  const transactions = useLoyaltyPointTransactions(selectedBusiness?.id ?? '', customerId);
  const rewards = useLoyaltyRewardsAvailable(selectedBusiness?.id ?? '', customerId);
  const requestRedemption = useRequestRedemption();

  const [redeemDialog, setRedeemDialog] = useState<LoyaltyRewardAvailable | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [createdRedemption, setCreatedRedemption] =
    useState<RedemptionRequestResult | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

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
          description="Elige el negocio para ver tus puntos y recompensas."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((business) => (
            <Card key={business.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Building2 className="mx-auto size-12 text-primary mb-3" aria-hidden="true" />
                <h3 className="font-semibold">{business.name}</h3>
                <p className="text-xs text-muted-foreground">{business.slug}</p>
                <Button
                  key={business.id}
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedBusiness(business);
                    navigate(`/customer/balance`);
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
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Sin negocios" description="No tienes negocios asignados." />
        <EmptyState title="Sin negocios" description="No participas en ningún programa de fidelización." icon={Building2} />
      </div>
    );
  }

  if (account.isLoading || rewards.isLoading) return <LoadingScreen label="Cargando…" />;
  if (account.isError || rewards.isError) {
    return (
      <ErrorState
        error={account.error ?? rewards.error}
        onRetry={() => {
          void account.refetch();
          void rewards.refetch();
        }}
      />
    );
  }

  const balance = account.data?.balance ?? 0;
  const available = rewards.data ?? [];

  function requestReward(reward: LoyaltyRewardAvailable) {
    if (!reward.can_redeem) {
      toast.error('No tienes puntos suficientes para esta recompensa.');
      return;
    }
    setRedeemDialog(reward);
    setIdempotencyKey(`redeem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
  }

  async function confirmRedemption(event: React.FormEvent) {
    event.preventDefault();
    if (!redeemDialog) return;
    try {
      const result = await requestRedemption.mutateAsync({
        businessId: current.id,
        rewardId: redeemDialog.id,
        idempotencyKey: idempotencyKey || crypto.randomUUID(),
      });
      setRedeemDialog(null);
      setCreatedRedemption(result);
      if (result.token) {
        saveRedemptionToken(result.redemption_id, {
          token: result.token,
          expires_at: result.expires_at,
          code: result.code,
        });
        setQrOpen(true);
        toast.success('Solicitud creada. Muestra el QR al encargado.');
      } else {
        toast.info(
          'Esta solicitud ya existía. Recupera el QR desde “Mis canjes”.',
        );
      }
      void account.refetch();
      void rewards.refetch();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Tus puntos — ${current.name}`}
        description={`Saldo y recompensas disponibles en ${current.name}.`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/customer/redemptions">
              <TicketCheck aria-hidden="true" />
              Mis canjes
            </Link>
          </Button>
        }
      />

      {createdRedemption && !qrOpen && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p>
            Solicitud de <strong>{createdRedemption.reward_name}</strong> creada.
            Muéstrale el QR al encargado para recibirla.
          </p>
          <div className="flex gap-2">
            {createdRedemption.token && (
              <Button size="sm" variant="outline" onClick={() => setQrOpen(true)}>
                Ver QR
              </Button>
            )}
            <Button size="sm" asChild>
              <Link to="/customer/redemptions">Ver mis canjes</Link>
            </Button>
          </div>
        </div>
      )}

      <Card className="overflow-hidden border-0 bg-foreground text-background shadow-lg">
        <CardContent className="relative space-y-6 p-6 sm:p-8">
          <div className="absolute -right-10 -top-10 size-40 rounded-full bg-primary/30 blur-2xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-background/60">
                Tu saldo
              </p>
              <p className="mt-1 break-all font-display text-7xl font-extrabold leading-none text-amber-300 sm:text-8xl">
                {balance}
              </p>
              <p className="mt-2 text-sm text-background/70">
                {formatPoints(balance)} disponibles
              </p>
            </div>
            <Star className="grid size-12 shrink-0 place-items-center rounded-2xl bg-background/10 text-2xl" aria-hidden="true" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="size-4 text-muted-foreground" aria-hidden="true" />
              Recompensas disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            {available.length === 0 ? (
              <EmptyState
                title="Sin recompensas disponibles"
                description="No hay recompensas activas o no tienes puntos suficientes."
                icon={Gift}
                className="border-0 bg-transparent py-8"
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {available.map((reward) => (
                  <Card key={reward.id} className={`border ${reward.can_redeem ? 'border-emerald-300 bg-emerald-50/50' : ''}`}>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold leading-tight">{reward.name}</h3>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {reward.description}
                          </p>
                        </div>
                        <Badge
                          variant={reward.can_redeem ? 'success' : 'muted'}
                        >
                          {reward.can_redeem ? 'Disponible' : `Faltan ${reward.remaining}`}
                        </Badge>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold">
                            {formatPoints(reward.points_required)}
                          </span>
                          <span className="text-muted-foreground">
                            {reward.can_redeem ? 'Puedes solicitarla' : 'Puntos insuficientes'}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => requestReward(reward)}
                        disabled={!reward.can_redeem}
                        className="w-full"
                      >
                        {reward.can_redeem ? 'Solicitar' : 'No disponible'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Movimientos recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.isLoading ? (
              <ListSkeleton rows={3} />
            ) : !transactions.data || transactions.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin movimientos todavía.</p>
            ) : (
              <ul className="space-y-3">
                {transactions.data.slice(0, 10).map((movement) => (
                  <li key={movement.id} className="flex items-center justify-between gap-3 py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-semibold">
                        {movement.movement_type === 'purchase_credit'
                          ? 'Compra acreditada'
                          : movement.movement_type === 'redemption_debit'
                          ? 'Canje'
                          : movement.movement_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {movement.reason ?? ''}
                      </p>
                    </div>
                    <p className={`font-mono ${movement.points > 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                      {movement.points > 0 ? '+' : ''}{movement.points}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={redeemDialog !== null} onOpenChange={() => setRedeemDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar redención</DialogTitle>
            <DialogDescription>
              Canjear <strong>{redeemDialog?.name}</strong> por{' '}
              <strong>{formatPoints(redeemDialog?.points_required ?? 0)}</strong>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={confirmRedemption} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Se reservarán los puntos y se generará un código QR para que el
              encargado valide la entrega.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRedeemDialog(null)} disabled={requestRedemption.isPending}>
                Cancelar
              </Button>
              <Button type="submit" loading={requestRedemption.isPending} disabled={!redeemDialog?.can_redeem}>
                Confirmar solicitud
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <RedemptionQrDialog
        open={qrOpen && createdRedemption !== null}
        onOpenChange={setQrOpen}
        rewardName={createdRedemption?.reward_name ?? ''}
        code={createdRedemption?.code ?? ''}
        token={createdRedemption?.token ?? null}
        expiresAt={createdRedemption?.expires_at ?? null}
        businessName={current.name}
      />
    </div>
  );
}
