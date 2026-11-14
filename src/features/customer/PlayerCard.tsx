import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { BusinessClosestRewardInfo } from "@/features/loyalty/hooks";
import { formatLoopoints, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PixelHeartIcon() {
  return (
    <svg viewBox="0 0 12 11" className="pixel-heart" shapeRendering="crispEdges" aria-hidden="true">
      <path fill="#e6533f" d="M2 1h3v1h2V1h3v1h1v3h-1v2H9v1H8v1H7v1H5V9H4V8H3V7H2V5H1V2h1V1z" />
      <rect x="2" y="2" width="2" height="1" fill="#fecaca" />
    </svg>
  );
}

export function PixelGiftIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-7" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="4" y="1" width="3" height="2" fill="#e6533f" />
      <rect x="9" y="1" width="3" height="2" fill="#e6533f" />
      <rect x="6" y="2" width="4" height="2" fill="#b91c1c" />
      <rect x="1" y="4" width="14" height="3" fill="#f2a541" />
      <rect x="2" y="7" width="12" height="7" fill="#d97706" />
      <rect x="3" y="7" width="10" height="6" fill="#facc15" />
      <rect x="7" y="4" width="2" height="10" fill="#e6533f" />
      <rect x="2" y="9" width="12" height="2" fill="#e6533f" />
    </svg>
  );
}

export function PixelTrophyIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-7" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="4" y="1" width="8" height="2" fill="#facc15" />
      <rect x="2" y="2" width="2" height="4" fill="#d97706" />
      <rect x="12" y="2" width="2" height="4" fill="#d97706" />
      <rect x="4" y="3" width="8" height="5" fill="#f2a541" />
      <rect x="5" y="3" width="2" height="4" fill="#fef08a" />
      <rect x="6" y="8" width="4" height="3" fill="#d97706" />
      <rect x="4" y="11" width="8" height="2" fill="#facc15" />
      <rect x="3" y="13" width="10" height="2" fill="#24221f" />
    </svg>
  );
}

export function PlayerCard({ items }: { items: BusinessClosestRewardInfo[] }) {
  const topItems = items.slice(0, 3);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  if (topItems.length === 0) return null;

  const safeIndex = selectedIndex < topItems.length ? selectedIndex : 0;
  const active = topItems[safeIndex];
  const { business, nextReward, progressPct, remainingPoints, hasReadyReward } = active;

  function selectTab(nextIndex: number) {
    setSelectedIndex(nextIndex);
    tabRefs.current[nextIndex]?.focus();
  }

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, idx: number) {
    if (topItems.length <= 1) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      selectTab((idx + 1) % topItems.length);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectTab((idx - 1 + topItems.length) % topItems.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      selectTab(0);
    } else if (event.key === "End") {
      event.preventDefault();
      selectTab(topItems.length - 1);
    }
  }

  const badgeText = hasReadyReward
    ? "PREMIO LISTO"
    : business.is_frequent_active
      ? "FRECUENTE ACTIVO"
      : business.is_frequent
        ? "FRECUENTE"
        : "JUGADOR ACTIVO";

  const progressCaption = hasReadyReward
    ? "¡TIENES UN PREMIO LISTO PARA RECLAMAR!"
    : nextReward
      ? "¡ESTÁS CERCA DE TU PRÓXIMO PREMIO!"
      : "ACUMULA LOOPOINTS CON CADA COMPRA";

  const remainingText = hasReadyReward
    ? "LISTO PARA CANJEAR EN CAJA"
    : nextReward
      ? `FALTAN ${formatNumber(remainingPoints)} PTS PARA ${nextReward.name.toUpperCase()}`
      : business.loyalty_active
        ? "SIN RECOMPENSAS ACTIVAS"
        : "PROGRAMA INACTIVO";

  return (
    <div
      className="pixel-window"
      role="region"
      aria-label="Player Card de recompensas más cercanas"
    >
      <div className="window-bar">
        <span className="window-title">
          <span className="window-led" aria-hidden="true" />
          PLAYER CARD · MÁS CERCANAS
        </span>
        <span className="window-hearts" aria-hidden="true">
          <PixelHeartIcon />
          <PixelHeartIcon />
          <PixelHeartIcon />
        </span>
      </div>

      <div className="window-body">
        {topItems.length > 1 && (
          <div className="biz-tabs" role="tablist" aria-label="Negocios con recompensas cercanas">
            {topItems.map((item, idx) => (
              <button
                key={item.business.business_id}
                ref={(el) => {
                  tabRefs.current[idx] = el;
                }}
                id={`player-tab-${item.business.business_id}`}
                type="button"
                role="tab"
                tabIndex={idx === safeIndex ? 0 : -1}
                aria-selected={idx === safeIndex}
                aria-controls="player-tabpanel"
                className={cn("biz-tab", idx === safeIndex && "active")}
                onClick={() => setSelectedIndex(idx)}
                onKeyDown={(event) => handleTabKeyDown(event, idx)}
              >
                {item.business.name}
              </button>
            ))}
          </div>
        )}

        <div
          id="player-tabpanel"
          role="tabpanel"
          aria-labelledby={
            topItems.length > 1 ? `player-tab-${business.business_id}` : undefined
          }
        >
          <div className="hud-meta">
            <span className="points-label">TU SALDO EN {business.name.toUpperCase()}</span>
            <span className={cn("level-pill", hasReadyReward && "level-pill-ready")}>
              {badgeText}
            </span>
          </div>

          <div className="points-row">
            <img
              src="/loopoint-coin.png"
              alt=""
              width={40}
              height={40}
              className="points-coin"
              aria-hidden="true"
            />
            <div className="points">{formatNumber(business.balance)} PTS</div>
          </div>

          <div className="progress-caption">{progressCaption}</div>
          <div className="retro-progress" aria-hidden="true">
            <span style={{ width: `${progressPct}%` }} />
          </div>
          <div className="progress-footer">
            <span className="truncate">{remainingText}</span>
            <strong className="shrink-0">{progressPct}%</strong>
          </div>

          <div className="reward-box">
            <div className="gift-box" aria-hidden="true">
              {hasReadyReward ? <PixelTrophyIcon /> : <PixelGiftIcon />}
            </div>
            <div className="min-w-0 flex-1">
              <span className="reward-tag">
                {hasReadyReward ? "LISTO PARA CANJEAR" : "PRÓXIMO CANJE"}
              </span>
              <strong className="block truncate text-sm font-bold sm:text-base">
                {nextReward
                  ? nextReward.name
                  : business.ready_rewards > 0
                    ? `${business.ready_rewards} ${business.ready_rewards === 1 ? "recompensa lista" : "recompensas listas"}`
                    : "Explora el negocio"}
              </strong>
              <small className="block truncate font-mono text-xs text-[var(--ink-soft)]">
                {nextReward
                  ? `Canjea con ${formatLoopoints(nextReward.points_required)}`
                  : "Revisa el catálogo y tus movimientos"}
              </small>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-[11px] text-[var(--ink-soft)]">
              {business.pending_redemptions > 0
                ? `${business.pending_redemptions} canje(s) en curso`
                : `@${business.slug}`}
            </span>
            <Link
              to={`/customer/business/${business.business_id}`}
              className="retro-btn retro-btn-red text-xs"
            >
              {hasReadyReward ? "Canjear ahora" : "Ver negocio"}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
