import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InstallPwaButton } from "@/components/pwa/InstallPwaButton";
import { AnimatedPixelArt } from "@/features/landing/AnimatedPixelArt";
import {
  PixelArrowRightIcon,
  PixelBoltIcon,
  PixelCheckIcon,
  PixelDownloadIcon,
  PixelPauseIcon,
  PixelPhoneIcon,
  PixelPlayIcon,
  PixelQrIcon,
  PixelStarIcon,
  PixelTimerIcon,
} from "@/features/landing/PixelIcons";
import { REGISTER_BUSINESS, SiteLayout } from "@/features/landing/SiteLayout";
import { usePageMeta } from "@/features/landing/usePageMeta";
import { roleShowcases } from "@/features/landing/webContent";
import { brandName, isSupabaseConfigured } from "@/lib/config";

const ProcessAnimation = lazy(() => import("@/features/landing/ProcessAnimation"));

function AnimationFallback() {
  return <div className="anim-fallback" aria-hidden="true" />;
}

export function HomePage() {
  const brand = brandName || "Fideliapp";
  const [tickerPaused, setTickerPaused] = useState(false);
  const [hubMotionPaused, setHubMotionPaused] = useState(false);
  const [activeRole, setActiveRole] = useState(0);
  const roleStackRef = useRef<HTMLDivElement | null>(null);
  const rolePanelRefs = useRef<Array<HTMLElement | null>>([]);

  usePageMeta({
    title: `${brand} · Software de fidelización y programa de puntos para negocios`,
    description: `${brand}: software de fidelización y programa de puntos con QR para negocios locales. Tus clientes suman monedas en el celular y canjean recompensas.`,
    path: "/",
  });

  useLayoutEffect(() => {
    rolePanelRefs.current.forEach((panel, idx) => {
      if (!panel) return;
      if (idx === activeRole) {
        panel.removeAttribute("hidden");
      } else {
        panel.setAttribute("hidden", "until-found");
      }
    });
  }, [activeRole]);

  useEffect(() => {
    const stack = roleStackRef.current;
    if (!stack) return;
    const onBeforeMatch = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const panel = target?.closest<HTMLElement>("[data-role-index]");
      const idx = panel ? Number(panel.dataset.roleIndex) : Number.NaN;
      if (!Number.isNaN(idx) && idx >= 0 && idx < roleShowcases.length) {
        setActiveRole(idx);
      }
    };
    stack.addEventListener("beforematch", onBeforeMatch);
    return () => stack.removeEventListener("beforematch", onBeforeMatch);
  }, []);

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="wrap hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="eyebrow-dot" aria-hidden="true">
              <PixelStarIcon size={14} />
            </span>
            Software de fidelización para negocios
          </p>

          <div className="hero-main">
            <h1 id="hero-title">
              Programa de puntos <span className="highlight">para tu negocio.</span>
            </h1>
            <p className="lead">
              <strong>{brand}</strong> es una plataforma de fidelización con código QR para
              comercios locales: registras la venta en segundos, tus clientes acumulan monedas en su
              celular y canjean premios configurados por ti, sin hardware adicional.
            </p>

            {!isSupabaseConfigured && (
              <div className="supabase-note">
                <Alert variant="warning">
                  <AlertTitle>Falta configurar Supabase</AlertTitle>
                  <AlertDescription>
                    Copia <code>.env.example</code> a <code>.env</code> y define
                    <code> VITE_SUPABASE_URL</code> y<code> VITE_SUPABASE_ANON_KEY</code> para
                    activar el inicio de sesión y los datos reales.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="hero-buttons">
              <Link className="btn btn-start btn-hero" to={REGISTER_BUSINESS}>
                Empezar gratis <PixelArrowRightIcon size={16} />
              </Link>
              <Link className="btn btn-primary btn-hero" to="/precios">
                Ver planes y precios <PixelArrowRightIcon size={16} />
              </Link>
            </div>
          </div>

          <ul className="hero-proof" aria-label="Ventajas principales">
            <li>
              <PixelQrIcon size={16} /> QR único por venta
            </li>
            <li>
              <PixelPhoneIcon size={16} /> Celular o tablet
            </li>
            <li>
              <PixelTimerIcon size={16} /> Listo en 3 pasos
            </li>
          </ul>
        </div>

        <div className="hero-art">
          <div className="hero-frame">
            <Suspense fallback={<AnimationFallback />}>
              <ProcessAnimation label="Animación del ciclo de fidelización: venta, escaneo, progreso, canje y recompensa" />
            </Suspense>
          </div>
        </div>
      </section>

      {/* TICKER CON CONTROL DE PAUSA (WCAG 2.2.2) */}
      <div className={`ticker ${tickerPaused ? "ticker-paused" : ""}`}>
        <div className="ticker-track" aria-hidden="true">
          {[0, 1].map((dup) => (
            <span className="ticker-group" key={dup}>
              <span>★ PROGRAMA DE PUNTOS</span>
              <span>✦ TARJETA DE FIDELIZACIÓN DIGITAL</span>
              <span>★ CANJE CON QR</span>
              <span>✦ CAMPAÑAS Y BONOS</span>
              <span>★ CONTROL DE PRESUPUESTO</span>
              <span>✦ CLIENTES QUE VUELVEN</span>
            </span>
          ))}
        </div>
        <button
          type="button"
          className="ticker-toggle"
          onClick={() => setTickerPaused((prev) => !prev)}
          aria-label={tickerPaused ? "Reanudar marquesina" : "Pausar marquesina"}
        >
          {tickerPaused ? <PixelPlayIcon size={14} /> : <PixelPauseIcon size={14} />}
        </button>
      </div>

      {/* EXPLORADOR DINÁMICO POR ROL CON PIXEL ART */}
      <section className="wrap retro-section" aria-labelledby="roles-title">
        <div className="section-head">
          <p className="kicker">UN SISTEMA, TRES EXPERIENCIAS</p>
          <h2 id="roles-title">¿Cómo usa {brand} cada persona en tu negocio?</h2>
          <p>
            Cada rol entra a una vista pensada para su tarea: configurar y medir margen, operar en
            caja sin filas o acumular monedas desde el celular.
          </p>
        </div>

        <div className="role-switcher">
          <div className="manual-tabs role-tabs" role="tablist" aria-label="Roles en Fideliapp">
            {roleShowcases.map((role, idx) => (
              <button
                key={role.key}
                id={`role-tab-${role.key}`}
                type="button"
                role="tab"
                aria-selected={idx === activeRole}
                tabIndex={idx === activeRole ? 0 : -1}
                className="manual-tab role-tab"
                onClick={() => setActiveRole(idx)}
                onKeyDown={(e) => {
                  const last = roleShowcases.length - 1;
                  const next =
                    e.key === "ArrowRight" || e.key === "ArrowDown"
                      ? Math.min(last, activeRole + 1)
                      : e.key === "ArrowLeft" || e.key === "ArrowUp"
                        ? Math.max(0, activeRole - 1)
                        : e.key === "Home"
                          ? 0
                          : e.key === "End"
                            ? last
                            : null;
                  if (next !== null) {
                    e.preventDefault();
                    setActiveRole(next);
                    document.getElementById(`role-tab-${roleShowcases[next].key}`)?.focus();
                  }
                }}
              >
                <span className="manual-tab-num">0{idx + 1}</span>
                <span className="manual-tab-label">{role.label}</span>
              </button>
            ))}
          </div>

          <div ref={roleStackRef} className="role-panel-stack">
            {roleShowcases.map((role, idx) => (
              <article
                key={role.key}
                ref={(el) => {
                  rolePanelRefs.current[idx] = el;
                }}
                id={`role-panel-${role.key}`}
                data-role-index={idx}
                role="tabpanel"
                aria-labelledby={`role-tab-${role.key}`}
                hidden={idx !== activeRole}
                className="role-panel"
              >
                <div className="manual-panel-card role-card-visual">
                  <div className="role-card-copy">
                    <div className="manual-meta">
                      <span className="manual-step">{role.badge.toUpperCase()}</span>
                      <span className="actor actor-staff">{role.routeExample}</span>
                    </div>
                    <h3>{role.headline}</h3>
                    <p className="manual-summary">{role.summary}</p>
                    <ul className="check-list">
                      {role.highlights.map((item) => (
                        <li key={item}>
                          <PixelCheckIcon size={20} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="role-panel-actions">
                      <Link className="btn btn-primary btn-sm" to="/como-funciona">
                        Ver flujo paso a paso <PixelArrowRightIcon size={15} />
                      </Link>
                      <Link className="btn btn-light btn-sm" to="/funciones">
                        Explorar funciones
                      </Link>
                    </div>
                  </div>
                  <div className="role-card-art">
                    <AnimatedPixelArt
                      src={role.image}
                      alt={role.imageAlt}
                      loading="lazy"
                      width={480}
                      height={360}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* HUB VISUAL DE PÁGINAS */}
      <section className="setup retro-section" aria-labelledby="discover-title">
        <div className="wrap">
          <div className="section-head-row">
            <div className="section-head">
              <p className="kicker">EXPLORA EL SISTEMA</p>
              <h2 id="discover-title">Todo el detalle de {brand}, organizado por tema</h2>
              <p>
                Revisa el manual operativo, las funciones actuales y próximas, o elige la capa de
                precios ideal para tu local.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-light btn-xs section-motion-toggle"
              onClick={() => setHubMotionPaused((prev) => !prev)}
              aria-label={
                hubMotionPaused
                  ? "Reanudar movimiento de las tarjetas visuales"
                  : "Pausar movimiento de las tarjetas visuales"
              }
            >
              {hubMotionPaused ? <PixelPlayIcon size={13} /> : <PixelPauseIcon size={13} />}
              <span>{hubMotionPaused ? "Reanudar" : "Pausar"}</span>
            </button>
          </div>

          <div className="hub-grid">
            <Link to="/como-funciona" className="hub-card">
              <div className="hub-art">
                <AnimatedPixelArt
                  src="/art/qr-scan.jpg"
                  alt="Manual de 5 pasos con QR"
                  variant="qr"
                  loading="lazy"
                  width={480}
                  height={360}
                  paused={hubMotionPaused}
                  showToggle={false}
                />
              </div>
              <h3>Manual de 5 pasos</h3>
              <p>
                Venta con QR, escaneo del cliente, barra de progreso, aprobación de canje y puesta
                en marcha en 3 pasos.
              </p>
              <span className="hub-link">
                Ir a Cómo funciona <PixelArrowRightIcon size={15} tone="blue" />
              </span>
            </Link>

            <Link to="/funciones" className="hub-card">
              <div className="hub-art">
                <AnimatedPixelArt
                  src="/art/campaigns-gifts.jpg"
                  alt="Funciones, campañas y regalos"
                  variant="campaigns"
                  loading="lazy"
                  width={480}
                  height={360}
                  paused={hubMotionPaused}
                  showToggle={false}
                />
              </div>
              <h3>Funciones y Roadmap</h3>
              <p>
                Campañas, vencimiento FIFO, auditoría, multiempresa y novedades próximas: juegos,
                difusión, comandera y facturación.
              </p>
              <span className="hub-link">
                Ir a Funciones <PixelArrowRightIcon size={15} tone="blue" />
              </span>
            </Link>

            <Link to="/precios" className="hub-card">
              <div className="hub-art">
                <AnimatedPixelArt
                  src="/art/arcade-suite.jpg"
                  alt="Capas de precios y suite completa"
                  variant="arcade"
                  loading="lazy"
                  width={480}
                  height={360}
                  paused={hubMotionPaused}
                  showToggle={false}
                />
              </div>
              <h3>Planes y Precios</h3>
              <p>
                Player 1 · Gratis para 1 local, Level Up · Pro con campañas y difusiones, y Modo
                Arcade · Suite para administrar todo tu negocio.
              </p>
              <span className="hub-link">
                Ir a Precios <PixelArrowRightIcon size={15} tone="blue" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* APP DESTACADA */}
      <section className="wrap retro-section" aria-labelledby="app-title">
        <div className="app-band">
          <div className="app-band-copy">
            <p className="kicker kicker-light">VENTAJA CLAVE · APP INSTALABLE</p>
            <h2 id="app-title">Descarga la app y lleva {brand} en el bolsillo</h2>
            <p className="app-band-lead">
              Tanto tu equipo en caja como tus clientes pueden instalar {brand} como aplicación
              (PWA) en el celular, tablet o computador, directo desde el navegador y sin pasar por
              tiendas.
            </p>
            <ul className="app-perks">
              <li>
                <span className="app-perk-ico" aria-hidden="true">
                  <PixelDownloadIcon size={20} />
                </span>
                <div>
                  <strong>Instalación inmediata</strong>
                  <span>Sin descargas pesadas ni aprobaciones de tiendas de aplicaciones.</span>
                </div>
              </li>
              <li>
                <span className="app-perk-ico" aria-hidden="true">
                  <PixelBoltIcon size={20} />
                </span>
                <div>
                  <strong>Más rápido en caja</strong>
                  <span>
                    Abre el panel con un toque para generar QR y aprobar canjes en segundos.
                  </span>
                </div>
              </li>
              <li>
                <span className="app-perk-ico" aria-hidden="true">
                  <PixelPhoneIcon size={20} />
                </span>
                <div>
                  <strong>Siempre visible para tu cliente</strong>
                  <span>
                    Tu negocio queda en la pantalla de inicio con sus monedas y recompensas.
                  </span>
                </div>
              </li>
            </ul>
          </div>
          <div className="app-band-panel">
            <p className="app-band-badge">★ LISTO EN ANDROID, IOS Y PC ★</p>
            <div className="app-band-actions">
              <InstallPwaButton className="btn btn-download btn-lg" label="Descargar app" />
              <Link className="btn btn-light btn-lg" to="/login?mode=register">
                Soy cliente: crear cuenta
              </Link>
            </div>
            <p className="app-band-note">
              Si ya la instalaste en este dispositivo, ábrela desde tu pantalla de inicio.
            </p>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="wrap retro-section cta-section">
        <div className="cta">
          <div className="cta-coin-wrap" aria-hidden="true">
            <img src="/fideliapp-coin.png" alt="" width={48} height={48} className="cta-coin" />
          </div>
          <p className="kicker cta-kicker">► INSERT COIN TO START ◄</p>
          <h2>Haz que tus clientes quieran volver.</h2>
          <p>Empieza gratis en tu local y registra tu primera venta con QR en minutos.</p>
          <div className="hero-buttons cta-buttons">
            <Link className="btn btn-primary btn-lg" to={REGISTER_BUSINESS}>
              Registrar mi negocio
            </Link>
            <Link className="btn btn-light btn-lg" to="/precios">
              Ver planes
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
