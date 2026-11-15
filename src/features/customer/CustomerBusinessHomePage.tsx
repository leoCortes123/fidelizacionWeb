import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Building2, Gift, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  useBusinessPublic,
  useCustomerBusinessesSummary,
  useLoyaltyPointAccount,
  useLoyaltyPointTransactions,
  useLoyaltyProgram,
  useLoyaltyRewardsAvailable,
  useProducts,
  useRequestRedemption,
} from "@/features/loyalty/hooks";
import { useBusinessContext } from "@/features/loyalty/businessContext";
import { useMyPurchasesPage } from "@/features/purchases/hooks";
import { PurchaseDetailDialog } from "@/features/purchases/PurchaseDetailDialog";
import { errorMessage } from "@/lib/errors";
import { formatCOP, formatDateBogota, formatPoints } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState, ErrorState, ListSkeleton, LoadingScreen } from "@/components/shared/States";
import { saveRedemptionToken } from "@/features/loyalty/redemptionTokens";
import type { LoyaltyRewardAvailable, Product, RedemptionRequestResult } from "@/types";
import {
  getBusinessStageVisual,
  getProductVisual,
  getRewardVisual,
  HeroCoinSvg,
  PixelItemSvg,
} from "./pixelSprites";

type StoreTabId = "tabRewards" | "tabMenu" | "tabActivity";

export function CustomerBusinessHomePage() {
  const { businessId = "" } = useParams();
  const { user } = useAuth();
  const { businesses, selectedBusiness, setSelectedBusiness } = useBusinessContext();
  const summary = useCustomerBusinessesSummary();
  const customerId = user?.id ?? "";

  const business = businesses.find((item) => item.id === businessId) ?? null;

  useEffect(() => {
    if (!business) return;
    if (selectedBusiness?.id === business.id) return;
    setSelectedBusiness(business);
  }, [business, selectedBusiness?.id, setSelectedBusiness]);

  const activeBusinessId = business?.id ?? "";
  const publicBiz = useBusinessPublic(business?.slug ?? "");
  const account = useLoyaltyPointAccount(activeBusinessId, customerId);
  const transactions = useLoyaltyPointTransactions(activeBusinessId, customerId);
  const rewards = useLoyaltyRewardsAvailable(activeBusinessId, customerId);
  const products = useProducts(activeBusinessId, true);
  const program = useLoyaltyProgram(activeBusinessId);
  const purchases = useMyPurchasesPage(activeBusinessId, 0, 5, Boolean(activeBusinessId));
  const requestRedemption = useRequestRedemption();

  const [activeTab, setActiveTab] = useState<StoreTabId>("tabRewards");
  const [redeemDialog, setRedeemDialog] = useState<{
    reward: LoyaltyRewardAvailable;
    index: number;
  } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<{
    product: Product;
    points: number;
    index: number;
  } | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [createdRedemption, setCreatedRedemption] = useState<RedemptionRequestResult | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (redeemDialog) setRedeemDialog(null);
        if (selectedProduct) setSelectedProduct(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [redeemDialog, selectedProduct]);

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
          className="pixel-box"
          action={
            <Button asChild className="pixel-btn pixel-btn-dark">
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
  const activeProducts = products.data ?? [];

  const stageVisual = getBusinessStageVisual(business.name, business.slug, 0);
  const categoryBadge = summaryRow?.is_frequent_active
    ? "FRECUENTE ACTIVO"
    : summaryRow?.is_frequent
      ? "FRECUENTE"
      : stageVisual.category;

  const logoUrl = summaryRow?.logo_url ?? publicBiz.data?.logo_url ?? null;
  const defaultBio = `Saldo, recompensas, carta y compras en @${business.slug}.`;
  const bizDescription = publicBiz.data?.description?.trim() || defaultBio;

  function computeProductPoints(priceCop: number): number {
    const copPerUnit = program.data?.cop_per_point_unit ?? 1000;
    if (copPerUnit <= 0) return 0;
    return Math.min(1_000_000, Math.max(0, Math.floor(priceCop / copPerUnit)));
  }

  function openRewardModal(reward: LoyaltyRewardAvailable, index: number) {
    setRedeemDialog({ reward, index });
    setIdempotencyKey(`redeem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
  }

  function requestReward(reward: LoyaltyRewardAvailable, index: number) {
    if (!reward.can_redeem) {
      toast.error("No tienes loopoints suficientes para esta recompensa.");
      return;
    }
    openRewardModal(reward, index);
  }

  async function confirmRedemption(event: React.FormEvent) {
    event.preventDefault();
    if (!redeemDialog || !business) return;
    if (!redeemDialog.reward.can_redeem) {
      setRedeemDialog(null);
      return;
    }
    try {
      const result = await requestRedemption.mutateAsync({
        businessId: business.id,
        rewardId: redeemDialog.reward.id,
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

  const rewardModalVisual = redeemDialog
    ? getRewardVisual(redeemDialog.reward.name, redeemDialog.index)
    : null;
  const productModalVisual = selectedProduct
    ? getProductVisual(selectedProduct.product.name, selectedProduct.index)
    : null;

  return (
    <>
      <section
        className="view-section active"
        id="viewStoreProfile"
        aria-label="Detalle del negocio"
      >
        <div className="store-topbar-nav">
          <Link to="/customer" className="pixel-btn pixel-btn-secondary" id="btnBackToSelector">
            <span>◀ VOLVER</span>
          </Link>
        </div>

        {createdRedemption && (
          <div className="pixel-box mb-2 flex flex-wrap items-center justify-between gap-2 bg-[var(--paper-deep)] p-2.5 text-xs text-[var(--ink)]">
            <p>
              Solicitud de <strong>{createdRedemption.reward_name}</strong> enviada. El encargado la
              revisará y aprobará en caja.
            </p>
            <Link
              to="/customer/redemptions"
              className="pixel-btn pixel-btn-dark py-1.5 text-[11px]"
            >
              Ver mis canjes
            </Link>
          </div>
        )}

        {/* Panel superior que replica la tarjeta del negocio */}
        <article className="pixel-box store-replicated-card" id="profileHeroBanner">
          <div
            className="card-hero-stage store-hero-stage"
            id="profileHeroStage"
            style={{ background: stageVisual.stageBg }}
          >
            {/* Arriba a la izquierda: Total de puntos */}
            <div className="hero-points-top-left">
              <HeroCoinSvg size={15} />
              <span
                data-testid="points-balance"
                className="hero-points-value"
                id="profilePointsNumber"
              >
                {balance}
              </span>
              <span className="hero-points-label">PTS</span>
            </div>

            {/* Arriba a la derecha: Letrero con el tipo de negocio */}
            <span className="hero-category-top-right" id="profileCategoryBadge">
              {categoryBadge}
            </span>

            {/* Ilustración central del negocio */}
            <div className="sprite-bobbing" id="profileSpriteBox">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`Logo de ${business.name}`}
                  className="size-16 border-[3px] border-[#1e1c1a] bg-[#fffdf5] object-cover"
                />
              ) : (
                <PixelItemSvg sprite={stageVisual.spriteKey} size={80} />
              )}
            </div>

            {/* Abajo a la izquierda: Nombre del negocio */}
            <div className="hero-name-bottom-left">
              <h1 className="card-biz-title" id="profileStoreName">
                {business.name}
              </h1>
            </div>
          </div>

          <div className="store-card-desc-panel">
            <p className="card-biz-description" id="profileStoreBio">
              {bizDescription}
            </p>
          </div>
        </article>

        {/* Pestañas en una sola línea: RECOMPENSAS | CARTA | MOVIMIENTOS */}
        <div className="pixel-box store-body-box">
          <div className="store-tabs-bar" role="tablist" aria-label="Secciones del negocio">
            <button
              type="button"
              id="store-tab-rewards"
              role="tab"
              aria-selected={activeTab === "tabRewards"}
              aria-controls="tabRewards"
              className={cn("store-tab-btn", activeTab === "tabRewards" && "active")}
              onClick={() => setActiveTab("tabRewards")}
            >
              RECOMPENSAS
            </button>
            <button
              type="button"
              id="store-tab-menu"
              role="tab"
              aria-selected={activeTab === "tabMenu"}
              aria-controls="tabMenu"
              className={cn("store-tab-btn", activeTab === "tabMenu" && "active")}
              onClick={() => setActiveTab("tabMenu")}
            >
              CARTA
            </button>
            <button
              type="button"
              id="store-tab-activity"
              role="tab"
              aria-selected={activeTab === "tabActivity"}
              aria-controls="tabActivity"
              className={cn("store-tab-btn", activeTab === "tabActivity" && "active")}
              onClick={() => setActiveTab("tabActivity")}
            >
              MOVIMIENTOS
            </button>
          </div>

          {/* Panel 1: Recompensas con imagen y detalle al seleccionar */}
          <div
            className={cn("store-tab-panel", activeTab === "tabRewards" && "active")}
            id="tabRewards"
            role="tabpanel"
            aria-labelledby="store-tab-rewards"
          >
            {available.length === 0 ? (
              <EmptyState
                title="Catálogo en preparación"
                description="Todavía no hay recompensas publicadas en este negocio. Vuelve pronto."
                icon={Gift}
                className="border-0 bg-transparent py-6"
              />
            ) : (
              <div className="items-grid" id="profileRewardsGrid">
                {available.map((reward, idx) => {
                  const visual = getRewardVisual(reward.name, idx);
                  return (
                    <article
                      key={reward.id}
                      className="item-pixel-card"
                      tabIndex={0}
                      onClick={() => openRewardModal(reward, idx)}
                      onKeyDown={(event) => {
                        if (
                          event.target === event.currentTarget &&
                          (event.key === "Enter" || event.key === " ")
                        ) {
                          event.preventDefault();
                          openRewardModal(reward, idx);
                        }
                      }}
                    >
                      <div className="item-card-image" style={{ background: visual.bg }}>
                        <PixelItemSvg sprite={visual.spriteKey} size={56} />
                      </div>
                      <div className="item-card-body">
                        <div>
                          <h3 className="item-card-title">{reward.name}</h3>
                          <p className="item-card-sub" style={{ marginTop: 4 }}>
                            {reward.description}
                          </p>
                        </div>
                        <div className="item-card-footer">
                          <span className="item-badge-highlight">{reward.points_required} PTS</span>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: reward.can_redeem ? "var(--green)" : "var(--text-muted)",
                            }}
                          >
                            {reward.can_redeem ? "Disponible" : "Bloqueado"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            requestReward(reward, idx);
                          }}
                          disabled={!reward.can_redeem}
                          className={cn(
                            "pixel-btn mt-1 w-full py-1.5 text-[11px]",
                            reward.can_redeem ? "pixel-btn-xp" : "pixel-btn-secondary",
                          )}
                        >
                          {reward.can_redeem ? "Solicitar" : "No disponible"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panel 2: Carta con imagen y detalle al seleccionar */}
          <div
            className={cn("store-tab-panel", activeTab === "tabMenu" && "active")}
            id="tabMenu"
            role="tabpanel"
            aria-labelledby="store-tab-menu"
          >
            {products.isLoading ? (
              <ListSkeleton rows={3} />
            ) : activeProducts.length === 0 ? (
              <EmptyState
                title="Carta en preparación"
                description="Este negocio aún no tiene productos publicados en su carta."
                icon={Building2}
                className="border-0 bg-transparent py-6"
              />
            ) : (
              <div className="items-grid" id="profileProductsGrid">
                {activeProducts.map((product, idx) => {
                  const visual = getProductVisual(product.name, idx);
                  const pts = computeProductPoints(product.price_cop);
                  return (
                    <article
                      key={product.id}
                      className="item-pixel-card"
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        setSelectedProduct({
                          product,
                          points: pts,
                          index: idx,
                        })
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedProduct({
                            product,
                            points: pts,
                            index: idx,
                          });
                        }
                      }}
                    >
                      <div className="item-card-image" style={{ background: visual.bg }}>
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="size-full object-cover"
                          />
                        ) : (
                          <PixelItemSvg sprite={visual.spriteKey} size={56} />
                        )}
                      </div>
                      <div className="item-card-body">
                        <div>
                          <h3 className="item-card-title">{product.name}</h3>
                          <p className="item-card-sub" style={{ marginTop: 4 }}>
                            {product.description ||
                              (product.kind === "combo"
                                ? "Combo especial de la carta"
                                : "Producto de la carta")}
                          </p>
                        </div>
                        <div className="item-card-footer">
                          <span className="item-badge-highlight">
                            {formatCOP(product.price_cop)}
                          </span>
                          <span className="item-badge-xp">+{pts} PTS</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panel 3: Movimientos */}
          <div
            className={cn("store-tab-panel", activeTab === "tabActivity" && "active")}
            id="tabActivity"
            role="tabpanel"
            aria-labelledby="store-tab-activity"
          >
            <div className="history-list" id="profileHistoryList">
              {transactions.isLoading ? (
                <ListSkeleton rows={3} />
              ) : transactions.isError ? (
                <ErrorState
                  error={transactions.error}
                  onRetry={() => void transactions.refetch()}
                />
              ) : (!transactions.data || transactions.data.length === 0) &&
                (!purchases.data || purchases.data.length === 0) ? (
                <EmptyState
                  title="Sin movimientos todavía"
                  description="Pide en caja que generen el QR de tu compra y escanéalo para acumular tus primeros loopoints."
                  icon={ReceiptText}
                  className="border-0 bg-transparent py-6"
                />
              ) : (
                <>
                  {(transactions.data ?? []).slice(0, 10).map((movement) => (
                    <div key={movement.id} className="history-row">
                      <div className="min-w-0">
                        <div className="text-sm font-bold">
                          {movement.movement_type === "purchase_credit"
                            ? "Compra acreditada"
                            : movement.movement_type === "redemption_debit"
                              ? "Canje"
                              : movement.movement_type === "bonus_credit"
                                ? "Bono"
                                : movement.movement_type === "expiry_debit"
                                  ? "Loopoints vencidos"
                                  : movement.movement_type}
                        </div>
                        <div className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                          {movement.reason
                            ? `${movement.reason} • ${formatDateBogota(movement.created_at)}`
                            : formatDateBogota(movement.created_at)}
                        </div>
                      </div>
                      <span
                        className="pixel-title shrink-0"
                        style={{
                          fontSize: 10,
                          color: movement.points > 0 ? "var(--green)" : "var(--red)",
                        }}
                      >
                        {movement.points > 0 ? "+" : ""}
                        {movement.points} PTS
                      </span>
                    </div>
                  ))}

                  {(purchases.data ?? []).slice(0, 5).map((purchase) => (
                    <div key={purchase.id} className="history-row">
                      <div className="min-w-0">
                        <div className="text-sm font-bold">
                          Compra: {formatCOP(purchase.amount_cop)}
                        </div>
                        <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                          {formatDateBogota(purchase.claimed_at ?? purchase.created_at)}
                          {purchase.items_count > 0 ? ` • ${purchase.items_count} producto(s)` : ""}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className="pixel-title"
                          style={{ fontSize: 10, color: "var(--green)" }}
                        >
                          +{purchase.points_awarded} PTS
                        </span>
                        <button
                          type="button"
                          onClick={() => setDetailId(purchase.id)}
                          className="pixel-btn pixel-btn-secondary px-2.5 py-1 text-[11px]"
                        >
                          Ver detalle
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Modal de detalle / solicitud de recompensa */}
      {redeemDialog && rewardModalVisual && (
        <div
          className="modal-overlay open"
          role="dialog"
          aria-modal="true"
          aria-labelledby="appModalTitle"
          onClick={(event) => {
            if (event.target === event.currentTarget && !requestRedemption.isPending) {
              setRedeemDialog(null);
            }
          }}
        >
          <div className="pixel-box modal-dialog">
            <div className="modal-hero-img" style={{ background: rewardModalVisual.bg }}>
              <PixelItemSvg sprite={rewardModalVisual.spriteKey} size={84} />
              <button
                type="button"
                className="pixel-btn pixel-btn-ruby modal-close-floating"
                style={{ padding: "5px 9px" }}
                aria-label="Cerrar modal"
                onClick={() => setRedeemDialog(null)}
                disabled={requestRedemption.isPending}
              >
                X
              </button>
            </div>
            <div className="modal-content-pad">
              <div className="flex items-start justify-between gap-2">
                <h2
                  className="pixel-title"
                  id="appModalTitle"
                  style={{ fontSize: 12, lineHeight: 1.35 }}
                >
                  {redeemDialog.reward.name}
                </h2>
                <span className="item-badge-highlight">
                  {redeemDialog.reward.points_required} PTS
                </span>
              </div>
              <p className="text-[15px] leading-[1.45] text-[var(--text-muted)]">
                {redeemDialog.reward.description ||
                  `Canjear ${redeemDialog.reward.name} por ${formatPoints(redeemDialog.reward.points_required)}.`}
              </p>
              <div className="pixel-box-dark p-2.5 text-[13px] text-[var(--text-muted)]">
                Se reservarán {formatPoints(redeemDialog.reward.points_required)} en {business.name}{" "}
                y el encargado podrá aprobar la solicitud directamente en caja.
              </div>
              {redeemDialog.reward.can_redeem ? (
                <form onSubmit={confirmRedemption} className="flex flex-col gap-2">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRedeemDialog(null)}
                      disabled={requestRedemption.isPending}
                      className="pixel-btn pixel-btn-secondary"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      loading={requestRedemption.isPending}
                      disabled={!redeemDialog.reward.can_redeem}
                      className="pixel-btn pixel-btn-xp flex-1"
                    >
                      Confirmar solicitud
                    </Button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  className="pixel-btn pixel-btn-secondary w-full"
                  style={{ padding: 11 }}
                  onClick={() => setRedeemDialog(null)}
                >
                  TE FALTAN {Math.max(0, redeemDialog.reward.remaining)} PTS
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalle de producto de la carta */}
      {selectedProduct && productModalVisual && (
        <div
          className="modal-overlay open"
          role="dialog"
          aria-modal="true"
          aria-labelledby="productModalTitle"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedProduct(null);
            }
          }}
        >
          <div className="pixel-box modal-dialog">
            <div className="modal-hero-img" style={{ background: productModalVisual.bg }}>
              {selectedProduct.product.image_url ? (
                <img
                  src={selectedProduct.product.image_url}
                  alt={selectedProduct.product.name}
                  className="size-full object-cover"
                />
              ) : (
                <PixelItemSvg sprite={productModalVisual.spriteKey} size={84} />
              )}
              <button
                type="button"
                className="pixel-btn pixel-btn-ruby modal-close-floating"
                style={{ padding: "5px 9px" }}
                aria-label="Cerrar modal"
                onClick={() => setSelectedProduct(null)}
              >
                X
              </button>
            </div>
            <div className="modal-content-pad">
              <div className="flex items-start justify-between gap-2">
                <h2
                  className="pixel-title"
                  id="productModalTitle"
                  style={{ fontSize: 12, lineHeight: 1.35 }}
                >
                  {selectedProduct.product.name}
                </h2>
                <span className="item-badge-highlight">
                  {formatCOP(selectedProduct.product.price_cop)}
                </span>
              </div>
              <p className="text-[15px] leading-[1.45] text-[var(--text-muted)]">
                {selectedProduct.product.description ||
                  "Producto disponible en el establecimiento."}
              </p>
              <div className="pixel-box-dark flex items-center justify-between p-2.5">
                <span className="text-[13px] text-[var(--text-muted)]">Puntos que acumulas:</span>
                <span className="pixel-title" style={{ fontSize: 10, color: "var(--green)" }}>
                  +{selectedProduct.points} PTS
                </span>
              </div>
              {selectedProduct.product.combo_items?.length > 0 && (
                <div className="text-xs text-[var(--text-muted)]">
                  <strong>Incluye: </strong>
                  {selectedProduct.product.combo_items
                    .map((item) => `${item.quantity}× ${item.name}`)
                    .join(", ")}
                </div>
              )}
              <button
                type="button"
                className="pixel-btn pixel-btn-gold w-full"
                style={{ padding: 11 }}
                onClick={() => setSelectedProduct(null)}
              >
                ENTENDIDO
              </button>
            </div>
          </div>
        </div>
      )}

      <PurchaseDetailDialog
        open={Boolean(detailId)}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
        purchaseId={detailId}
        mode="customer"
      />
    </>
  );
}
