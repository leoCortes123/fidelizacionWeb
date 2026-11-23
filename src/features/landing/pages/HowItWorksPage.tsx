import {
  Suspense,
  lazy,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Link } from "react-router-dom";
import {
  PixelArrowRightIcon,
  PixelCheckIcon,
  PixelChevronLeftIcon,
  PixelChevronRightIcon,
  PixelPhoneIcon,
  PixelQrIcon,
  PixelStepsIcon,
} from "@/features/landing/PixelIcons";
import { REGISTER_BUSINESS, SiteLayout } from "@/features/landing/SiteLayout";
import { SubpageHero } from "@/features/landing/SubpageHero";
import { usePageMeta } from "@/features/landing/usePageMeta";
import { manualSteps, setupSteps } from "@/features/landing/webContent";
import { brandName } from "@/lib/config";

const ProcessAnimation = lazy(() => import("@/features/landing/ProcessAnimation"));

function AnimationFallback() {
  return <div className="anim-fallback" aria-hidden="true" />;
}

export function HowItWorksPage() {
  const brand = brandName || "Fideliapp";
  const [activeStep, setActiveStep] = useState(0);
  const tabListRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const panelStackRef = useRef<HTMLDivElement | null>(null);
  const panelRefs = useRef<Array<HTMLElement | null>>([]);

  const step = manualSteps[activeStep] ?? manualSteps[0];
  const lastStep = manualSteps.length - 1;

  usePageMeta({
    title: `Cómo funciona ${brand} · Manual de 5 pasos y puesta en marcha`,
    description: `Aprende paso a paso cómo funciona el programa de puntos con QR de ${brand}: registro de venta, escaneo del cliente, progreso, aprobación de canje y puesta en marcha en 3 pasos.`,
    path: "/como-funciona",
    breadcrumbLabel: "Cómo funciona",
  });

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

  return (
    <SiteLayout>
      <SubpageHero
        titleId="page-how-title"
        eyebrow="Manual operativo · 5 pasos"
        titleStart={`¿Cómo funciona ${brand}`}
        titleHighlight="en tu negocio?"
        lead={
          <>
            <strong>{brand}</strong> conecta tu caja con el celular de tus clientes mediante códigos
            QR únicos: el encargado registra la compra, el cliente escanea para sumar monedas y
            canjea premios aprobados por tu equipo, sin hardware ni integraciones complejas.
          </>
        }
        actions={[
          { label: "Ver los 5 pasos", to: "#manual-pasos", variant: "start" },
          { label: "Registrar mi negocio", to: REGISTER_BUSINESS, variant: "primary" },
        ]}
        proofLabel="Claves de operación"
        proofItems={[
          { icon: <PixelQrIcon size={16} />, label: "QR único por compra" },
          { icon: <PixelPhoneIcon size={16} />, label: "Sin hardware POS" },
          { icon: <PixelStepsIcon size={16} />, label: "Ciclo en 5 pasos" },
        ]}
        hudLabel="FLUJO QR · MANUAL"
        hudTag="5 PASOS"
        image="/art/hero-como-funciona.jpg"
        imageAlt="Ilustración pixel art 32-bit del flujo QR en caja: tablet POS con código QR, celular escaneando, monedas volando hacia una barra de progreso y caja de regalo"
      />

      <section
        id="manual-pasos"
        className="wrap manual-wrap retro-section"
        aria-labelledby="manual-title"
      >
        <h2 id="manual-title" className="sr-only">
          Pasos interactivos del ciclo de fidelización
        </h2>

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
                <PixelChevronLeftIcon size={18} />
                <span className="manual-arrow-text">Anterior</span>
              </button>

              <div className="manual-sign" role="status" aria-live="polite" aria-atomic="true">
                <div className="manual-sign-meta">
                  <span className="manual-sign-badge">
                    PASO 0{step.moment} DE 0{manualSteps.length}
                  </span>
                  <span className={`actor actor-${step.actor === "Cliente" ? "client" : "staff"}`}>
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
                <PixelChevronRightIcon size={18} />
              </button>
            </div>

            <div
              className="manual-pagination"
              ref={tabListRef}
              role="tablist"
              aria-label="Indicadores de paginación de pasos"
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
                            <PixelCheckIcon size={20} />
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
              Registrar mi negocio <PixelArrowRightIcon size={16} />
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
