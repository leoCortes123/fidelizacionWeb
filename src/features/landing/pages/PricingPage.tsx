import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatedPixelArt } from "@/features/landing/AnimatedPixelArt";
import {
  PixelArrowRightIcon,
  PixelCheckIcon,
  PixelCoinIcon,
  PixelGiftIcon,
  PixelSparklesIcon,
  PixelTagIcon,
} from "@/features/landing/PixelIcons";
import { REGISTER_BUSINESS, SiteLayout } from "@/features/landing/SiteLayout";
import { SubpageHero } from "@/features/landing/SubpageHero";
import { usePageMeta } from "@/features/landing/usePageMeta";
import { planComparisonRows, pricingPlans, proposedFeatures } from "@/features/landing/webContent";
import { brandName } from "@/lib/config";

function formatCop(value: number): string {
  if (value === 0) return "$0";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function renderComparisonValue(value: string) {
  if (value === "—") {
    return (
      <span className="compare-val compare-val-no">
        <span className="compare-dash" aria-hidden="true">
          —
        </span>
        <span className="sr-only">No incluido</span>
      </span>
    );
  }
  return (
    <span className="compare-val compare-val-yes">
      <PixelCheckIcon size={15} />
      <span>{value}</span>
    </span>
  );
}

type PlanFilter = "all" | "free" | "pro" | "suite";

const planFilters: Array<{ id: PlanFilter; label: string }> = [
  { id: "all", label: "Comparar todos" },
  { id: "free", label: "Player 1 · Gratis" },
  { id: "pro", label: "Level Up · Pro ★" },
  { id: "suite", label: "Modo Arcade · Suite" },
];

export function PricingPage() {
  const brand = brandName || "Fideliapp";
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");

  usePageMeta({
    title: `Precios y Planes · ${brand}`,
    description: `Conoce los planes de ${brand}: Player 1 · Gratis para 1 local (acumular puntos y redimir recompensas), Level Up · Pro con campañas y difusiones, y Modo Arcade · Suite con juegos, comandera y facturación (próximamente).`,
    path: "/precios",
    breadcrumbLabel: "Precios",
  });

  return (
    <SiteLayout>
      <SubpageHero
        titleId="page-pricing-title"
        eyebrow="Planes y precios · En pesos COP"
        titleStart="Elige la capa ideal"
        titleHighlight="para tu negocio."
        lead={
          <>
            Con <strong>{brand}</strong> empiezas gratis en 1 local con acumulación de puntos y
            canje de recompensas, escalas a campañas y difusiones, o te preparas para la suite
            completa con juegos, comandera y facturación.
          </>
        }
        actions={[
          { label: "Ver planes disponibles", to: "#planes", variant: "start" },
          { label: "Empezar gratis", to: REGISTER_BUSINESS, variant: "primary" },
        ]}
        proofLabel="Beneficios de precios"
        proofItems={[
          { icon: <PixelCoinIcon size={16} />, label: "Gratis para 1 local" },
          { icon: <PixelTagIcon size={16} />, label: "Precios en COP" },
          { icon: <PixelGiftIcon size={16} />, label: "Ahorra 15%+ anual" },
        ]}
        hudLabel="CAPAS · PLANES COP"
        hudTag="3 NIVELES"
        image="/art/hero-precios.jpg"
        imageAlt="Ilustración pixel art 32-bit de tres pedestales ascendentes representando los niveles de Fideliapp: local inicial gratuito, cofre dorado de crecimiento y suite completa con arcade y trofeo"
      />

      {/* TARJETAS DE PRECIOS */}
      <section
        id="planes"
        className="wrap retro-section pricing-plans-section"
        aria-labelledby="plans-grid-title"
      >
        <div className="pricing-toolbar">
          <div>
            <p className="kicker">ELIGE TU CICLO DE FACTURACIÓN</p>
            <h2 id="plans-grid-title">Tres capas pensadas para crecer a tu ritmo</h2>
          </div>

          <div className="billing-toggle" role="group" aria-label="Ciclo de facturación">
            <button
              type="button"
              className={`filter-chip ${billing === "monthly" ? "filter-chip-active" : ""}`}
              aria-pressed={billing === "monthly"}
              onClick={() => setBilling("monthly")}
            >
              Pago mensual
            </button>
            <button
              type="button"
              className={`filter-chip ${billing === "annual" ? "filter-chip-active" : ""}`}
              aria-pressed={billing === "annual"}
              onClick={() => setBilling("annual")}
            >
              Pago anual (ahorra 15%+)
            </button>
          </div>
        </div>

        <div className="pricing-grid">
          {pricingPlans.map((plan) => {
            const price = billing === "annual" ? plan.annualMonthlyCop : plan.monthlyCop;
            return (
              <article
                key={plan.id}
                className={`pricing-card ${plan.highlighted ? "pricing-card-featured" : ""}`}
              >
                <div className="pricing-art-wrap">
                  <AnimatedPixelArt
                    src={plan.image}
                    alt={plan.imageAlt}
                    loading="lazy"
                    width={400}
                    height={300}
                  />
                </div>

                <div className="pricing-head">
                  <span className="pricing-badge">{plan.badge}</span>
                  <h3>{plan.name}</h3>
                  <p className="pricing-tagline">{plan.tagline}</p>
                </div>

                <div className="pricing-price">
                  <strong className="pricing-amount">{formatCop(price)}</strong>
                  <span className="pricing-period">
                    {price === 0 ? "para siempre · 1 local" : "COP / mes"}
                  </span>
                </div>

                <ul className="check-list pricing-list">
                  {plan.features.map((feat) => (
                    <li key={feat.label}>
                      <PixelCheckIcon size={20} />
                      <span>
                        {feat.label}{" "}
                        {feat.comingSoon && (
                          <span className="soon-pill">
                            <PixelSparklesIcon size={13} /> Próximamente
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  className={`btn ${plan.highlighted ? "btn-start" : "btn-primary"} btn-lg pricing-cta`}
                  to={plan.ctaTo}
                >
                  {plan.ctaLabel} <PixelArrowRightIcon size={16} />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      {/* COMPARATIVA ENTRE CAPAS */}
      <section className="wrap retro-section" aria-labelledby="plans-compare-title">
        <div className="section-head">
          <p className="kicker">COMPARATIVA DE CAPAS</p>
          <h2 id="plans-compare-title">¿Qué incluye cada nivel de {brand}?</h2>
          <p>
            Las funciones etiquetadas como «Próximamente» hacen parte de nuestra hoja de ruta activa
            y se activarán sin costo adicional dentro de su capa correspondiente.
          </p>
        </div>

        <div
          className="compare-plan-filter"
          role="group"
          aria-label="Filtrar tabla comparativa por nivel"
        >
          {planFilters.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`filter-chip ${planFilter === item.id ? "filter-chip-active" : ""}`}
              aria-pressed={planFilter === item.id}
              onClick={() => setPlanFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div
          className="compare-wrap compare-plans-wrap"
          data-plan-filter={planFilter}
          tabIndex={0}
          role="region"
          aria-labelledby="plans-compare-title"
        >
          <table className="compare compare-plans">
            <caption className="sr-only">
              Comparativa de funciones entre las tres capas de Fideliapp
            </caption>
            <thead>
              <tr>
                <th scope="col">Capacidad</th>
                <th scope="col" data-plan="free">
                  Player 1 · Gratis
                </th>
                <th scope="col" data-plan="pro" className="compare-col-featured">
                  Level Up · Pro <span className="compare-col-tag">★ Popular</span>
                </th>
                <th scope="col" data-plan="suite">
                  Modo Arcade · Suite
                </th>
              </tr>
            </thead>
            <tbody>
              {planComparisonRows.map((row) => (
                <tr key={row.feature}>
                  <th scope="row">
                    <span className="compare-feature-title">{row.feature}</span>
                    {row.comingSoon && (
                      <span className="soon-pill">
                        <PixelSparklesIcon size={13} /> Próximamente
                      </span>
                    )}
                  </th>
                  <td data-label="Player 1 · Gratis" data-plan="free">
                    {renderComparisonValue(row.free)}
                  </td>
                  <td data-label="Level Up · Pro" data-plan="pro" className="compare-cell-featured">
                    {renderComparisonValue(row.pro)}
                  </td>
                  <td data-label="Modo Arcade · Suite" data-plan="suite">
                    {renderComparisonValue(row.suite)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FUNCIONES PROPUESTAS / ROADMAP */}
      <section className="setup retro-section" aria-labelledby="proposed-title">
        <div className="wrap">
          <div className="section-head">
            <p className="kicker">FUNCIONES PROPUESTAS · PRÓXIMAMENTE</p>
            <h2 id="proposed-title">Lo que viene en las siguientes actualizaciones</h2>
            <p>
              Construimos {brand} por capas para que operes hoy mismo en caja mientras sumamos
              automatización, juegos y gestión completa del local.
            </p>
          </div>

          <div className="proposed-grid">
            {proposedFeatures.map((item) => (
              <article className="proposed-card" key={item.code}>
                <div className="proposed-top">
                  <span className="roadmap-area">{item.area}</span>
                  <span className="soon-pill">
                    <PixelSparklesIcon size={14} /> {item.status}
                  </span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
