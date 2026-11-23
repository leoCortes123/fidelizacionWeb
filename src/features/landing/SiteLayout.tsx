import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { InstallPwaButton } from "@/components/pwa/InstallPwaButton";
import { useAuth } from "@/features/auth/AuthProvider";
import { EatersBackground } from "@/features/landing/EatersBackground";
import { PixelCloseIcon, PixelMenuIcon } from "@/features/landing/PixelIcons";
import { ThemeToggleButton } from "@/features/landing/ThemeToggleButton";
import { brandName, defaultPathForRoles } from "@/lib/config";
import { resolvePostLoginPath } from "@/lib/postLogin";
import "./LandingPage.css";

export const REGISTER_BUSINESS = "/admin/onboarding?new=1";

export function Brand({ brand, size = 26 }: { brand: string; size?: number }) {
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

const navItems = [
  { to: "/", label: "Inicio", end: true },
  { to: "/como-funciona", label: "Cómo funciona" },
  { to: "/funciones", label: "Funciones" },
  { to: "/precios", label: "Precios" },
  { to: "/preguntas", label: "Preguntas" },
];

export function SiteLayout({ children }: { children: ReactNode }) {
  const brand = brandName || "Fideliapp";
  const { session, roles, rolesLoading = false, rolesLoaded = true } = useAuth();
  const navigate = useNavigate();
  const [navigatingAccount, setNavigatingAccount] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);
  const { pathname, hash } = useLocation();

  useEffect(() => {
    setMenuOpen(false);
    if (!hash && typeof window !== "undefined") {
      window.scrollTo?.({ top: 0, behavior: "auto" });
    }
  }, [pathname, hash]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuBtnRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

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

          <nav className="navlinks" aria-label="Navegación principal">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? "navlink-active" : undefined)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="nav-actions">
            <ThemeToggleButton />
            <InstallPwaButton
              className="btn btn-download btn-xs nav-download"
              label="Descargar app"
            />
            {session ? (
              <button
                className="btn btn-dark btn-xs nav-account-btn"
                type="button"
                disabled={navigatingAccount || rolesLoading || !rolesLoaded}
                onClick={goToAccount}
              >
                <span className="nav-account-full">Ir a mi cuenta</span>
                <span className="nav-account-short" aria-hidden="true">
                  Cuenta
                </span>{" "}
                ↗
              </button>
            ) : (
              <Link className="btn btn-light btn-xs" to="/login">
                Ingresar
              </Link>
            )}
            <button
              ref={menuBtnRef}
              type="button"
              className="btn btn-light btn-xs nav-menu-btn"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              {menuOpen ? <PixelCloseIcon size={16} /> : <PixelMenuIcon size={16} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav id="mobile-nav-drawer" className="mobile-nav-drawer" aria-label="Menú móvil">
            <div className="wrap mobile-nav-list">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `mobile-nav-item ${isActive ? "mobile-nav-active" : ""}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="mobile-nav-ctas">
                <Link
                  className="btn btn-primary btn-sm"
                  to={REGISTER_BUSINESS}
                  onClick={() => setMenuOpen(false)}
                >
                  Crear mi programa
                </Link>
                <Link
                  className="btn btn-light btn-sm"
                  to="/login?mode=register"
                  onClick={() => setMenuOpen(false)}
                >
                  Soy cliente
                </Link>
              </div>
            </div>
          </nav>
        )}
      </header>

      <main id="contenido">{children}</main>

      <footer className="retro-footer">
        <div className="wrap footer-grid">
          <div className="footer-brand-col">
            <Brand brand={brand} size={26} />
            <p className="footer-desc">
              Software de fidelización y programa de puntos con QR para negocios locales en
              Colombia.
            </p>
          </div>

          <nav className="footer-col" aria-label="Páginas del sitio">
            <h2 className="footer-heading">Explorar</h2>
            <Link to="/">Inicio</Link>
            <Link to="/como-funciona">Cómo funciona</Link>
            <Link to="/funciones">Funciones y roadmap</Link>
            <Link to="/precios">Planes y precios</Link>
            <Link to="/preguntas">Preguntas frecuentes</Link>
          </nav>

          <nav className="footer-col" aria-label="Accesos a la aplicación">
            <h2 className="footer-heading">Plataforma</h2>
            <Link to={REGISTER_BUSINESS}>Registrar negocio</Link>
            <Link to="/login">Iniciar sesión</Link>
            <Link to="/login?mode=register">Crear cuenta de cliente</Link>
          </nav>
        </div>
        <div className="wrap footer-bottom">
          <span>© 2026 {brand.toUpperCase()} · SOFTWARE DE FIDELIZACIÓN DE CLIENTES</span>
        </div>
      </footer>

      <div className="mobile-cta" role="region" aria-label="Acciones rápidas">
        <InstallPwaButton className="btn btn-download" label="Descargar app" />
        <Link className="btn btn-primary" to={REGISTER_BUSINESS}>
          Crear programa
        </Link>
      </div>
    </div>
  );
}
