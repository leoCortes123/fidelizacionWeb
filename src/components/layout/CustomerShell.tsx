import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Gift, Home, ReceiptText, Wrench } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthProvider";
import { usePortalTheme, useTheme } from "@/components/theme/ThemeProvider";
import { LoopointCoinSvg, PixelUserSvg } from "@/features/customer/pixelSprites";
import "@/features/customer/customerRetro.css";
import { cn } from "@/lib/utils";

export function CustomerShell() {
  usePortalTheme("customer");
  const { displayName, user, roles, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const firstName = displayName.trim().split(/\s+/)[0] || user?.email?.split("@")[0] || "Cliente";
  const isAdmin = roles.includes("admin");
  const isScrollablePage =
    pathname.startsWith("/customer/purchases") || pathname.startsWith("/customer/redemptions");

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut();
    toast.success("Sesión cerrada");
    navigate("/", { replace: true });
  }

  function renderNavLinks(idPrefix: string, linkClass: string, iconOnly = false) {
    const iconClass = iconOnly ? "size-[22px]" : "size-4";
    const labelClass = iconOnly ? "sr-only" : undefined;

    return (
      <>
        <NavLink
          to="/customer"
          end
          id={`${idPrefix}Home`}
          aria-label="Inicio"
          title="Inicio"
          className={({ isActive }) =>
            cn(linkClass, (isActive || pathname.startsWith("/customer/business/")) && "active")
          }
        >
          <Home className={iconClass} strokeWidth={2.25} aria-hidden="true" />
          <span className={labelClass}>Inicio</span>
        </NavLink>

        <NavLink
          to="/customer/purchases"
          id={`${idPrefix}Purchases`}
          aria-label="Compras"
          title="Compras"
          className={({ isActive }) => cn(linkClass, isActive && "active")}
        >
          <ReceiptText className={iconClass} strokeWidth={2.25} aria-hidden="true" />
          <span className={labelClass}>Compras</span>
        </NavLink>

        <NavLink
          to="/customer/redemptions"
          id={`${idPrefix}Redemptions`}
          aria-label="Canjes"
          title="Canjes"
          className={({ isActive }) => cn(linkClass, isActive && "active")}
        >
          <Gift className={iconClass} strokeWidth={2.25} aria-hidden="true" />
          <span className={labelClass}>Canjes</span>
        </NavLink>
      </>
    );
  }

  return (
    <div className="retro-customer">
      <header data-testid="app-header" className="app-navbar no-print">
        <div className="navbar-inner">
          <Link to="/customer" className="brand-link" title="Ir a Inicio">
            <div className="brand-logo-box" aria-hidden="true">
              <LoopointCoinSvg size={20} />
            </div>
            <span className="brand-name">
              fideliapp<span className="brand-dot">.</span>
            </span>
          </Link>

          <nav className="desktop-nav-bar" aria-label="Navegación del cliente">
            {renderNavLinks("desktopNavBtn", "desktop-nav-btn")}
          </nav>

          <div className="user-menu-cluster" ref={dropdownRef}>
            {isAdmin && (
              <Link to="/admin" className="pixel-btn pixel-btn-secondary px-2.5 py-1.5 text-[11px]">
                <Wrench className="size-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Administrar</span>
                <span className="sm:hidden">Admin</span>
              </Link>
            )}
            <span className="navbar-username" id="navbarUsernameText">
              {firstName}
            </span>
            <button
              type="button"
              className="small-dropdown-btn"
              id="btnDropdownToggle"
              aria-label="Abrir menú de configuración"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-controls="navDropdownMenu"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <PixelUserSvg size={16} />
            </button>

            <div
              className={cn("dropdown-menu", menuOpen && "open")}
              id="navDropdownMenu"
              role="menu"
              aria-label="Menú de usuario"
            >
              <button
                type="button"
                role="menuitem"
                className="dropdown-item"
                id="btnProfileOption"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/customer/perfil");
                }}
              >
                <PixelUserSvg size={16} />
                <span>Perfil</span>
              </button>

              <button
                type="button"
                role="menuitem"
                className="dropdown-item"
                id="btnToggleTheme"
                onClick={() => {
                  toggleTheme();
                  setMenuOpen(false);
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 12 12"
                  shapeRendering="crispEdges"
                  aria-hidden="true"
                >
                  <rect x="3" y="1" width="6" height="2" fill="#fad24b" />
                  <rect x="2" y="3" width="6" height="6" fill="#fad24b" />
                  <rect x="3" y="9" width="6" height="2" fill="#fad24b" />
                </svg>
                <span>{theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}</span>
              </button>

              <button
                type="button"
                role="menuitem"
                className="dropdown-item danger"
                id="btnLogoutOption"
                onClick={() => void handleSignOut()}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 12 12"
                  shapeRendering="crispEdges"
                  aria-hidden="true"
                >
                  <rect x="2" y="2" width="5" height="8" fill="currentColor" />
                  <polygon points="7,4 11,6 7,8" fill="currentColor" />
                </svg>
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main
        id="contenido-principal"
        className={cn("main-container", isScrollablePage && "scrollable-page")}
      >
        <Outlet />
      </main>

      <nav className="bottom-app-bar no-print" aria-label="Navegación del cliente">
        <div className="bottom-bar-inner">{renderNavLinks("navBtn", "bottom-nav-btn", true)}</div>
      </nav>
    </div>
  );
}
