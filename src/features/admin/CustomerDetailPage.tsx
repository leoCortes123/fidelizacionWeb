import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Gift,
  Mail,
  ReceiptText,
  Sparkles,
  TicketCheck,
  TrendingUp,
  Undo2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useAdminCancelRedemption,
  useAdminCustomer,
  useAdminRedeemReward,
  useAdminRewards,
} from './hooks';
import { errorMessage } from '@/lib/errors';
import {
  formatCOP,
  formatDateTimeBogota,
  formatPoints,
} from '@/lib/format';
import type {
  AdminReward,
  CustomerRedemption,
  PointsMovementType,
} from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { RedemptionStatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState, ErrorState, LoadingScreen } from '@/components/shared/States';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

const movementLabels: Record<PointsMovementType, string> = {
  purchase_credit: 'Compra acreditada',
  redemption_debit: 'Canje',
  redemption_refund: 'Devolución de canje',
  expiry_debit: 'Vencimiento de loopoints',
  admin_adjustment: 'Ajuste administrativo',
};

function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `redeem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function CustomerDetailPage() {
  const { id } = useParams();
  const customer = useAdminCustomer(id);
  const rewards = useAdminRewards();
  const redeem = useAdminRedeemReward();
  const cancelRedemption = useAdminCancelRedemption();

  const [selectedRewardId, setSelectedRewardId] = useState('');
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [note, setNote] = useState('');
  const [cancelTarget, setCancelTarget] = useState<CustomerRedemption | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  if (customer.isLoading) return <LoadingScreen label="Cargando cliente…" />;
  if (customer.isError || !customer.data) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/customers">
            <ArrowLeft aria-hidden="true" />
            Volver a clientes
          </Link>
        </Button>
        <ErrorState
          error={customer.error ?? new Error('Cliente no encontrado')}
          onRetry={() => void customer.refetch()}
        />
      </div>
    );
  }

  const data = customer.data;
  const balance = data.points_balance;
  const activeRewards: AdminReward[] = (rewards.data ?? []).filter(
    (reward) => reward.is_active,
  );
  const selectedReward = activeRewards.find(
    (reward) => reward.id === selectedRewardId,
  );
  const canRedeem = Boolean(selectedReward && balance >= selectedReward.points_cost);

  function openRedeemDialog() {
    if (!selectedReward) {
      toast.error('Selecciona una recompensa.');
      return;
    }
    if (balance < selectedReward.points_cost) {
      toast.error('El cliente no tiene loopoints suficientes para esta recompensa.');
      return;
    }
    setIdempotencyKey(newIdempotencyKey());
    setNote('');
    setRedeemOpen(true);
  }

  async function confirmRedeem() {
    if (!selectedReward) return;
    try {
      const result = await redeem.mutateAsync({
        customerId: data.profile.id,
        rewardId: selectedReward.id,
        idempotencyKey,
        reason: note,
      });
      toast.success(
        `${result.reward_name}: −${result.points_spent} loopoints. Saldo: ${result.balance}.`,
      );
      setRedeemOpen(false);
      setSelectedRewardId('');
      setNote('');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  function askCancel(redemption: CustomerRedemption) {
    setCancelTarget(redemption);
    setCancelReason('');
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    if (cancelReason.trim().length < 3) {
      toast.error('Escribe un motivo de al menos 3 caracteres.');
      return;
    }
    try {
      const result = await cancelRedemption.mutateAsync({
        redemptionId: cancelTarget.id,
        reason: cancelReason.trim(),
      });
      toast.success(
        `Canje anulado. Se devolvieron ${result.points_refunded} loopoints.`,
      );
      setCancelTarget(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/admin/customers">
          <ArrowLeft aria-hidden="true" />
          Volver a clientes
        </Link>
      </Button>

      <PageHeader
        title={data.profile.full_name || 'Cliente sin nombre'}
        description={`Registrado el ${formatDateTimeBogota(data.profile.created_at)}`}
      />

      <Card className="border-0 bg-foreground text-background shadow-lg">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-background/60">
              Saldo disponible
            </p>
            <p
              data-testid="customer-points-balance"
              className="mt-1 font-display text-6xl font-extrabold leading-none text-amber-300"
            >
              {balance}
            </p>
            <p className="mt-2 text-sm text-background/70">
              {formatPoints(balance)}
            </p>
          </div>
          <div className="space-y-1 text-sm text-background/80 sm:text-right">
            <p className="flex items-center gap-1.5 break-all sm:justify-end">
              <Mail className="size-3.5 shrink-0" aria-hidden="true" />
              {data.profile.email}
            </p>
            <p>
              {data.purchase_count} compras · {formatCOP(data.total_spent)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="size-4 text-primary" aria-hidden="true" />
            Canjear recompensa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rewards.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando catálogo…</p>
          ) : rewards.isError ? (
            <ErrorState
              error={rewards.error}
              onRetry={() => void rewards.refetch()}
            />
          ) : activeRewards.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay recompensas activas en el catálogo.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="reward-select">Recompensa</Label>
                <Select
                  value={selectedRewardId}
                  onValueChange={setSelectedRewardId}
                >
                  <SelectTrigger id="reward-select" className="h-12">
                    <SelectValue placeholder="Selecciona una recompensa" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeRewards.map((reward) => (
                      <SelectItem
                        key={reward.id}
                        value={reward.id}
                        disabled={reward.points_cost > balance}
                      >
                        {reward.name} · {reward.points_cost} pts
                        {reward.points_cost > balance ? ' (faltan loopoints)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedReward && (
                <div className="rounded-lg bg-muted p-4 text-sm">
                  <div className="flex justify-between gap-2">
                    <span>Saldo actual</span>
                    <span className="font-semibold">{formatPoints(balance)}</span>
                  </div>
                  <div className="mt-1 flex justify-between gap-2">
                    <span>Costo de la recompensa</span>
                    <span className="font-semibold">
                      −{formatPoints(selectedReward.points_cost)}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between gap-2 border-t pt-2 font-semibold">
                    <span>Saldo después</span>
                    <span
                      className={
                        canRedeem ? 'text-emerald-700' : 'text-destructive'
                      }
                    >
                      {formatPoints(
                        Math.max(0, balance - selectedReward.points_cost),
                      )}
                    </span>
                  </div>
                </div>
              )}

              <Button
                size="lg"
                className="w-full"
                onClick={openRedeemDialog}
                disabled={!canRedeem}
              >
                <Sparkles aria-hidden="true" />
                Aplicar canje
              </Button>
              <p className="text-xs text-muted-foreground">
                El descuento se aplica de inmediato y queda registrado en el
                historial del cliente y en la auditoría.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ReceiptText className="size-4 text-muted-foreground" aria-hidden="true" />
              Compras
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.purchases.length === 0 ? (
              <EmptyState
                title="Sin compras"
                description="Este cliente aún no ha reclamado compras."
                icon={ReceiptText}
                className="border-0 bg-transparent py-6"
              />
            ) : (
              <ul className="divide-y">
                {data.purchases.map((purchase) => (
                  <li
                    key={purchase.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="font-semibold">{formatCOP(purchase.amount_cop)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTimeBogota(purchase.claimed_at)}
                      </p>
                    </div>
                    <Badge variant="success">+{purchase.points_awarded} pts</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-muted-foreground" aria-hidden="true" />
              Movimientos de loopoints
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.movements.length === 0 ? (
              <EmptyState
                title="Sin movimientos"
                description="Aún no hay créditos ni débitos."
                icon={TrendingUp}
                className="border-0 bg-transparent py-6"
              />
            ) : (
              <ul className="divide-y">
                {data.movements.map((movement) => (
                  <li
                    key={movement.id}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {movementLabels[movement.movement_type] ??
                          movement.movement_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTimeBogota(movement.created_at)}
                      </p>
                    </div>
                    <span
                      className={
                        movement.points >= 0
                          ? 'shrink-0 text-sm font-bold text-emerald-700'
                          : 'shrink-0 text-sm font-bold text-destructive'
                      }
                    >
                      {movement.points > 0 ? '+' : ''}
                      {movement.points}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TicketCheck className="size-4 text-muted-foreground" aria-hidden="true" />
            Canjes del cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.redemptions.length === 0 ? (
            <EmptyState
              title="Sin canjes"
              description="Cuando apliques una recompensa aparecerá aquí."
              icon={TicketCheck}
              className="border-0 bg-transparent py-6"
            />
          ) : (
            <ul className="divide-y">
              {data.redemptions.map((redemption) => (
                <li
                  key={redemption.id}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{redemption.reward_name}</p>
                      <RedemptionStatusBadge status={redemption.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTimeBogota(redemption.created_at)} · −
                      {redemption.points_spent} loopoints
                      {redemption.cancelled_at
                        ? ` · anulado ${formatDateTimeBogota(
                            redemption.cancelled_at,
                          )}`
                        : ''}
                    </p>
                  </div>
                  {redemption.status !== 'cancelled' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="self-start sm:self-auto"
                      onClick={() => askCancel(redemption)}
                    >
                      <Undo2 aria-hidden="true" />
                      Anular y devolver
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={redeemOpen} onOpenChange={setRedeemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Canjear {selectedReward?.name}</DialogTitle>
            <DialogDescription>
              Se descontarán {selectedReward?.points_cost ?? 0} loopoints a{' '}
              {data.profile.full_name || data.profile.email}. La recompensa queda
              entregada de inmediato.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-sm">
              <div className="flex justify-between">
                <span>Saldo actual</span>
                <span className="font-semibold">{formatPoints(balance)}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span>Costo</span>
                <span className="font-semibold">
                  −{formatPoints(selectedReward?.points_cost ?? 0)}
                </span>
              </div>
              <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
                <span>Saldo después</span>
                <span>
                  {formatPoints(
                    Math.max(0, balance - (selectedReward?.points_cost ?? 0)),
                  )}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="redeem-note">Nota (opcional)</Label>
              <Textarea
                id="redeem-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Ej.: recompensa entregada en mostrador"
                maxLength={300}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRedeemOpen(false)}
              disabled={redeem.isPending}
            >
              Cancelar
            </Button>
            <Button onClick={confirmRedeem} loading={redeem.isPending}>
              Confirmar canje
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
        title="Anular canje"
        description={
          cancelTarget
            ? `Se devolverán ${cancelTarget.points_spent} loopoints y el canje de ${cancelTarget.reward_name} quedará cancelado.`
            : undefined
        }
        confirmLabel="Anular y devolver"
        destructive
        loading={cancelRedemption.isPending}
        onConfirm={confirmCancel}
      >
        <div className="space-y-2">
          <Label htmlFor="cancel-redemption-reason">Motivo</Label>
          <Textarea
            id="cancel-redemption-reason"
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            placeholder="Ej.: se aplicó a la persona equivocada"
            maxLength={300}
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
