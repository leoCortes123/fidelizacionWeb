import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "./AuthProvider";
import { brandName, brandTagline, defaultPathForRoles, isSupabaseConfigured } from "@/lib/config";
import "./LandingPage.css";

function PixelQrIcon() {
  return (
    <svg viewBox="0 0 16 16" className="pixel-svg" shapeRendering="crispEdges" aria-hidden="true">
      {/* Esquinas QR */}
      <path
        fill="currentColor"
        d="M1 1h6v6H1V1zm1 1v4h4V2H2zm1 1h2v2H3V3zm6-2h6v6H9V1zm1 1v4h4V2h-4zm1 1h2v2h-2V3zM1 9h6v6H1V9zm1 1v4h4v-4H2zm1 1h2v2H3v-2z"
      />
      {/* Datos internos */}
      <path
        fill="currentColor"
        d="M9 9h2v2H9V9zm4 0h2v2h-2V9zm-2 2h2v2h-2v-2zm-2 2h2v2H9v-2zm4 0h2v2h-2v-2z"
      />
      {/* Línea láser de escaneo */}
      <rect x="0" y="7" width="16" height="2" fill="#e6533f" />
    </svg>
  );
}

function PixelCoinStackIcon() {
  return (
    <svg viewBox="0 0 16 16" className="pixel-svg" shapeRendering="crispEdges" aria-hidden="true">
      {/* Moneda trasera */}
      <rect x="2" y="9" width="12" height="4" fill="#0891b2" />
      <rect x="1" y="10" width="14" height="2" fill="#22d3ee" />
      <rect x="3" y="10" width="10" height="1" fill="#a5f3fc" />
      {/* Moneda media */}
      <rect x="2" y="5" width="12" height="4" fill="#d97706" />
      <rect x="1" y="6" width="14" height="2" fill="#f2a541" />
      <rect x="3" y="6" width="10" height="1" fill="#fef08a" />
      {/* Moneda superior */}
      <rect x="3" y="1" width="10" height="4" fill="#0891b2" />
      <rect x="2" y="2" width="12" height="2" fill="#22d3ee" />
      <rect x="4" y="2" width="8" height="1" fill="#cffafe" />
      <rect x="7" y="2" width="2" height="2" fill="#facc15" />
    </svg>
  );
}

function PixelTrophyIcon() {
  return (
    <svg viewBox="0 0 16 16" className="pixel-svg" shapeRendering="crispEdges" aria-hidden="true">
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

function PixelWalletIcon() {
  return (
    <svg viewBox="0 0 16 16" className="pixel-svg" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="2" y="2" width="11" height="3" fill="#547b9c" />
      <rect x="3" y="3" width="9" height="2" fill="#22d3ee" />
      <rect x="1" y="5" width="14" height="9" fill="#24221f" />
      <rect x="2" y="6" width="12" height="7" fill="#e6533f" />
      <rect x="3" y="6" width="10" height="1" fill="#fca5a5" />
      <rect x="10" y="8" width="5" height="3" fill="#24221f" />
      <rect x="11" y="9" width="2" height="1" fill="#facc15" />
    </svg>
  );
}

function PixelHourglassIcon() {
  return (
    <svg viewBox="0 0 16 16" className="pixel-svg" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="2" y="1" width="12" height="2" fill="#24221f" />
      <rect x="3" y="3" width="10" height="3" fill="#cffafe" />
      <rect x="5" y="4" width="6" height="2" fill="#f2a541" />
      <rect x="5" y="6" width="6" height="2" fill="#cffafe" />
      <rect x="7" y="7" width="2" height="2" fill="#f2a541" />
      <rect x="5" y="8" width="6" height="2" fill="#cffafe" />
      <rect x="3" y="10" width="10" height="3" fill="#cffafe" />
      <rect x="4" y="11" width="8" height="2" fill="#f2a541" />
      <rect x="2" y="13" width="12" height="2" fill="#24221f" />
    </svg>
  );
}

function PixelGiftIcon() {
  return (
    <svg viewBox="0 0 16 16" className="pixel-svg" shapeRendering="crispEdges" aria-hidden="true">
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

function PixelScrollIcon() {
  return (
    <svg viewBox="0 0 16 16" className="pixel-svg" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="3" y="1" width="10" height="2" fill="#d97706" />
      <rect x="3" y="3" width="10" height="10" fill="#fff9ec" />
      <rect x="2" y="2" width="1" height="12" fill="#24221f" />
      <rect x="13" y="2" width="1" height="12" fill="#24221f" />
      <rect x="5" y="5" width="6" height="1" fill="#e6533f" />
      <rect x="5" y="7" width="6" height="1" fill="#24221f" />
      <rect x="5" y="9" width="4" height="1" fill="#5e8c62" />
      <rect x="5" y="11" width="5" height="1" fill="#24221f" />
      <rect x="3" y="13" width="10" height="2" fill="#d97706" />
    </svg>
  );
}

function PixelHeartIcon() {
  return (
    <svg viewBox="0 0 12 11" className="pixel-heart" shapeRendering="crispEdges" aria-hidden="true">
      <path fill="#e6533f" d="M2 1h3v1h2V1h3v1h1v3h-1v2H9v1H8v1H7v1H5V9H4V8H3V7H2V5H1V2h1V1z" />
      <rect x="2" y="2" width="2" height="1" fill="#fecaca" />
    </svg>
  );
}

function PixelCoffeeIcon() {
  return (
    <svg viewBox="0 0 16 16" className="pixel-svg" shapeRendering="crispEdges" aria-hidden="true">
      {/* Vapor */}
      <rect x="5" y="1" width="1" height="2" fill="#9ca3af" />
      <rect x="8" y="2" width="1" height="2" fill="#9ca3af" />
      <rect x="10" y="1" width="1" height="2" fill="#9ca3af" />
      {/* Taza */}
      <rect x="3" y="5" width="9" height="7" fill="#fff9ec" />
      <rect x="4" y="6" width="7" height="2" fill="#78350f" />
      <rect x="12" y="6" width="2" height="4" fill="#e6533f" />
      <rect x="4" y="9" width="7" height="2" fill="#e6533f" />
      <rect x="2" y="12" width="11" height="2" fill="#24221f" />
    </svg>
  );
}

interface DemoBusiness {
  id: string;
  name: string;
  badge: string;
  points: string;
  progressPct: number;
  remainingText: string;
  rewardTitle: string;
  rewardCost: string;
  bonusToast: string;
  rewardIcon: ReactNode;
}

const demoBusinesses: DemoBusiness[] = [
  {
    id: "cafe",
    name: "Café Aurora",
    badge: "LVL 04 · HABITUAL",
    points: "1.250 PTS",
    progressPct: 72,
    remainingText: "750 PTS PARA EL SIGUIENTE PREMIO",
    rewardTitle: "Café gratis",
    rewardCost: "Canjea con 2.000 loopoints",
    bonusToast: "+150 PTS · COMPRA ESCANEADA",
    rewardIcon: <PixelCoffeeIcon />,
  },
  {
    id: "taqueria",
    name: "Taquería El Fogón",
    badge: "LVL 06 · VIP",
    points: "840 PTS",
    progressPct: 90,
    remainingText: "60 PTS PARA DESBLOQUEAR COMBO",
    rewardTitle: "Tacos al pastor ×3",
    rewardCost: "Canjea con 900 loopoints",
    bonusToast: "+120 PTS · BONUS FRECUENTE",
    rewardIcon: <PixelGiftIcon />,
  },
  {
    id: "panaderia",
    name: "Masa & Miel",
    badge: "LVL 02 · NUEVO",
    points: "450 PTS",
    progressPct: 45,
    remainingText: "550 PTS PARA TU RECOMPENSA",
    rewardTitle: "Croissant de almendra",
    rewardCost: "Canjea con 1.000 loopoints",
    bonusToast: "+90 PTS · PRIMERA VISITA",
    rewardIcon: <PixelTrophyIcon />,
  },
];

const steps: Array<{
  num: string;
  xp: string;
  icon: ReactNode;
  title: string;
  text: string;
}> = [
  {
    num: "01 / COMPRA",
    xp: "STAGE 1 · SCAN",
    icon: <PixelQrIcon />,
    title: "Escanea el QR",
    text: "Compra en un negocio afiliado y escanea el código QR de tu venta desde tu celular.",
  },
  {
    num: "02 / ACUMULA",
    xp: "STAGE 2 · +PTS",
    icon: <PixelCoinStackIcon />,
    title: "Suma tus puntos",
    text: "Confirma tu compra al instante y recibe loopoints según las reglas del negocio.",
  },
  {
    num: "03 / DISFRUTA",
    xp: "STAGE 3 · LOOT",
    icon: <PixelTrophyIcon />,
    title: "Canjea recompensas",
    text: "Elige un premio disponible en el catálogo y presenta tu QR para reclamarlo en caja.",
  },
];

const features: Array<{
  slot: string;
  ico: ReactNode;
  title: string;
  text: string;
}> = [
  {
    slot: "SLOT 01",
    ico: <PixelWalletIcon />,
    title: "Saldo por negocio",
    text: "Consulta cada saldo en su propia billetera sin mezclar puntos.",
  },
  {
    slot: "SLOT 02",
    ico: <PixelHourglassIcon />,
    title: "Vencimientos",
    text: "Revisa la vigencia de tus loopoints para canjearlos a tiempo.",
  },
  {
    slot: "SLOT 03",
    ico: <PixelGiftIcon />,
    title: "Recompensas",
    text: "Explora premios desbloqueables y los puntos necesarios.",
  },
  {
    slot: "SLOT 04",
    ico: <PixelScrollIcon />,
    title: "Historial",
    text: "Consulta tus compras registradas, puntos ganados y canjes.",
  },
];

export function LandingPage() {
  const { session, roles } = useAuth();
  const navigate = useNavigate();
  const [selectedBizIndex, setSelectedBizIndex] = useState(0);

  const brand = brandName || "Loopoint";
  const activeBiz = demoBusinesses[selectedBizIndex] ?? demoBusinesses[0];

  return (
    <div className="retro-landing">
      <header className="retro-header">
        <div className="wrap nav">
          <Link className="brand" to="/" aria-label={`${brand}, ir al inicio`}>
            <span className="brand-mark" aria-hidden="true">
              <img src="/loopoint-coin.png" alt="" width={26} height={26} className="brand-coin" />
            </span>
            <span className="brand-text">
              {brand.toLowerCase()}
              <span className="brand-dot">.</span>
            </span>
          </Link>
          <nav className="navlinks" aria-label="Navegación de la página">
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#clientes">Clientes</a>
            <a href="#negocios">Negocios</a>
          </nav>
          <div className="nav-actions">
            {session ? (
              <button
                className="btn btn-dark"
                type="button"
                onClick={() => navigate(defaultPathForRoles(roles))}
              >
                Ir a mi cuenta ↗
              </button>
            ) : (
              <>
                <Link className="btn btn-light" to="/login">
                  Iniciar sesión
                </Link>
                <Link className="btn btn-dark" to="/login?mode=register">
                  Crear cuenta ↗
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="wrap hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-dot" aria-hidden="true">
                ★
              </span>{" "}
              Cada compra cuenta
            </div>
            <h1>
              Compra.
              <br />
              Acumula.
              <br />
              <span className="highlight">Gana más.</span>
            </h1>
            <p className="lead">
              {brandTagline}. Convierte tus compras de todos los días en loopoints y recompensas.
              Encuentra tus negocios favoritos y disfruta cada visita.
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
              <Link className="btn btn-red" to="/login?mode=register">
                Quiero registrarme →
              </Link>
              <a className="btn btn-light" href="#como-funciona">
                Así funciona ↓
              </a>
            </div>

            <div className="hero-stats" aria-label="Características clave">
              <div className="stat-chip">
                <span className="stat-chip-key">MODO</span>
                <strong>MULTI-NEGOCIO</strong>
              </div>
              <div className="stat-chip">
                <span className="stat-chip-key">CANJE</span>
                <strong>CÓDIGO QR</strong>
              </div>
              <div className="stat-chip">
                <span className="stat-chip-key">COSTO CLIENTE</span>
                <strong>100% GRATIS</strong>
              </div>
            </div>

            <div className="micro">
              UN SOLO LUGAR · MUCHOS NEGOCIOS · TUS LOOPOINTS POR SEPARADO
            </div>
          </div>

          <div className="hero-art">
            <div className="sun" aria-hidden="true" />
            <div className="pixel-star" aria-hidden="true">
              ✦
            </div>

            <div className="floating-toast" aria-hidden="true">
              <img src="/loopoint-coin.png" alt="" width={20} height={20} className="toast-coin" />
              <span>{activeBiz.bonusToast}</span>
            </div>

            <div
              className="pixel-window"
              role="region"
              aria-label="Vista previa de tarjeta de jugador"
            >
              <div className="window-bar">
                <span className="window-title">
                  <span className="window-led" aria-hidden="true" /> PLAYER CARD
                </span>
                <span className="window-hearts" aria-hidden="true">
                  <PixelHeartIcon />
                  <PixelHeartIcon />
                  <PixelHeartIcon />
                </span>
              </div>

              <div className="window-body">
                <div className="biz-tabs" role="tablist" aria-label="Negocios de ejemplo">
                  {demoBusinesses.map((biz, idx) => (
                    <button
                      key={biz.id}
                      id={`biz-tab-${biz.id}`}
                      type="button"
                      role="tab"
                      aria-selected={idx === selectedBizIndex}
                      aria-controls="biz-tabpanel"
                      className={`biz-tab ${idx === selectedBizIndex ? "active" : ""}`}
                      onClick={() => setSelectedBizIndex(idx)}
                    >
                      {biz.name}
                    </button>
                  ))}
                </div>

                <div id="biz-tabpanel" role="tabpanel" aria-labelledby={`biz-tab-${activeBiz.id}`}>
                  <div className="hud-meta">
                    <span className="points-label">TU SALDO EN {activeBiz.name.toUpperCase()}</span>
                    <span className="level-pill">{activeBiz.badge}</span>
                  </div>

                  <div className="points-row">
                    <img
                      src="/loopoint-coin.png"
                      alt=""
                      width={42}
                      height={42}
                      className="points-coin"
                      aria-hidden="true"
                    />
                    <div className="points">{activeBiz.points}</div>
                  </div>

                  <div className="mono progress-caption">¡ESTÁS CERCA DE TU PREMIO!</div>
                  <div className="progress" aria-hidden="true">
                    <span style={{ width: `${activeBiz.progressPct}%` }} />
                  </div>
                  <div className="progress-footer mono">
                    <span>{activeBiz.remainingText}</span>
                    <strong>{activeBiz.progressPct}%</strong>
                  </div>

                  <div className="reward">
                    <div className="gift" aria-hidden="true">
                      {activeBiz.rewardIcon}
                    </div>
                    <div className="reward-info">
                      <span className="reward-tag">PRÓXIMO CANJE</span>
                      <strong>{activeBiz.rewardTitle}</strong>
                      <small>{activeBiz.rewardCost}</small>
                    </div>
                  </div>
                </div>

                <div className="mono window-footnote">
                  Ejemplo interactivo. Tus puntos reales aparecen al iniciar sesión.
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="ticker" aria-hidden="true">
          <div className="ticker-track">
            <span>★ SUMA PUNTOS</span>
            <span>✦ DESCUBRE PREMIOS</span>
            <span>★ VUELVE A COMPRAR</span>
            <span>✦ SALDO POR NEGOCIO</span>
            <span>★ CANJEA CON QR</span>
            <span>✦ SUMA PUNTOS</span>
            <span>★ DESCUBRE PREMIOS</span>
            <span>✦ VUELVE A COMPRAR</span>
          </div>
        </div>

        <section id="como-funciona" className="wrap retro-section">
          <div className="section-head">
            <div className="kicker">TRES PASOS · CERO COMPLICACIONES</div>
            <h2>
              Tu próxima recompensa
              <br />
              está más cerca.
            </h2>
            <p>
              Usa el QR de tu compra para sumar puntos. Consulta tu saldo y canjea premios desde tu
              cuenta.
            </p>
          </div>
          <div className="steps">
            {steps.map((step) => (
              <article className="step" key={step.num}>
                <div className="step-bar">
                  <span className="step-num">{step.num}</span>
                  <span className="step-xp">{step.xp}</span>
                </div>
                <div className="step-icon-box" aria-hidden="true">
                  {step.icon}
                </div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="dual retro-section" id="clientes">
          <div className="wrap">
            <div className="section-head">
              <div className="kicker">SELECT YOUR MODE · DOS FORMAS DE SUMAR</div>
              <h2>
                Una plataforma.
                <br />
                Dos experiencias.
              </h2>
              <p>Participa como cliente o crea un programa para tu negocio.</p>
            </div>
            <div className="audience-grid">
              <article className="audience customer">
                <div className="audience-top">
                  <span className="tag">PARA CLIENTES</span>
                  <span className="player-tag">PLAYER 1</span>
                </div>
                <h2>Que cada compra te dé algo más.</h2>
                <p>
                  Reúne tus puntos en una sola cuenta. Mantén separado el saldo de cada negocio.
                </p>
                <ul className="pixel-list">
                  <li>Consulta puntos y vencimientos.</li>
                  <li>Revisa compras y movimientos.</li>
                  <li>Canjea premios con un QR.</li>
                </ul>
                <Link className="btn" to="/login?mode=register">
                  Crear cuenta de cliente ↗
                </Link>
                <div className="decor" aria-hidden="true">
                  ★
                </div>
              </article>

              <article className="audience business" id="negocios">
                <div className="audience-top">
                  <span className="tag">PARA NEGOCIOS</span>
                  <span className="player-tag">PLAYER 2</span>
                </div>
                <h2>Haz que quieran volver.</h2>
                <p>Crea un programa de fidelización con reglas y recompensas propias.</p>
                <ul className="pixel-list">
                  <li>Configura puntos y vencimientos.</li>
                  <li>Publica premios y campañas.</li>
                  <li>Controla canjes y presupuesto.</li>
                </ul>
                <Link className="btn" to="/business/register">
                  Registrar mi negocio ↗
                </Link>
                <div className="decor" aria-hidden="true">
                  ❖
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="wrap retro-section">
          <div className="section-head">
            <div className="kicker">INVENTARIO · TODO EN TU CUENTA</div>
            <h2>
              Más control.
              <br />
              Mejores recompensas.
            </h2>
            <p>Consulta la información de tus programas desde un solo lugar.</p>
          </div>
          <div className="features">
            {features.map((feature) => (
              <article className="feature" key={feature.title}>
                <div className="feature-top">
                  <div className="ico" aria-hidden="true">
                    {feature.ico}
                  </div>
                  <span className="feature-slot">{feature.slot}</span>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="wrap retro-section">
          <div className="cta">
            <div className="cta-screws" aria-hidden="true">
              <span />
              <span />
            </div>
            <div className="cta-coin-wrap" aria-hidden="true">
              <img src="/loopoint-coin.png" alt="" width={48} height={48} className="cta-coin" />
            </div>
            <div className="kicker cta-kicker">► INSERT COIN TO START ◄</div>
            <h2>Tu próxima compra puede tener premio.</h2>
            <p>Regístrate como cliente o crea el programa de fidelización de tu negocio.</p>
            <div className="hero-buttons cta-buttons">
              <Link className="btn btn-dark" to="/login?mode=register">
                Crear cuenta
              </Link>
              <Link className="btn btn-light" to="/business/register">
                Soy un negocio
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="retro-footer">
        <div className="wrap footer-inner">
          <Link className="brand" to="/" aria-label={`${brand}, ir al inicio`}>
            <span className="brand-mark" aria-hidden="true">
              <img src="/loopoint-coin.png" alt="" width={24} height={24} className="brand-coin" />
            </span>
            <span className="brand-text">
              {brand.toLowerCase()}
              <span className="brand-dot">.</span>
            </span>
          </Link>
          <span>© 2026 {brand.toUpperCase()} · SISTEMA DE FIDELIZACIÓN</span>
          <div className="footer-links">
            <a href="#como-funciona">Cómo funciona</a>
            <Link to="/login">Iniciar sesión</Link>
            <Link to="/business/register">Negocios</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
