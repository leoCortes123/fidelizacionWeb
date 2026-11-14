import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Gift,
  LockKeyhole,
  ReceiptText,
  TicketCheck,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  useCustomerBusinessesSummary,
  useLoyaltyPointAccount,
  useLoyaltyPointTransactions,
  useLoyaltyRewardsAvailable,
  useRequestRedemption,
} from "@/features/loyalty/hooks";
import { useBusinessContext } from "@/features/loyalty/businessContext";
import { useMyPurchasesPage } from "@/features/purchases/hooks";
import { PurchaseDetailDialog } from "@/features/purchases/PurchaseDetailDialog";
import { errorMessage } from "@/lib/errors";
import {
  formatCOP,
  formatDateBogota,
  formatLoopoints,
  formatNumber,
  formatPoints,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
  LoadingScreen,
  CardSkeleton,
} from "@/components/shared/States";
import { FrequencyBadge } from "@/components/shared/StatusBadge";
import { saveRedemptionToken } from "@/features/loyalty/redemptionTokens";
import type { LoyaltyRewardAvailable, RedemptionRequestResult } from "@/types";
import { PixelHeartIcon } from "./PlayerCard";

export function CustomerBusinessHomePage() {
  const { businessId = "" } = useParams();
  const { user } = useAuth();
  const { businesses, selectedBusiness, setSelectedBusiness } = useBusinessContext();
  const summary = useCustomerBusinessesSummary();
  const customerId = user?.id ?? "";

  const business = businesses.find((item) => item.id === businessId) ?? null;

  // El negocio de la URL manda: sincroniza el contexto para que los hooks
  // existentes (y el selector de la cabecera) apunten al mismo negocio.
  useEffect(() => {
    if (!business) return;
    if (selectedBusiness?.id === business.id) return;
    setSelectedBusiness(business);
  }, [business, selectedBusiness?.id, setSelectedBusiness]);

  const activeBusinessId = business?.id ?? "";
  const account = useLoyaltyPointAccount(activeBusinessId, customerId);
  const transactions = useLoyaltyPointTransactions(activeBusinessId, customerId);
  const rewards = useLoyaltyRewardsAvailable(activeBusinessId, customerId);
  const purchases = useMyPurchasesPage(activeBusinessId, 0, 5, Boolean(activeBusinessId));
  const requestRedemption = useRequestRedemption();

  const [redeemDialog, setRedeemDialog] = useState<LoyaltyRewardAvailable | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [createdRedemption, setCreatedRedemption] = useState<RedemptionRequestResult | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  if (!business) {
    return (
      <div className="space-y-4 sm:space-y-5 animate-fade-in">
        <PageHeader
          title="Negocio no disponible"
          description="No encontramos este negocio entre tus afiliaciones."
          className="px-0"
        />
        <EmptyState
          title="No participas en este negocio"
          description="Vuelve a tus negocios para elegir uno de tus programas activos."
          icon={Building2}
          className="retro-card"
          action={
            <Button asChild className="retro-btn retro-btn-dark">
              <Link to="/customer">Ver mis negocios</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const summaryRow = summary.data?.find((row) => row.business_id === business.id);

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
  const closestUpcoming = available
    .filter((reward) => !reward.can_redeem && reward.points_required > 0)
    .sort((a, b) => a.remaining - b.remaining)[0];
  const heroProgressPct =
    readyRewards > 0
      ? 100
      : closestUpcoming
        ? Math.min(99, Math.max(0, Math.floor((balance / closestUpcoming.points_required) * 100)))
        : 0;

  function requestReward(reward: LoyaltyRewardAvailable) {
    if (!reward.can_redeem) {
      toast.error("No tienes loopoints suficientes para esta recompensa.");
      return;
    }
    setRedeemDialog(reward);
    setIdempotencyKey(`redeem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
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
        toast.success("Solicitud enviada. El encargado la revisará y aprobará en caja.");
      } else {
        toast.info("Esta solicitud ya existía. El encargado la revisará en caja.");
      }
      void account.refetch();
      void rewards.refetch();
      void summary.refetch();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/customer"
          className="retro-btn retro-btn-light px-3 py-1.5 text-xs"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Mis negocios
        </Link>
        <Link
          to="/customer/redemptions"
          className="retro-btn retro-btn-light px-3 py-1.5 text-xs"
        >
          <TicketCheck className="size-3.5" aria-hidden="true" />
          Mis canjes
        </Link>
      </div>

      {businesses.length > 1 && (
        <nav
          aria-label="Mis negocios"
          className="flex snap-x gap-2 overflow-x-auto pb-1.5"
        >
          {businesses.map((item) => {
            const active = item.id === business.id;
            const logoUrl = summary.data?.find((row) => row.business_id === item.id)?.logo_url;
            return (
              <Link
                key={item.id}
                to={`/customer/business/${item.id}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-10 shrink-0 snap-start items-center gap-2 border-2 border-[var(--line)] px-3 py-1.5 font-mono text-xs font-bold transition-all",
                  active
                    ? "bg-[var(--ink)] text-[var(--paper)] shadow-[3px_3px_0_var(--red)]"
                    : "bg-[var(--cream)] text-[var(--ink)] hover:bg-[var(--gold)] hover:text-[#1e1c1a] shadow-[2px_2px_0_var(--shadow-ink)]",
                )}
              >
                <span
                  className={cn(
                    "grid size-6 place-items-center overflow-hidden border border-[var(--line)]",
                    active ? "bg-[var(--paper)] text-[var(--ink)]" : "bg-[var(--paper-deep)]",
                  )}
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="" className="size-full object-cover" />
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

      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl">
          {business.name}
        </h1>
        <p className="font-mono text-xs text-[var(--ink-muted)] sm:text-sm">
          Saldo, recompensas y compras en @{business.slug}.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <FrequencyBadge
            isFrequent={summaryRow?.is_frequent ?? false}
            isActive={summaryRow?.is_frequent_active ?? false}
          />
          {(summaryRow?.pending_redemptions ?? 0) > 0 && (
            <span className="border-2 border-[var(--line)] bg-[#ffd166] px-2 py-0.5 font-mono text-xs font-bold text-[#1e1c1a]">
              {summaryRow?.pending_redemptions} canje(s) en curso
            </span>
          )}
          {summaryRow?.last_purchase_at && (
            <span className="font-mono text-xs text-[var(--ink-soft)]">
              Última compra: {formatDateBogota(summaryRow.last_purchase_at)}
            </span>
          )}
        </div>
      </div>

      {createdRedemption && (
        <div className="retro-card retro-card-success flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-[var(--ink)]">
          <p>
            Solicitud de <strong>{createdRedemption.reward_name}</strong> enviada. El encargado la
            revisará y aprobará en caja.
          </p>
          <Link to="/customer/redemptions" className="retro-btn retro-btn-dark text-xs">
            Ver mis canjes
          </Link>
        </div>
      )}

      {/* Player Card del negocio */}
      <section className="pixel-window" aria-label={`Tarjeta de jugador en ${business.name}`}>
        <div className="window-bar">
          <span className="window-title">
            <span className="window-led" aria-hidden="true" />
            PLAYER CARD · {business.name.toUpperCase()}
          </span>
          <span className="window-hearts" aria-hidden="true">
            <PixelHeartIcon />
            <PixelHeartIcon />
            <PixelHeartIcon />
          </span>
        </div>

        <div className="window-body space-y-5">
          <div className="hud-meta">
            <span className="points-label">TUS LOOPOINTS EN {business.name.toUpperCase()}</span>
            <span className={cn("level-pill", readyRewards > 0 && "level-pill-ready")}>
              {summaryRow?.is_frequent ? "NIVEL FRECUENTE" : "JUGADOR ACTIVO"}
            </span>
          </div>

          <div className="points-row">
            <img
              src="/loopoint-coin.png"
              alt=""
              width={44}
              height={44}
              className="points-coin"
              aria-hidden="true"
            />
            <div>
              <p
                data-testid="points-balance"
                className="points"
              >
                {balance}
              </p>
              <p className="mt-1 font-mono text-xs text-[var(--ink-soft)]">
                {formatLoopoints(balance)} disponibles
              </p>
            </div>
          </div>

          {(readyRewards > 0 || closestUpcoming) && (
            <div>
              <div className="progress-caption">
                {readyRewards > 0
                  ? `¡TIENES ${readyRewards} ${readyRewards === 1 ? "RECOMPENSA LISTA" : "RECOMPENSAS LISTAS"}!`
                  : `PRÓXIMO PREMIO: ${closestUpcoming?.name.toUpperCase()}`}
              </div>
              <div className="retro-progress" aria-hidden="true">
                <span style={{ width: `${heroProgressPct}%` }} />
              </div>
              <div className="progress-footer">
                <span>
                  {readyRewards > 0
                    ? "SOLICITA TU PREMIO ABAJO"
                    : `FALTAN ${formatNumber(closestUpcoming?.remaining ?? 0)} PTS`}
                </span>
                <strong>{heroProgressPct}%</strong>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 border-t-2 border-dashed border-[var(--dash-line)] pt-4">
            <div className="border-2 border-[var(--line)] bg-[var(--paper)] p-3">
              <p className="font-pixel text-lg text-[#4e8c57] dark:text-[#34d399]">{readyRewards}</p>
              <p className="mt-1 font-mono text-xs text-[var(--ink-muted)]">recompensas disponibles</p>
            </div>
            <div className="border-2 border-[var(--line)] bg-[var(--paper)] p-3">
              <p className="font-pixel text-lg text-[var(--blue)]">
                {summaryRow?.pending_redemptions ?? 0}
              </p>
              <p className="mt-1 font-mono text-xs text-[var(--ink-muted)]">canjes en curso</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="retro-card p-4 sm:p-5 lg:col-span-2" aria-labelledby="rewards-heading">
          <div className="mb-4 flex items-center gap-2 border-b-2 border-dashed border-[var(--dash-line)] pb-3">
            <Gift className="size-4 text-[var(--red)]" aria-hidden="true" />
            <h2 id="rewards-heading" className="font-display text-lg font-bold text-[var(--ink)]">
              Recompensas disponibles
            </h2>
          </div>

          {available.length === 0 ? (
            <EmptyState
              title="Catálogo en preparación"
              description="Todavía no hay recompensas publicadas en este negocio. Vuelve pronto."
              icon={Gift}
              className="border-0 bg-transparent py-8"
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {available.map((reward) => {
                const progress = Math.min((balance / reward.points_required) * 100, 100);
                return (
                  <article
                    key={reward.id}
                    className={cn(
                      "flex flex-col justify-between gap-3 border-[3px] border-[var(--line)] p-4 shadow-[4px_4px_0_var(--shadow-ink)]",
                      reward.can_redeem ? "bg-[var(--cream-alt)]" : "bg-[var(--paper)]",
                    )}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold leading-tight text-[var(--ink)]">{reward.name}</h3>
                          <p className="mt-1 line-clamp-2 text-xs text-[var(--ink-muted)]">
                            {reward.description}
                          </p>
                        </div>
                        {reward.can_redeem ? (
                          <Badge variant="success" className="shrink-0 border border-[var(--line)]">
                            <Check className="mr-1 size-3" aria-hidden="true" />
                            Disponible
                          </Badge>
                        ) : (
                          <Badge variant="muted" className="shrink-0 border border-[var(--line)]">
                            <LockKeyhole className="mr-1 size-3" aria-hidden="true" />
                            Faltan {reward.remaining}
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between font-mono text-xs">
                          <span className="font-bold text-[var(--ink)]">
                            {formatPoints(reward.points_required)}
                          </span>
                          <span className="text-[var(--ink-soft)]">
                            {reward.can_redeem
                              ? "Puedes solicitarla"
                              : `${Math.floor(progress)}% de avance`}
                          </span>
                        </div>
                        <div className="retro-progress retro-progress-sm" aria-hidden="true">
                          <span style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => requestReward(reward)}
                      disabled={!reward.can_redeem}
                      className={cn(
                        "retro-btn w-full text-xs",
                        reward.can_redeem ? "retro-btn-red" : "retro-btn-light",
                      )}
                    >
                      {reward.can_redeem ? "Solicitar" : "No disponible"}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="retro-card p-4 sm:p-5" aria-labelledby="movements-heading">
          <div className="mb-4 border-b-2 border-dashed border-[var(--dash-line)] pb-3">
            <h2 id="movements-heading" className="font-display text-lg font-bold text-[var(--ink)]">
              Movimientos recientes
            </h2>
          </div>
          {transactions.isLoading ? (
            <ListSkeleton rows={3} />
          ) : transactions.isError ? (
            <ErrorState error={transactions.error} onRetry={() => void transactions.refetch()} />
          ) : !transactions.data || transactions.data.length === 0 ? (
            <p className="font-mono text-xs text-[var(--ink-soft)]">Sin movimientos todavía.</p>
          ) : (
            <ul className="space-y-2.5">
              {transactions.data.slice(0, 10).map((movement) => (
                <li
                  key={movement.id}
                  className="flex items-center justify-between gap-3 border-b-2 border-dashed border-[var(--dash-line)] py-2 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--ink)]">
                      {movement.movement_type === "purchase_credit"
                        ? "Compra acreditada"
                        : movement.movement_type === "redemption_debit"
                          ? "Canje"
                          : movement.movement_type === "bonus_credit"
                            ? "Bono"
                            : movement.movement_type === "expiry_debit"
                              ? "Loopoints vencidos"
                              : movement.movement_type}
                    </p>
                    <p className="truncate font-mono text-xs text-[var(--ink-soft)]">
                      {movement.reason ?? ""}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "shrink-0 font-mono text-sm font-bold",
                      movement.points > 0 ? "text-[#4e8c57] dark:text-[#34d399]" : "text-[var(--red)]",
                    )}
                  >
                    {movement.points > 0 ? "+" : ""}
                    {movement.points}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="retro-card p-4 sm:p-5" aria-labelledby="purchases-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b-2 border-dashed border-[var(--dash-line)] pb-3">
          <h2 id="purchases-heading" className="font-display text-lg font-bold text-[var(--ink)]">
            Compras recientes
          </h2>
          <Link to="/customer/purchases" className="retro-btn retro-btn-light px-3 py-1.5 text-xs">
            Ver historial
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        {purchases.isLoading ? (
          <CardSkeleton className="border-0 p-0" />
        ) : purchases.isError ? (
          <ErrorState error={purchases.error} onRetry={() => void purchases.refetch()} />
        ) : !purchases.data || purchases.data.length === 0 ? (
          <EmptyState
            title="Aún no tienes compras aquí"
            description="Pide en caja que generen el QR de tu compra y escanéalo con este teléfono."
            icon={ReceiptText}
            className="border-0 bg-transparent py-6"
          />
        ) : (
          <ul className="divide-y-2 divide-dashed divide-[var(--dash-line)]">
            {purchases.data.slice(0, 5).map((purchase) => (
              <li
                key={purchase.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-bold text-[var(--ink)]">{formatCOP(purchase.amount_cop)}</p>
                  <p className="font-mono text-xs text-[var(--ink-soft)]">
                    {formatDateBogota(purchase.claimed_at ?? purchase.created_at)}
                    {purchase.items_count > 0 ? ` · ${purchase.items_count} producto(s)` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="border-2 border-[var(--line)] bg-[#34d399] px-2 py-0.5 font-mono text-xs font-bold text-[#1e1c1a]">
                    +{purchase.points_awarded} pts
                  </span>
                  <button
                    type="button"
                    onClick={() => setDetailId(purchase.id)}
                    className="retro-btn retro-btn-light px-3 py-1.5 text-xs"
                  >
                    Ver detalle
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="retro-card retro-card-muted border-dashed p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <span className="grid size-10 shrink-0 place-items-center border-2 border-[var(--line)] bg-[#ffd166] text-[#1e1c1a]">
            <TrendingUp className="size-4" aria-hidden="true" />
          </span>
          <div className="space-y-1 text-sm">
            <p className="font-bold text-[var(--ink)]">¿Cómo sumo más loopoints?</p>
            <p className="text-[var(--ink-muted)]">
              Pide en caja que registren tu compra y escanea el QR con este teléfono. Para canjear,
              solicita la recompensa aquí y el encargado la aprobará en mostrador.
            </p>
          </div>
        </div>
      </div>

      <Dialog open={redeemDialog !== null} onOpenChange={() => setRedeemDialog(null)}>
        <DialogContent className="border-[3px] border-[var(--line)] bg-[var(--cream)] shadow-[6px_6px_0_var(--shadow-ink)]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-[var(--ink)]">
              Solicitar recompensa
            </DialogTitle>
            <DialogDescription className="text-[var(--ink-muted)]">
              Canjear <strong>{redeemDialog?.name}</strong> por{" "}
              <strong>{formatPoints(redeemDialog?.points_required ?? 0)}</strong>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={confirmRedemption} className="space-y-4">
            <p className="text-sm text-[var(--ink-muted)]">
              Se reservarán los loopoints de {business.name} y el encargado podrá aprobar la
              solicitud directamente desde su panel.
            </p>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRedeemDialog(null)}
                disabled={requestRedemption.isPending}
                className="border-2 border-[var(--line)]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={requestRedemption.isPending}
                disabled={!redeemDialog?.can_redeem}
                className="retro-btn retro-btn-red border-2 border-[var(--line)]"
              >
                Confirmar solicitud
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
