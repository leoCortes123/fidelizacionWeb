import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, Gift, Link2 } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  useCustomerBusinessesClosestRewards,
  useCustomerBusinessesSummary,
} from "@/features/loyalty/hooks";
import { formatCOP, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, ErrorState, CardSkeleton } from "@/components/shared/States";
import {
  ArcadeArrowLeftSvg,
  ArcadeArrowRightSvg,
  getBusinessStageVisual,
  getRewardVisual,
  HeroCoinSvg,
  PixelBusiness32Svg,
  PixelItemSvg,
} from "./pixelSprites";
import { useFitSingleLineTitle } from "./useFitSingleLineTitle";

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
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const topbarRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  const rows = summary.data ?? [];
  const closest = useCustomerBusinessesClosestRewards(rows, user?.id ?? "");
  const total = rows.reduce((sum, row) => sum + row.balance, 0);

  const safeIndex = rows.length > 0 ? currentIndex % rows.length : 0;
  const activeBiz = rows[safeIndex] ?? null;

  useFitSingleLineTitle(titleRef, topbarRef, [
    activeBiz?.business_id,
    activeBiz?.name,
    activeBiz?.loyalty_active,
    activeBiz?.is_frequent,
    activeBiz?.is_frequent_active,
  ]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }
      if (document.querySelector('[role="dialog"], [role="menu"].open')) {
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
  }, [rows.length]);

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
            description="Escanea el QR de invitación del negocio o abre su enlace para empezar a sumar monedas."
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
                  Ejemplo: https://fideliapp.app/join/mi-negocio
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
  const statusBadge = !activeBiz.loyalty_active
    ? "PROGRAMA INACTIVO"
    : activeBiz.is_frequent_active
      ? "FRECUENTE ACTIVO"
      : activeBiz.is_frequent
        ? "FRECUENTE"
        : null;
  const showLogoImg = Boolean(activeBiz.logo_url && activeBiz.logo_url !== failedLogoUrl);

  const bizRewards = closest.rewardsByBusinessId.get(activeBiz.business_id) ?? [];
  const featuredRewards = bizRewards.slice(0, 2);

  return (
    <section className="view-section active" id="viewSelector" aria-label="Negocios afiliados">
      <div className="arcade-stage-wrapper">
        <article className="pixel-box business-select-card retro32-card" id="businessSelectCard">
          {/* Barra superior con el nombre grande del negocio y badge de estado opcional */}
          <div className="retro32-card-topbar" ref={topbarRef}>
            <h1 className="retro32-topbar-title" id="cardBizTitle" ref={titleRef}>
              {activeBiz.name}
            </h1>
            {statusBadge && (
              <span className="retro32-status-tag" id="cardCategoryBadge">
                {statusBadge}
              </span>
            )}
          </div>

          {/* Escenario Pixel Art 32x32 más grande con monedas arriba y sprite/logo */}
          <div
            className="card-hero-stage retro32-hero"
            id="cardHeroStage"
            style={{ background: stageVisual.stageBg }}
          >
            <div className="retro32-pixel-grid-overlay" aria-hidden="true" />
            <span className="retro32-corner tl" aria-hidden="true" />
            <span className="retro32-corner tr" aria-hidden="true" />
            <span className="retro32-corner bl" aria-hidden="true" />
            <span className="retro32-corner br" aria-hidden="true" />

            <div
              key={activeBiz.business_id}
              className={cn(
                "retro32-hero-slide",
                slideDir === "right" ? "slide-right" : "slide-left",
              )}
            >
              {showLogoImg && activeBiz.logo_url ? (
                <img
                  src={activeBiz.logo_url}
                  alt={`Logo de ${activeBiz.name}`}
                  className="card-hero-bg-img"
                  onError={() => setFailedLogoUrl(activeBiz.logo_url)}
                />
              ) : (
                <div className="sprite-bobbing retro32-sprite-frame" id="cardSpriteBox">
                  <PixelBusiness32Svg sprite={stageVisual.spriteKey} size={128} />
                </div>
              )}
            </div>

            {/* Abajo de la imagen: Monedas estilo tarjeta de la landing (sin recuadro negro/rojo) */}
            <div className="retro32-hero-points-bottom">
              <HeroCoinSvg size={40} />
              <div className="retro32-landing-points-text">
                <span className="retro32-landing-points-number" id="cardPointsNumber">
                  {formatNumber(activeBiz.balance)}
                </span>
                <span className="retro32-landing-points-label">MONEDAS</span>
              </div>
              <span className="sr-only" data-testid="total-points-balance">
                {formatNumber(total)}
              </span>
            </div>

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
          </div>

          {/* Cuerpo: Monedas + Progreso + Información del negocio + Botón Recompensas y carta */}
          <div className="card-body-content retro32-body">
            <div
              key={activeBiz.business_id}
              className={cn(
                "retro32-body-slide",
                slideDir === "right" ? "slide-right" : "slide-left",
              )}
            >
              <div className="retro32-rewards-panel" id="homeRewardsList">
                {featuredRewards.length > 0 ? (
                  featuredRewards.map((reward, idx) => {
                    const pct =
                      reward.points_required > 0
                        ? Math.min(
                            100,
                            Math.round((activeBiz.balance / reward.points_required) * 100),
                          )
                        : 0;
                    const remaining = Math.max(0, reward.points_required - activeBiz.balance);
                    const visual = getRewardVisual(reward.name, idx);
                    return (
                      <div
                        key={reward.id}
                        className={cn("retro32-reward-card", reward.can_redeem && "is-ready")}
                      >
                        <div className="retro32-reward-top">
                          <div className="retro32-reward-thumb" style={{ background: visual.bg }}>
                            {reward.image_url ? (
                              <img
                                src={reward.image_url}
                                alt={reward.name}
                                className="size-full object-cover"
                              />
                            ) : (
                              <PixelItemSvg sprite={visual.spriteKey} size={38} />
                            )}
                          </div>

                          <div className="retro32-reward-main">
                            <div className="retro32-reward-header">
                              <span className="retro32-reward-name">{reward.name}</span>
                              <span className="retro32-reward-cost">
                                {formatNumber(reward.points_required)} MONEDAS
                              </span>
                            </div>
                            <p className="retro32-reward-desc">
                              {reward.description?.trim() || "Recompensa disponible en tienda"}
                              {reward.min_purchase_amount > 0
                                ? ` · Compra mín. ${formatCOP(reward.min_purchase_amount)}`
                                : ""}
                            </p>
                          </div>
                        </div>

                        <div
                          className="xp-bar-track retro32-xp-track"
                          role="progressbar"
                          aria-label={`Avance para ${reward.name}`}
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className={cn("xp-bar-fill retro32-xp-fill", pct >= 100 && "ready")}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div className="retro32-reward-status-row">
                          <span
                            className={cn("retro32-reward-status", reward.can_redeem && "ready")}
                          >
                            {reward.can_redeem ? (
                              <>
                                <span className="retro32-cursor" aria-hidden="true">
                                  ▶
                                </span>{" "}
                                ¡Lista para canjear!
                              </>
                            ) : (
                              `Te faltan ${formatNumber(remaining)} monedas`
                            )}
                          </span>
                          <span className="retro32-reward-pct">{pct}%</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="pixel-box-dark flex flex-1 flex-col items-center justify-center gap-1 p-4 text-center">
                    <span className="pixel-title text-[10px] text-[var(--ink)]">
                      {activeBiz.loyalty_active
                        ? "EXPLORA LAS RECOMPENSAS Y CARTA"
                        : "PROGRAMA INACTIVO"}
                    </span>
                    <p className="text-xs text-[var(--text-muted)]">
                      Entra al detalle del negocio para consultar su catálogo disponible.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Navegación por puntos + Botón principal al detalle */}
            <div className="retro32-card-footer">
              {rows.length > 1 && (
                <div className="retro32-dots" role="group" aria-label="Negocios disponibles">
                  {rows.map((biz, idx) => (
                    <button
                      key={biz.business_id}
                      type="button"
                      className={cn("retro32-dot", idx === safeIndex && "active")}
                      aria-label={`Ver ${biz.name}`}
                      aria-current={idx === safeIndex ? "true" : undefined}
                      onClick={() => {
                        setSlideDir(idx >= safeIndex ? "right" : "left");
                        setCurrentIndex(idx);
                      }}
                    />
                  ))}
                </div>
              )}

              <Link
                to={`/customer/business/${activeBiz.business_id}`}
                className="pixel-btn pixel-btn-xp btn-see-more-rewards retro32-cta-btn"
                id="btnSeeMoreRewards"
              >
                <Gift className="size-4" aria-hidden="true" />
                <span>Recompensas y carta</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

export default CustomerBusinessesPage;
