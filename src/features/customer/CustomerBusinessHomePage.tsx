import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  Check,
  Gift,
  LockKeyhole,
  ReceiptText,
  Star,
  TicketCheck,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  useCustomerBusinessesSummary,
  useLoyaltyPointAccount,
  useLoyaltyPointTransactions,
  useLoyaltyRewardsAvailable,
  useRequestRedemption,
} from '@/features/loyalty/hooks';
import { useBusinessContext } from '@/features/loyalty/businessContext';
import { useMyPurchasesPage } from '@/features/purchases/hooks';
import { PurchaseDetailDialog } from '@/features/purchases/PurchaseDetailDialog';
import { errorMessage } from '@/lib/errors';
import {
  formatCOP,
  formatDateBogota,
  formatLoopoints,
  formatPoints,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/PageHeader';
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
  LoadingScreen,
  CardSkeleton,
} from '@/components/shared/States';
import { FrequencyBadge } from '@/components/shared/StatusBadge';
import { RedemptionQrDialog } from '@/features/loyalty/RedemptionQrDialog';
import { saveRedemptionToken } from '@/features/loyalty/redemptionTokens';
import type { LoyaltyRewardAvailable, RedemptionRequestResult } from '@/types';

export function CustomerBusinessHomePage() {
  const { businessId = '' } = useParams();
  const { user } = useAuth();
  const { businesses, selectedBusiness, setSelectedBusiness } =
    useBusinessContext();
  const summary = useCustomerBusinessesSummary();
  const customerId = user?.id ?? '';

  const business = businesses.find((item) => item.id === businessId) ?? null;

  // El negocio de la URL manda: sincroniza el contexto para que los hooks
  // existentes (y el selector de la cabecera) apunten al mismo negocio.
  useEffect(() => {
    if (!business) return;
    if (selectedBusiness?.id === business.id) return;
    setSelectedBusiness(business);
  }, [business, selectedBusiness?.id, setSelectedBusiness]);

  const account = useLoyaltyPointAccount(businessId, customerId);
  const transactions = useLoyaltyPointTransactions(businessId, customerId);
  const rewards = useLoyaltyRewardsAvailable(businessId, customerId);
  const purchases = useMyPurchasesPage(businessId, 0, 5);
  const requestRedemption = useRequestRedemption();

  const [redeemDialog, setRedeemDialog] =
    useState<LoyaltyRewardAvailable | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [createdRedemption, setCreatedRedemption] =
    useState<RedemptionRequestResult | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  if (!business) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Negocio no disponible"
          description="No encontramos este negocio entre tus afiliaciones."
        />
        <EmptyState
          title="No participas en este negocio"
          description="Vuelve a tus negocios para elegir uno de tus programas activos."
          icon={Building2}
          action={
            <Button asChild>
              <Link to="/customer">Ver mis negocios</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const summaryRow = summary.data?.find(
    (row) => row.business_id === business.id,
  );

  if (account.isLoading || rewards.isLoading) {
    return <LoadingScreen label="Cargando tu negocio…" />;
  }

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
  const readyRewards = available.filter((reward) => reward.can_redeem).length;

  function requestReward(reward: LoyaltyRewardAvailable) {
    if (!reward.can_redeem) {
      toast.error('No tienes loopoints suficientes para esta recompensa.');
      return;
    }
    setRedeemDialog(reward);
    setIdempotencyKey(
      `redeem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    );
  }

  async function confirmRedemption(event: React.FormEvent) {
    event.preventDefault();
    if (!redeemDialog || !business) return;
    try {
      const result = await requestRedemption.mutateAsync({
        businessId: business.id,
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
      void summary.refetch();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {businesses.length > 1 && (
        <nav
          aria-label="Mis negocios"
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
        >
          {businesses.map((item) => {
            const active = item.id === business.id;
            const logoUrl = summary.data?.find(
              (row) => row.business_id === item.id,
            )?.logo_url;
            return (
              <Link
                key={item.id}
                to={`/customer/business/${item.id}`}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <span
                  className={cn(
                    'grid size-6 place-items-center overflow-hidden rounded-full',
                    active ? 'bg-primary-foreground/20' : 'bg-secondary',
                  )}
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <Building2 className="size-3.5" aria-hidden="true" />
                  )}
                </span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      )}

      <PageHeader
        title={business.name}
        description={`Saldo, recompensas y compras en @${business.slug}.`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/customer/redemptions">
              <TicketCheck aria-hidden="true" />
              Mis canjes
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <FrequencyBadge
          isFrequent={summaryRow?.is_frequent ?? false}
          isActive={summaryRow?.is_frequent_active ?? false}
        />
        {(summaryRow?.pending_redemptions ?? 0) > 0 && (
          <Badge variant="secondary">
            {summaryRow?.pending_redemptions} canje(s) en curso
          </Badge>
        )}
        {summaryRow?.last_purchase_at && (
          <span className="text-xs text-muted-foreground">
            Última compra: {formatDateBogota(summaryRow.last_purchase_at)}
          </span>
        )}
      </div>

      {createdRedemption && !qrOpen && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
          <p>
            Solicitud de <strong>{createdRedemption.reward_name}</strong>{' '}
            creada. Muéstrale el QR al encargado para recibirla.
          </p>
          <div className="flex gap-2">
            {createdRedemption.token && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setQrOpen(true)}
              >
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
          <div
            aria-hidden="true"
            className="absolute -right-10 -top-10 size-40 rounded-full bg-primary/30 blur-2xl"
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-background/60">
                Tus loopoints aquí
              </p>
              <p
                data-testid="points-balance"
                className="mt-1 break-all font-display text-7xl font-extrabold leading-none text-amber-300 sm:text-8xl"
              >
                {balance}
              </p>
              <p className="mt-2 text-sm text-background/70">
                {formatLoopoints(balance)} disponibles
              </p>
            </div>
            <Star
              className="size-12 shrink-0 text-amber-300"
              aria-hidden="true"
            />
          </div>

          <div className="relative grid grid-cols-2 gap-3 border-t border-background/10 pt-4">
            <div>
              <p className="font-display text-2xl font-extrabold">
                {readyRewards}
              </p>
              <p className="text-xs text-background/70">
                recompensas disponibles
              </p>
            </div>
            <div>
              <p className="font-display text-2xl font-extrabold">
                {summaryRow?.pending_redemptions ?? 0}
              </p>
              <p className="text-xs text-background/70">canjes en curso</p>
            </div>
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
                title="Catálogo en preparación"
                description="Todavía no hay recompensas publicadas en este negocio. Vuelve pronto."
                icon={Gift}
                className="border-0 bg-transparent py-8"
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {available.map((reward) => {
                  const progress = Math.min(
                    (balance / reward.points_required) * 100,
                    100,
                  );
                  return (
                    <Card
                      key={reward.id}
                      className={
                        reward.can_redeem
                          ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20'
                          : undefined
                      }
                    >
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-bold leading-tight">
                              {reward.name}
                            </h3>
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
                              <LockKeyhole
                                className="mr-1 size-3"
                                aria-hidden="true"
                              />
                              Faltan {reward.remaining}
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold">
                              {formatPoints(reward.points_required)}
                            </span>
                            <span className="text-muted-foreground">
                              {reward.can_redeem
                                ? 'Puedes solicitarla'
                                : `${Math.floor(progress)}% de avance`}
                            </span>
                          </div>
                          <Progress
                            value={progress}
                            label={`Progreso para ${reward.name}`}
                            className={
                              reward.can_redeem
                                ? '[&>div]:bg-emerald-500'
                                : undefined
                            }
                          />
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
                  );
                })}
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
            ) : transactions.isError ? (
              <ErrorState
                error={transactions.error}
                onRetry={() => void transactions.refetch()}
              />
            ) : !transactions.data || transactions.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin movimientos todavía.
              </p>
            ) : (
              <ul className="space-y-3">
                {transactions.data.slice(0, 10).map((movement) => (
                  <li
                    key={movement.id}
                    className="flex items-center justify-between gap-3 border-b py-2 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {movement.movement_type === 'purchase_credit'
                          ? 'Compra acreditada'
                          : movement.movement_type === 'redemption_debit'
                            ? 'Canje'
                            : movement.movement_type === 'bonus_credit'
                              ? 'Bono'
                              : movement.movement_type === 'expiry_debit'
                                ? 'Loopoints vencidos'
                                : movement.movement_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {movement.reason ?? ''}
                      </p>
                    </div>
                    <p
                      className={cn(
                        'font-mono',
                        movement.points > 0
                          ? 'text-emerald-600'
                          : 'text-destructive',
                      )}
                    >
                      {movement.points > 0 ? '+' : ''}
                      {movement.points}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

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
            <CardSkeleton className="border-0 p-0" />
          ) : purchases.isError ? (
            <ErrorState
              error={purchases.error}
              onRetry={() => void purchases.refetch()}
            />
          ) : !purchases.data || purchases.data.length === 0 ? (
            <EmptyState
              title="Aún no tienes compras aquí"
              description="Pide en caja que generen el QR de tu compra y escanéalo con este teléfono."
              icon={ReceiptText}
              className="border-0 bg-transparent py-6"
            />
          ) : (
            <ul className="divide-y">
              {purchases.data.slice(0, 5).map((purchase) => (
                <li
                  key={purchase.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-semibold">
                      {formatCOP(purchase.amount_cop)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateBogota(purchase.claimed_at ?? purchase.created_at)}
                      {purchase.items_count > 0
                        ? ` · ${purchase.items_count} producto(s)`
                        : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success">
                      +{purchase.points_awarded} pts
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDetailId(purchase.id)}
                    >
                      Ver detalle
                    </Button>
                  </div>
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
              teléfono. Para canjear, solicita la recompensa aquí y muestra el
              QR al encargado.
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={redeemDialog !== null}
        onOpenChange={() => setRedeemDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar recompensa</DialogTitle>
            <DialogDescription>
              Canjear <strong>{redeemDialog?.name}</strong> por{' '}
              <strong>
                {formatPoints(redeemDialog?.points_required ?? 0)}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={confirmRedemption} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Se reservarán los loopoints de {business.name} y se generará un
              código QR para que el encargado valide la entrega.
            </p>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRedeemDialog(null)}
                disabled={requestRedemption.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={requestRedemption.isPending}
                disabled={!redeemDialog?.can_redeem}
              >
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
        businessName={business.name}
      />

      <PurchaseDetailDialog
        open={Boolean(detailId)}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
        purchaseId={detailId}
        mode="customer"
      />
    </div>
  );
}
