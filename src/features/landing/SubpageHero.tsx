import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { PixelArrowRightIcon, PixelStarIcon } from "@/features/landing/PixelIcons";

export interface HeroAction {
  label: string;
  to: string;
  variant: "start" | "primary" | "light";
}

export interface HeroProofItem {
  icon: ReactNode;
  label: string;
}

export interface SubpageHeroProps {
  titleId: string;
  eyebrow: string;
  titleStart: string;
  titleHighlight: string;
  lead: ReactNode;
  actions: HeroAction[];
  proofLabel: string;
  proofItems: HeroProofItem[];
  hudLabel: string;
  hudTag: string;
  image: string;
  imageAlt: string;
}

/**
 * Hero especial de 1vh para pantallas secundarias:
 * replica la estructura y ritmo del hero de Inicio con una ilustración
 * pixel art 32-bit dedicada y estática (sin animación).
 */
export function SubpageHero({
  titleId,
  eyebrow,
  titleStart,
  titleHighlight,
  lead,
  actions,
  proofLabel,
  proofItems,
  hudLabel,
  hudTag,
  image,
  imageAlt,
}: SubpageHeroProps) {
  return (
    <section className="wrap hero hero-subpage" aria-labelledby={titleId}>
      <div className="hero-copy">
        <p className="eyebrow">
          <span className="eyebrow-dot" aria-hidden="true">
            <PixelStarIcon size={14} />
          </span>
          {eyebrow}
        </p>

        <div className="hero-main">
          <h1 id={titleId}>
            {titleStart} <span className="highlight">{titleHighlight}</span>
          </h1>
          <p className="lead">{lead}</p>

          <div className="hero-buttons">
            {actions.map((action) => {
              const cls = `btn btn-${action.variant} btn-hero`;
              const arrowTone = action.variant === "light" ? "blue" : "gold";
              if (action.to.startsWith("#")) {
                return (
                  <a key={action.label} className={cls} href={action.to}>
                    {action.label} <PixelArrowRightIcon size={16} tone={arrowTone} />
                  </a>
                );
              }
              return (
                <Link key={action.label} className={cls} to={action.to}>
                  {action.label} <PixelArrowRightIcon size={16} tone={arrowTone} />
                </Link>
              );
            })}
          </div>
        </div>

        <ul className="hero-proof" aria-label={proofLabel}>
          {proofItems.map((item) => (
            <li key={item.label}>
              {item.icon}
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="hero-art">
        <div className="hero-frame hero-frame-static">
          <div className="hero-static-hud" aria-hidden="true">
            <span className="hero-static-hud-label">{hudLabel}</span>
            <span className="hero-static-hud-tag">{hudTag}</span>
          </div>
          <div className="hero-static-stage">
            <img
              src={image}
              alt={imageAlt}
              className="hero-static-img"
              width={1024}
              height={1024}
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
