import { Link, NavLink, Outlet } from "react-router-dom";
import { Home, QrCode, Sparkles, TicketCheck, Wrench } from "lucide-react";
import { Brand } from "@/components/shared/Brand";
import { LegalFooterLinks } from "@/features/legal/LegalFooterLinks";
import { Button } from "@/components/ui/button";
import { BusinessSwitcher } from "@/features/loyalty/BusinessSwitcher";
import { useOptionalBusinessContext } from "@/features/loyalty/businessContext";
import { useAuth } from "@/features/auth/AuthProvider";
import { usePortalTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";
import { PurchaseFab } from "./Fab";

type EncargadoNavItem = {
  to: string;
  label: string;
  shortLabel: string;
  icon: typeof Home;
  end?: boolean;
  featured?: boolean;
};

const navItems: EncargadoNavItem[] = [
  { to: "/encargado", label: "Inicio", shortLabel: "Inicio", icon: Home, end: true },
  {
    to: "/encargado/venta",
    label: "Generar venta",
    shortLabel: "Generar venta",
    icon: QrCode,
    featured: true,
  },
  {
    to: "/encargado/solicitudes",
    label: "Solicitudes de recompensa",
    shortLabel: "Solicitudes",
    icon: TicketCheck,
  },
];

export function EncargadoShell() {
  usePortalTheme("admin");
  const { roles } = useAuth();
  const businessContext = useOptionalBusinessContext();
  const isAdmin = businessContext?.selectedRole === "admin" || roles.includes("admin");

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header
        data-testid="app-header"
        className="z-30 shrink-0 border-b-[3px] border-[var(--lp-ink)] bg-[var(--lp-header-bg)] backdrop-blur-[6px] no-print"
      >
        <div className="mx-auto flex h-12 w-full max-w-[var(--lp-shell-max-w)] items-center justify-between gap-3 px-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <Brand compact linkTo="/encargado" />
          </div>

          <nav
            className="hidden items-center gap-1.5 md:flex"
            aria-label="Navegación del encargado"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-none border-2 font-mono font-bold uppercase tracking-wide transition-all duration-150",
                    item.featured
                      ? cn(
                          "min-h-10 px-3.5 py-2 text-[13px] shadow-[3px_3px_0_var(--lp-ink)]",
                          isActive
                            ? "border-[var(--lp-ink)] bg-[var(--lp-gold)] text-[#16262e]"
                            : "border-[var(--lp-ink)] bg-primary text-primary-foreground hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--lp-ink)]",
                        )
                      : cn(
                          "min-h-9 px-2.5 py-1.5 text-xs",
                          isActive
                            ? "border-[var(--lp-ink)] bg-[var(--lp-gold)] text-[#16262e] shadow-[var(--lp-shadow-sm)]"
                            : "border-transparent text-[var(--lp-ink-soft)] hover:border-[var(--lp-ink)] hover:bg-card hover:text-foreground hover:shadow-[var(--lp-shadow-sm)]",
                        ),
                  )
                }
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
                {item.featured && (
                  <Sparkles className="size-3.5 text-[var(--lp-gold)]" aria-hidden="true" />
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <BusinessSwitcher className="hidden md:flex" />
            {isAdmin && (
              <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
                <Link to="/admin">
                  <Wrench aria-hidden="true" />
                  Administrar
                </Link>
              </Button>
            )}
            <UserMenu compact />
          </div>
        </div>
        <div className="border-t-2 border-[var(--lp-ink)] px-4 py-1.5 md:hidden">
          <BusinessSwitcher />
        </div>
      </header>

      <main
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-pb-28 md:scroll-pb-14"
        id="contenido-principal"
      >
        <div className="mx-auto w-full max-w-[var(--lp-shell-max-w)] px-4 pb-24 pt-3 sm:px-5 md:py-4 md:pb-10">
          <Outlet />
          <LegalFooterLinks />
        </div>
      </main>

      <PurchaseFab />

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t-[3px] border-[var(--lp-ink)] bg-[var(--lp-header-bg)] pb-[env(safe-area-inset-bottom)] backdrop-blur-[6px] md:hidden no-print"
        aria-label="Navegación inferior"
      >
        <div className="grid grid-cols-3 gap-1.5 p-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-1 rounded-none border-2 py-2 font-mono text-[10px] font-bold uppercase transition-colors",
                    isActive
                      ? "border-[var(--lp-ink)] bg-[var(--lp-gold)] text-[#16262e] shadow-[2px_2px_0_var(--lp-ink)]"
                      : "border-transparent text-[var(--lp-ink-soft)] hover:border-[var(--lp-ink)] hover:bg-card hover:text-foreground",
                  )
                }
              >
                <Icon className="size-5" aria-hidden="true" />
                <span>{item.shortLabel}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
