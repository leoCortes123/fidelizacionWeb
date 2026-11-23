import {
  Suspense,
  lazy,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Gift,
  Globe,
  Megaphone,
  PiggyBank,
  QrCode,
  SlidersHorizontal,
  Smartphone,
  Timer,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InstallPwaButton } from "@/components/pwa/InstallPwaButton";
import { EatersBackground } from "@/features/landing/EatersBackground";
import {
  adminFeatures,
  businessTypes,
  comparisonRows,
  faqs,
  manualSteps,
  setupSteps,
} from "@/features/landing/landingContent";
import { useAuth } from "./AuthProvider";
import { brandName, defaultPathForRoles, isSupabaseConfigured } from "@/lib/config";
import { resolvePostLoginPath } from "@/lib/postLogin";
import "./LandingPage.css";

// La animación (GSAP + CSS) se carga en un chunk aparte para no retrasar el primer render.
const ProcessAnimation = lazy(() => import("@/features/landing/ProcessAnimation"));

const REGISTER_BUSINESS = "/admin/onboarding?new=1";
const featureIcons: LucideIcon[] = [
  Gift,
  SlidersHorizontal,
  Megaphone,
  Users,
  PiggyBank,
  ClipboardList,
];

function AnimationFallback() {
  return <div className="anim-fallback" aria-hidden="true" />;
}

function Brand({ brand, size = 26 }: { brand: string; size?: number }) {
  return (
    <Link className="brand" to="/" aria-label={`${brand}, ir al inicio`}>
      <span className="brand-mark" aria-hidden="true">
        <img src="/fideliapp-coin.png" alt="" width={size} height={size} className="brand-coin" />
      </span>
      <span className="brand-text">
        {brand.toLowerCase()}
        <span className="brand-dot">.</span>
      </span>
    </Link>
  );
}

export function LandingPage() {
  const { session, roles, rolesLoading = false, rolesLoaded = true } = useAuth();
  const navigate = useNavigate();
  const [navigatingAccount, setNavigatingAccount] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const tabListRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const panelStackRef = useRef<HTMLDivElement | null>(null);
  const panelRefs = useRef<Array<HTMLElement | null>>([]);

  const brand = brandName || "Fideliapp";
  const step = manualSteps[activeStep] ?? manualSteps[0];
  const lastStep = manualSteps.length - 1;

  // React 19 serializa `hidden="until-found"` como booleano (`hidden=""`).
  // Lo actualizamos en el atributo DOM para que Ctrl+F encuentre los 5 pasos del manual.
  useLayoutEffect(() => {
    panelRefs.current.forEach((panel, idx) => {
      if (!panel) return;
      if (idx === activeStep) {
        panel.removeAttribute("hidden");
      } else {
        panel.setAttribute("hidden", "until-found");
      }
    });
  }, [activeStep]);

  // Si Ctrl+F coincide dentro de un paso oculto (`hidden="until-found"`), sincroniza la pestaña y la animación.
  useEffect(() => {
    const stack = panelStackRef.current;
    if (!stack) return;
    const onBeforeMatch = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const panel = target?.closest<HTMLElement>("[data-step-index]");
      const idx = panel ? Number(panel.dataset.stepIndex) : Number.NaN;
      if (!Number.isNaN(idx) && idx >= 0 && idx <= lastStep) {
        setActiveStep(idx);
      }
    };
    stack.addEventListener("beforematch", onBeforeMatch);
    return () => stack.removeEventListener("beforematch", onBeforeMatch);
  }, [lastStep]);

  const prevBtnRef = useRef<HTMLButtonElement | null>(null);
  const nextBtnRef = useRef<HTMLButtonElement | null>(null);

  const goToStep = (index: number, focusTarget: "tab" | "arrow" | false = false) => {
    const next = Math.max(0, Math.min(lastStep, index));
    setActiveStep(next);
    if (focusTarget === "tab") {
      tabRefs.current[next]?.focus();
    } else if (focusTarget === "arrow") {
      if (next === 0) {
        nextBtnRef.current?.focus();
      } else if (next === lastStep) {
        prevBtnRef.current?.focus();
      }
    }
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const keyMap: Record<string, number> = {
      ArrowRight: activeStep + 1,
      ArrowDown: activeStep + 1,
      ArrowLeft: activeStep - 1,
      ArrowUp: activeStep - 1,
      Home: 0,
      End: lastStep,
    };
    if (event.key in keyMap) {
      event.preventDefault();
      goToStep(keyMap[event.key], "tab");
    }
  };

  const goToAccount = () => {
    if (rolesLoading || !rolesLoaded || navigatingAccount) return;
    setNavigatingAccount(true);
    void resolvePostLoginPath(roles)
      .then((destination) => navigate(destination))
      .catch(() => navigate(defaultPathForRoles(roles)))
      .finally(() => setNavigatingAccount(false));
  };

  return (
    <div className="retro-landing">
      <EatersBackground />
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>

      <header className="retro-header">
        <div className="wrap nav">
          <Brand brand={brand} size={34} />
          <nav className="navlinks" aria-label="Secciones de la página">
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#funciones">Funciones</a>
            <a href="#app">La app</a>
            <a href="#negocios">Negocios</a>
            <a href="#preguntas">Preguntas</a>
          </nav>
          <div className="nav-actions">
            <InstallPwaButton
              className="btn btn-download btn-xs nav-download"
              label="Descargar app"
            />
            {session ? (
              <button
                className="btn btn-dark btn-xs"
                type="button"
                disabled={navigatingAccount || rolesLoading || !rolesLoaded}
                onClick={goToAccount}
              >
                Ir a mi cuenta ↗
              </button>
            ) : (
              <Link className="btn btn-light btn-xs" to="/login">
                Ingresar
              </Link>
            )}
          </div>
        </div>
      </header>

      <main id="contenido">
        {/* HERO: qué es, para quién y por qué (respuesta rápida para buscadores e IA) */}
        <section className="wrap hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="eyebrow-dot" aria-hidden="true">
                ★
              </span>
              Software de fidelización para negocios
            </p>

            <div className="hero-main">
              <h1 id="hero-title">
                Programa de puntos <span className="highlight">para tu negocio.</span>
              </h1>
              <p className="lead">
                <strong>{brand}</strong> es tu app de fidelización con QR: registras la venta, tus
                clientes suman monedas en su celular y las canjean por premios, sin tarjetas de
                papel.
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
                  Crear mi programa de puntos <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a className="btn btn-primary btn-hero" href="#como-funciona">
                  Ver cómo funciona <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>

            <ul className="hero-proof" aria-label="Ventajas principales">
              <li>
                <QrCode aria-hidden="true" /> QR único por venta
              </li>
              <li>
                <Smartphone aria-hidden="true" /> Celular o tablet
              </li>
              <li>
                <Timer aria-hidden="true" /> Listo en 3 pasos
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

        <div className="ticker" aria-hidden="true">
          <div className="ticker-track">
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
        </div>

        {/* MANUAL DE USO: una pestaña por escena de la animación */}
        <section id="como-funciona" className="wrap retro-section" aria-labelledby="manual-title">
          <div className="section-head">
            <p className="kicker">MANUAL DE USO · 5 PASOS</p>
            <h2 id="manual-title">¿Cómo funciona {brand}?</h2>
            <p>
              Así se ve un ciclo completo de fidelización, desde la venta en caja hasta la entrega
              del premio. Selecciona cada paso para ver la escena y qué hace cada persona.
            </p>
          </div>

          <div className="manual">
            <div className="manual-stepper">
              <div className="manual-sign-row">
                <button
                  ref={prevBtnRef}
                  type="button"
                  className="btn btn-light manual-arrow-btn"
                  onClick={() => goToStep(activeStep - 1, "arrow")}
                  disabled={activeStep === 0}
                  aria-label="Paso anterior"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  <span className="manual-arrow-text">Anterior</span>
                </button>

                <div className="manual-sign" role="status" aria-live="polite" aria-atomic="true">
                  <div className="manual-sign-meta">
                    <span className="manual-sign-badge">
                      PASO 0{step.moment} DE 0{manualSteps.length}
                    </span>
                    <span
                      className={`actor actor-${step.actor === "Cliente" ? "client" : "staff"}`}
                    >
                      {step.actor}
                    </span>
                  </div>
                  <div className="manual-sign-main">
                    <span className="manual-sign-num">0{step.moment}</span>
                    <div className="manual-sign-copy">
                      <strong className="manual-sign-tab">{step.tab}</strong>
                      <span className="manual-sign-subtitle">{step.title}</span>
                    </div>
                  </div>
                </div>

                <button
                  ref={nextBtnRef}
                  type="button"
                  className="btn btn-light manual-arrow-btn"
                  onClick={() => goToStep(activeStep + 1, "arrow")}
                  disabled={activeStep === lastStep}
                  aria-label="Paso siguiente"
                >
                  <span className="manual-arrow-text">Siguiente</span>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div
                className="manual-pagination"
                ref={tabListRef}
                role="tablist"
                aria-label="Pasos del proceso"
              >
                {manualSteps.map((s, idx) => (
                  <button
                    key={s.moment}
                    ref={(el) => {
                      tabRefs.current[idx] = el;
                    }}
                    id={`paso-tab-${s.moment}`}
                    type="button"
                    role="tab"
                    aria-selected={idx === activeStep}
                    tabIndex={idx === activeStep ? 0 : -1}
                    className="manual-page-dot"
                    onClick={() => goToStep(idx)}
                    onKeyDown={onTabKeyDown}
                  >
                    <span className="manual-page-num">0{s.moment}</span>
                    <span className="manual-page-label">{s.tab}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="manual-body">
              <div className="manual-stage">
                <Suspense fallback={<AnimationFallback />}>
                  <ProcessAnimation
                    moment={step.moment}
                    showCaption={false}
                    label={`Escena del paso ${step.moment}: ${step.title}`}
                  />
                </Suspense>
              </div>

              <div className="manual-panels">
                <div className="manual-panel-stack" ref={panelStackRef}>
                  {manualSteps.map((s, idx) => (
                    <article
                      key={s.moment}
                      ref={(el) => {
                        panelRefs.current[idx] = el;
                      }}
                      id={`paso-panel-${s.moment}`}
                      data-step-index={idx}
                      role="tabpanel"
                      aria-labelledby={`paso-tab-${s.moment}`}
                      tabIndex={idx === activeStep ? 0 : undefined}
                      hidden={idx !== activeStep}
                      className="manual-panel"
                    >
                      <div className="manual-panel-card">
                        <div className="manual-meta">
                          <span className="manual-step">
                            PASO 0{s.moment} DE 0{manualSteps.length}
                          </span>
                          <span
                            className={`actor actor-${s.actor === "Cliente" ? "client" : "staff"}`}
                          >
                            {s.actor}
                          </span>
                        </div>
                        <h3>{s.title}</h3>
                        <p className="manual-summary">{s.summary}</p>
                        <ul className="check-list">
                          {s.details.map((d) => (
                            <li key={d}>
                              <Check aria-hidden="true" />
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="manual-tip">
                          <strong>Consejo:</strong> {s.tip}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PUESTA EN MARCHA */}
        <section className="setup retro-section" aria-labelledby="setup-title">
          <div className="wrap">
            <div className="section-head">
              <p className="kicker">PUESTA EN MARCHA</p>
              <h2 id="setup-title">¿Cómo crear un programa de puntos para mi negocio?</h2>
              <p>
                El asistente de configuración te guía en tres pasos. Lo completas desde el celular y
                al terminar ya puedes registrar tu primera venta.
              </p>
            </div>
            <ol className="setup-steps">
              {setupSteps.map((s, idx) => (
                <li className="setup-step" key={s.title}>
                  <span className="setup-num" aria-hidden="true">
                    {idx + 1}
                  </span>
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="center-cta">
              <Link className="btn btn-primary btn-lg" to={REGISTER_BUSINESS}>
                Registrar mi negocio <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* FUNCIONES PARA ADMINISTRADORES */}
        <section id="funciones" className="wrap retro-section" aria-labelledby="features-title">
          <div className="section-head">
            <p className="kicker">PANEL DE ADMINISTRACIÓN</p>
            <h2 id="features-title">Todo lo que necesitas para fidelizar clientes</h2>
            <p>Configura el programa a tu manera y mide si está funcionando.</p>
          </div>
          <div className="features">
            {adminFeatures.map((feature, idx) => {
              const Icon = featureIcons[idx] ?? Gift;
              return (
                <article className="feature" key={feature.title}>
                  <span className="ico" aria-hidden="true">
                    <Icon />
                  </span>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* COMPARATIVA */}
        <section className="wrap retro-section" aria-labelledby="compare-title">
          <div className="section-head">
            <p className="kicker">PAPEL VS. DIGITAL</p>
            <h2 id="compare-title">Tarjeta de sellos de papel vs. {brand}</h2>
          </div>
          <div className="compare-wrap" tabIndex={0} role="region" aria-labelledby="compare-title">
            <table className="compare">
              <caption className="sr-only">
                Comparativa entre tarjeta de sellos de papel y {brand}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Aspecto</th>
                  <th scope="col">Tarjeta de papel</th>
                  <th scope="col">{brand}</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.aspect}>
                    <th scope="row">{row.aspect}</th>
                    <td className="compare-paper" data-label="Tarjeta de papel">
                      <X aria-hidden="true" /> <span>{row.paper}</span>
                    </td>
                    <td className="compare-app" data-label={brand}>
                      <Check aria-hidden="true" /> <span>{row.app}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* TIPOS DE NEGOCIO */}
        <section id="negocios" className="wrap retro-section" aria-labelledby="biz-title">
          <div className="section-head">
            <p className="kicker">IDEAL PARA</p>
            <h2 id="biz-title">Fidelización de clientes para negocios locales</h2>
            <p>
              Funciona en cualquier negocio con clientes que repiten: el programa de puntos se
              adapta a tickets pequeños y grandes.
            </p>
          </div>
          <ul className="biz-chips">
            {businessTypes.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>

        {/* APP DESTACADA */}
        <section id="app" className="wrap retro-section" aria-labelledby="app-title">
          <div className="app-band">
            <div className="app-band-copy">
              <p className="kicker kicker-light">
                SIN TIENDAS DE APPS · DIRECTO DESDE EL NAVEGADOR
              </p>
              <h2 id="app-title">Úsala como app sin buscarla en Play Store ni App Store</h2>
              <p className="app-band-lead">
                {brand} es una <strong>app web</strong>: no se descarga desde una tienda de
                aplicaciones. Puedes usarla ya mismo desde internet o guardarla en la pantalla de tu
                celular o computador en 10 segundos.
              </p>
              <ul className="app-perks">
                <li>
                  <span className="app-perk-ico" aria-hidden="true">
                    <Globe />
                  </span>
                  <div>
                    <strong>No está en tiendas (y eso es una ventaja)</strong>
                    <span>
                      No pierdes tiempo buscando en Google Play o App Store ni ocupas memoria con
                      descargas pesadas.
                    </span>
                  </div>
                </li>
                <li>
                  <span className="app-perk-ico" aria-hidden="true">
                    <Smartphone />
                  </span>
                  <div>
                    <strong>Se guarda como un ícono más</strong>
                    <span>
                      Al instalarla desde aquí, queda un acceso directo con el logo de {brand} en tu
                      pantalla de inicio.
                    </span>
                  </div>
                </li>
                <li>
                  <span className="app-perk-ico" aria-hidden="true">
                    <Zap />
                  </span>
                  <div>
                    <strong>Funciona igual para caja y clientes</strong>
                    <span>
                      Tu equipo abre el panel de ventas con un toque y tus clientes revisan sus
                      monedas sin actualizar nada.
                    </span>
                  </div>
                </li>
              </ul>
            </div>
            <div className="app-band-panel">
              <p className="app-band-badge">★ ¿CÓMO GUARDARLA EN 10 SEGUNDOS? ★</p>
              <ol className="app-steps">
                <li>
                  <span className="app-step-num" aria-hidden="true">
                    1
                  </span>
                  <span>
                    Toca el botón <strong>Descargar app</strong> de abajo.
                  </span>
                </li>
                <li>
                  <span className="app-step-num" aria-hidden="true">
                    2
                  </span>
                  <span>
                    En <strong>Android o PC</strong>, acepta <strong>&ldquo;Instalar&rdquo;</strong>{" "}
                    (o en el menú ⋮). En <strong>iPhone/iPad</strong>, toca{" "}
                    <strong>Compartir</strong> y elige{" "}
                    <strong>&ldquo;Agregar a pantalla de inicio&rdquo;</strong>.
                  </span>
                </li>
                <li>
                  <span className="app-step-num" aria-hidden="true">
                    3
                  </span>
                  <span>
                    ¡Listo! Ya puedes abrir <strong>{brand}</strong> desde tu pantalla como
                    cualquier otra app.
                  </span>
                </li>
              </ol>
              <div className="app-band-actions">
                <InstallPwaButton className="btn btn-download btn-lg" label="Descargar app" />
                <Link className="btn btn-light btn-lg" to="/login?mode=register">
                  Soy cliente: crear cuenta
                </Link>
              </div>
              <p className="app-band-note">
                ¿Prefieres no guardarla? Úsala igual directo desde el navegador, sin instalar nada.
              </p>
            </div>
          </div>
        </section>

        {/* PREGUNTAS FRECUENTES (replicadas como FAQPage JSON-LD en index.html) */}
        <section id="preguntas" className="wrap retro-section" aria-labelledby="faq-title">
          <div className="section-head">
            <p className="kicker">PREGUNTAS FRECUENTES</p>
            <h2 id="faq-title">Resolvemos tus dudas</h2>
          </div>
          <div className="faq">
            {faqs.map((f) => (
              <details className="faq-item" key={f.question}>
                <summary>{f.question}</summary>
                <p>{f.answer}</p>
              </details>
            ))}
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
            <p>Crea tu programa de fidelización hoy y registra tu primera venta en minutos.</p>
            <div className="hero-buttons cta-buttons">
              <Link className="btn btn-primary btn-lg" to={REGISTER_BUSINESS}>
                Registrar mi negocio
              </Link>
              <InstallPwaButton className="btn btn-download btn-lg" label="Descargar app" />
            </div>
          </div>
        </section>
      </main>

      <footer className="retro-footer">
        <div className="wrap footer-inner">
          <Brand brand={brand} size={24} />
          <span>© 2026 {brand.toUpperCase()} · SOFTWARE DE FIDELIZACIÓN DE CLIENTES</span>
          <nav className="footer-links" aria-label="Enlaces del pie de página">
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#preguntas">Preguntas</a>
            <Link to="/login">Iniciar sesión</Link>
            <Link to="/login?mode=register">Soy cliente</Link>
          </nav>
        </div>
      </footer>

      {/* Barra fija inferior en móvil: acceso permanente a descargar la app y registrarse */}
      <div className="mobile-cta" role="region" aria-label="Acciones rápidas">
        <InstallPwaButton className="btn btn-download" label="Descargar app" />
        <Link className="btn btn-primary" to={REGISTER_BUSINESS}>
          Crear programa
        </Link>
      </div>
    </div>
  );
}
