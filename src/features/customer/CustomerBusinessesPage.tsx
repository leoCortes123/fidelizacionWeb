import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Link2 } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  useBusinessPublic,
  useCustomerBusinessesClosestRewards,
  useCustomerBusinessesSummary,
} from "@/features/loyalty/hooks";
import { formatCOP, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, ErrorState, CardSkeleton } from "@/components/shared/States";
import type { LoyaltyRewardAvailable } from "@/types";
import {
  ArcadeArrowLeftSvg,
  ArcadeArrowRightSvg,
  getBusinessStageVisual,
  getRewardVisual,
  HeroCoinSvg,
  PixelItemSvg,
} from "./pixelSprites";

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Extrae el slug de un enlace de invitación o de un código pegado. */
export function parseInvitationSlug(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  const fromLink = raw.match(/\/join\/([^/?#\s]+)/i);
  const candidate = (fromLink?.[1] ?? raw).trim().toLowerCase();
  return SLUG_PATTERN.test(candidate) ? candidate : null;
}

export function CustomerBusinessesPage() {
  const { user } = useAuth();
  const summary = useCustomerBusinessesSummary();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState("");
  const [invitationError, setInvitationError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDir, setSlideDir] = useState<"right" | "left">("right");
  const [selectedReward, setSelectedReward] = useState<{
    reward: LoyaltyRewardAvailable;
    index: number;
  } | null>(null);

  const rows = summary.data ?? [];
  const closest = useCustomerBusinessesClosestRewards(rows, user?.id ?? "");
  const total = rows.reduce((sum, row) => sum + row.balance, 0);

  const safeIndex = rows.length > 0 ? currentIndex % rows.length : 0;
  const activeBiz = rows[safeIndex] ?? null;
  const publicBiz = useBusinessPublic(activeBiz?.slug ?? "");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (selectedReward) {
        if (event.key === "Escape") {
          setSelectedReward(null);
        }
        return;
      }
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (rows.length <= 1) return;
      if (event.key === "ArrowLeft") {
        setSlideDir("left");
        setCurrentIndex((prev) => (prev - 1 + rows.length) % rows.length);
      } else if (event.key === "ArrowRight") {
        setSlideDir("right");
        setCurrentIndex((prev) => (prev + 1) % rows.length);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [rows.length, selectedReward]);

  function openInvitation(event: React.FormEvent) {
    event.preventDefault();
    const slug = parseInvitationSlug(invitation);
    if (!slug) {
      setInvitationError(
        "Pega el enlace de invitación o el código del negocio (por ejemplo, mi-negocio).",
      );
      return;
    }
    setInvitationError(null);
    navigate(`/join/${slug}`);
  }

  function handlePrevBiz() {
    if (rows.length === 0) return;
    setSlideDir("left");
    setCurrentIndex((prev) => (prev - 1 + rows.length) % rows.length);
  }

  function handleNextBiz() {
    if (rows.length === 0) return;
    setSlideDir("right");
    setCurrentIndex((prev) => (prev + 1) % rows.length);
  }

  if (summary.isLoading) {
    return (
      <div className="space-y-4 p-2">
        <CardSkeleton className="h-44" />
        <div className="grid gap-4 sm:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (summary.isError) {
    return <ErrorState error={summary.error} onRetry={() => void summary.refetch()} />;
  }

  if (rows.length === 0 || !activeBiz) {
    return (
      <section className="view-section active overflow-y-auto" aria-label="Negocios afiliados">
        <div className="my-auto space-y-4 py-2">
          <EmptyState
            title="Aún no participas en ningún negocio"
            description="Escanea el QR de invitación del negocio o abre su enlace para empezar a sumar loopoints."
            icon={Building2}
            className="pixel-box"
          />
          <div className="pixel-box mx-auto max-w-md p-4 sm:p-5">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="invitation-link" className="font-mono text-xs font-bold uppercase">
                  Enlace o código del negocio
                </Label>
                <p className="font-mono text-xs text-[var(--text-muted)]">
                  Ejemplo: https://loopoint.app/join/mi-negocio
                </p>
              </div>
              <form onSubmit={openInvitation} className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="invitation-link"
                  value={invitation}
                  onChange={(event) => {
                    setInvitation(event.target.value);
                    setInvitationError(null);
                  }}
                  placeholder="mi-negocio"
                  className="form-input"
                  aria-invalid={invitationError ? true : undefined}
                  aria-describedby={invitationError ? "invitation-link-error" : undefined}
                />
                <Button type="submit" className="pixel-btn pixel-btn-dark shrink-0">
                  <Link2 aria-hidden="true" />
                  Abrir invitación
                </Button>
              </form>
              {invitationError && (
                <p
                  id="invitation-link-error"
                  role="alert"
                  className="text-xs font-semibold text-[var(--red)]"
                >
                  {invitationError}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const stageVisual = getBusinessStageVisual(activeBiz.name, activeBiz.slug, safeIndex);
  const categoryBadge = !activeBiz.loyalty_active
    ? "PROGRAMA INACTIVO"
    : activeBiz.is_frequent_active
      ? "FRECUENTE ACTIVO"
      : activeBiz.is_frequent
        ? "FRECUENTE"
        : stageVisual.category;

  const bizRewards = closest.rewardsByBusinessId.get(activeBiz.business_id) ?? [];
  const threeRewards = bizRewards.slice(0, 3);

  const defaultBio = !activeBiz.loyalty_active
    ? `Programa temporalmente inactivo en ${activeBiz.name} (@${activeBiz.slug}).`
    : activeBiz.ready_rewards > 0
      ? `Tienes ${activeBiz.ready_rewards} ${activeBiz.ready_rewards === 1 ? "recompensa lista" : "recompensas listas"} para reclamar en ${activeBiz.name} (@${activeBiz.slug}).`
      : `Acumula loopoints con cada compra en ${activeBiz.name} (@${activeBiz.slug}) y canjéalos por recompensas del programa.`;
  const bizDescription = publicBiz.data?.description?.trim() || defaultBio;

  const modalVisual = selectedReward
    ? getRewardVisual(selectedReward.reward.name, selectedReward.index)
    : null;

  return (
    <>
      <section className="view-section active" id="viewSelector" aria-label="Negocios afiliados">
        <div className="arcade-stage-wrapper">
          <article
            key={activeBiz.business_id}
            className={cn(
              "pixel-box business-select-card",
              slideDir === "right" ? "slide-right" : "slide-left",
            )}
            id="businessSelectCard"
          >
            {/* 1. Imagen del negocio con Puntos arriba-izq, Categoría arriba-der, Flechas laterales y Nombre abajo-izq */}
            <div
              className="card-hero-stage"
              id="cardHeroStage"
              style={{ background: stageVisual.stageBg }}
            >
              {/* Fondo de imagen completo o sprite pixel art */}
              {activeBiz.logo_url ? (
                <img
                  src={activeBiz.logo_url}
                  alt={`Logo de ${activeBiz.name}`}
                  className="card-hero-bg-img"
                />
              ) : (
                <div className="sprite-bobbing" id="cardSpriteBox">
                  <PixelItemSvg sprite={stageVisual.spriteKey} size={80} />
                </div>
              )}

              {/* Arriba a la izquierda: Total de puntos en el negocio */}
              <div className="hero-points-top-left">
                <HeroCoinSvg size={15} />
                <span className="hero-points-value" id="cardPointsNumber">
                  {formatNumber(activeBiz.balance)}
                </span>
                <span className="hero-points-label">PTS</span>
                <span className="sr-only" data-testid="total-points-balance">
                  {formatNumber(total)}
                </span>
              </div>

              {/* Arriba a la derecha: Letrero con el tipo/estado de negocio */}
              <span className="hero-category-top-right" id="cardCategoryBadge">
                {categoryBadge}
              </span>

              {/* Flecha Flotante Izquierda */}
              <button
                type="button"
                className="arcade-arrow-btn arcade-arrow-left"
                id="btnPrevBiz"
                aria-label="Negocio anterior"
                title="Negocio anterior"
                onClick={handlePrevBiz}
              >
                <ArcadeArrowLeftSvg />
              </button>

              {/* Flecha Flotante Derecha */}
              <button
                type="button"
                className="arcade-arrow-btn arcade-arrow-right"
                id="btnNextBiz"
                aria-label="Siguiente negocio"
                title="Siguiente negocio"
                onClick={handleNextBiz}
              >
                <ArcadeArrowRightSvg />
              </button>

              {/* Abajo a la izquierda: Nombre del negocio */}
              <div className="hero-name-bottom-left">
                <h1 className="card-biz-title" id="cardBizTitle">
                  {activeBiz.name}
                </h1>
              </div>
            </div>

            {/* 2. Cuerpo debajo de la imagen: Descripción + 3 recompensas + Botón VER MÁS */}
            <div className="card-body-content">
              <p className="card-biz-description" id="cardBizDescription">
                {bizDescription}
              </p>

              {/* 3 recompensas del negocio */}
              <div className="home-rewards-list" id="homeRewardsList">
                {threeRewards.length > 0 ? (
                  threeRewards.map((reward, idx) => {
                    const pct =
                      reward.points_required > 0
                        ? Math.min(
                            100,
                            Math.round((activeBiz.balance / reward.points_required) * 100),
                          )
                        : 0;
                    const visual = getRewardVisual(reward.name, idx);
                    return (
                      <button
                        type="button"
                        key={reward.id}
                        className="home-reward-item"
                        title={`Ver detalle de ${reward.name}`}
                        onClick={() => setSelectedReward({ reward, index: idx })}
                      >
                        <div className="home-reward-thumb" style={{ background: visual.bg }}>
                          {reward.image_url ? (
                            <img
                              src={reward.image_url}
                              alt={reward.name}
                              className="size-full object-cover"
                            />
                          ) : (
                            <PixelItemSvg sprite={visual.spriteKey} size={48} />
                          )}
                        </div>
                        <div className="home-reward-info">
                          <div className="home-reward-top">
                            <span className="home-reward-title">{reward.name}</span>
                            <span className="home-reward-pts">{reward.points_required} PTS</span>
                          </div>
                          <p className="home-reward-desc">
                            {reward.description || "Recompensa disponible en tienda"}
                          </p>
                          <div className="xp-bar-track" aria-hidden="true">
                            <div
                              className={cn("xp-bar-fill", pct >= 100 && "ready")}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="pixel-box-dark col-span-full row-span-full flex flex-col items-center justify-center gap-1 p-4 text-center">
                    <span className="pixel-title text-[10px] text-[var(--ink)]">
                      {activeBiz.loyalty_active
                        ? "EXPLORA EL CATÁLOGO DEL NEGOCIO"
                        : "PROGRAMA INACTIVO"}
                    </span>
                    <p className="text-xs text-[var(--text-muted)]">
                      {activeBiz.last_purchase_at
                        ? "Última compra registrada · Entra para ver tu carta y movimientos."
                        : "Sin compras todavía · Entra para consultar las recompensas y carta."}
                    </p>
                  </div>
                )}
              </div>

              {/* Botón para ir al detalle del negocio */}
              <Link
                to={`/customer/business/${activeBiz.business_id}`}
                className="pixel-btn pixel-btn-dark btn-see-more-rewards"
                id="btnSeeMoreRewards"
              >
                <span>VER MÁS</span>
              </Link>
            </div>
          </article>
        </div>
      </section>

      {/* Modal de detalle de recompensa desde el inicio */}
      {selectedReward && modalVisual && (
        <div
          className="modal-overlay open"
          role="dialog"
          aria-modal="true"
          aria-labelledby="homeModalTitle"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelectedReward(null);
          }}
        >
          <div className="pixel-box modal-dialog">
            <div className="modal-hero-img" style={{ background: modalVisual.bg }}>
              {selectedReward.reward.image_url ? (
                <img
                  src={selectedReward.reward.image_url}
                  alt={selectedReward.reward.name}
                  className="card-hero-bg-img"
                />
              ) : (
                <PixelItemSvg sprite={modalVisual.spriteKey} size={84} />
              )}
              <button
                type="button"
                className="pixel-btn pixel-btn-ruby modal-close-floating"
                style={{ padding: "5px 9px" }}
                aria-label="Cerrar detalle"
                onClick={() => setSelectedReward(null)}
              >
                X
              </button>
            </div>
            <div className="modal-content-pad">
              <div className="flex items-start justify-between gap-2">
                <h2
                  className="pixel-title"
                  id="homeModalTitle"
                  style={{ fontSize: 12, lineHeight: 1.35 }}
                >
                  {selectedReward.reward.name}
                </h2>
                <span className="item-badge-highlight">
                  {selectedReward.reward.points_required} PTS
                </span>
              </div>
              <p className="text-[15px] leading-[1.45] text-[var(--text-muted)]">
                {selectedReward.reward.description ||
                  "Válido presentando tu solicitud de canje en caja."}
              </p>
              <div className="pixel-box-dark p-2.5 text-[13px] text-[var(--text-muted)]">
                {selectedReward.reward.min_purchase_amount > 0
                  ? `Compra mínima requerida: ${formatCOP(selectedReward.reward.min_purchase_amount)}.`
                  : "Válido presentando tu código de canje en caja."}
              </div>
              <Link
                to={`/customer/business/${activeBiz.business_id}`}
                className={cn(
                  "pixel-btn w-full",
                  selectedReward.reward.can_redeem ? "pixel-btn-xp" : "pixel-btn-secondary",
                )}
                style={{ padding: 11 }}
                onClick={() => setSelectedReward(null)}
              >
                {selectedReward.reward.can_redeem
                  ? "CANJEAR RECOMPENSA"
                  : `TE FALTAN ${Math.max(0, selectedReward.reward.remaining)} PTS`}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
