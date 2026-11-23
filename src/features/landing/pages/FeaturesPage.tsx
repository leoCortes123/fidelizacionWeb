import { Link } from "react-router-dom";
import { AnimatedPixelArt } from "@/features/landing/AnimatedPixelArt";
import {
  PixelArrowRightIcon,
  PixelCheckIcon,
  PixelGiftIcon,
  PixelQrIcon,
  PixelShieldIcon,
  PixelSparklesIcon,
} from "@/features/landing/PixelIcons";
import { REGISTER_BUSINESS, SiteLayout } from "@/features/landing/SiteLayout";
import { SubpageHero } from "@/features/landing/SubpageHero";
import { usePageMeta } from "@/features/landing/usePageMeta";
import { featureSpotlights, proposedFeatures } from "@/features/landing/webContent";
import { brandName } from "@/lib/config";

export function FeaturesPage() {
  const brand = brandName || "Fideliapp";

  usePageMeta({
    title: `Funciones y Roadmap · ${brand} Software de fidelización`,
    description: `Explora visualmente las funciones de ${brand}: QR único por venta, campañas, control de presupuesto, auditoría, multiempresa y próximas novedades (difusiones, juegos, comandera y facturación).`,
    path: "/funciones",
    breadcrumbLabel: "Funciones",
  });

  return (
    <SiteLayout>
      <SubpageHero
        titleId="page-features-title"
        eyebrow="Capacidades del sistema"
        titleStart={`Todo lo que ${brand} hace`}
        titleHighlight="por tu negocio."
        lead={
          <>
            Cada módulo de <strong>{brand}</strong> resuelve una parte concreta del ciclo: registrar
            ventas con QR irrepetible, premiar la recompra con campañas, cuidar tu margen y escalar
            hacia una suite operativa completa.
          </>
        }
        actions={[
          { label: "Explorar módulos", to: "#modulos", variant: "start" },
          { label: "Ver planes y precios", to: "/precios", variant: "primary" },
        ]}
        proofLabel="Pilares del sistema"
        proofItems={[
          { icon: <PixelQrIcon size={16} />, label: "QR y canje seguro" },
          { icon: <PixelGiftIcon size={16} />, label: "Campañas 2x y FIFO" },
          { icon: <PixelShieldIcon size={16} />, label: "Auditoría y locales" },
        ]}
        hudLabel="MÓDULOS · ROADMAP"
        hudTag="SUITE 32-BIT"
        image="/art/hero-funciones.jpg"
        imageAlt="Ilustración pixel art 32-bit de un núcleo central con moneda dorada conectado a cuatro módulos: escáner QR, campañas con megáfono, analítica económica con escudo y suite arcade con comandera"
      />

      {/* SPOTLIGHTS VISUALES ALTERNADOS CON PIXEL ART 32-BIT */}
      <section id="modulos" className="wrap retro-section" aria-labelledby="spotlights-title">
        <h2 id="spotlights-title" className="sr-only">
          Módulos principales de Fideliapp
        </h2>
        <div className="spotlights">
          {featureSpotlights.map((item, idx) => (
            <article
              key={item.id}
              className={`spotlight-row ${idx % 2 === 1 ? "spotlight-row-reverse" : ""}`}
            >
              <div className="spotlight-media">
                <AnimatedPixelArt
                  src={item.image}
                  alt={item.imageAlt}
                  loading="lazy"
                  width={640}
                  height={480}
                />
              </div>

              <div className="spotlight-copy">
                <div className="spotlight-tags">
                  <span className="feature-cat">{item.tag}</span>
                  {item.comingSoon && (
                    <span className="soon-pill">
                      <PixelSparklesIcon size={14} /> Próximamente
                    </span>
                  )}
                </div>
                <h3>{item.title}</h3>
                <p className="spotlight-lead">{item.lead}</p>
                <ul className="check-list">
                  {item.bullets.map((b) => (
                    <li key={b}>
                      <PixelCheckIcon size={20} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* FUNCIONES PROPUESTAS */}
      <section className="setup retro-section" aria-labelledby="roadmap-title">
        <div className="wrap">
          <div className="section-head">
            <p className="kicker">HOJA DE RUTA · FUNCIONES PROPUESTAS</p>
            <h2 id="roadmap-title">Próximas características en integración</h2>
            <p>
              Las capacidades marcadas como «Próximamente» completan las capas Crecimiento y Suite
              Total sin interrumpir tu operación actual.
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

          <div className="center-cta center-cta-group">
            <Link className="btn btn-primary btn-lg" to="/precios">
              Ver planes y precios <PixelArrowRightIcon size={16} />
            </Link>
            <Link className="btn btn-start btn-lg" to={REGISTER_BUSINESS}>
              Empezar gratis hoy <PixelArrowRightIcon size={16} />
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
