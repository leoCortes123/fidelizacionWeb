import { useRef } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Home, ReceiptText, TicketCheck, Wrench } from "lucide-react";
import { Brand } from "@/components/shared/Brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BusinessSwitcher } from "@/features/loyalty/BusinessSwitcher";
import { useOptionalBusinessContext } from "@/features/loyalty/businessContext";
import { useAuth } from "@/features/auth/AuthProvider";
import { usePortalTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";
import { PurchaseFab } from "./Fab";
import { useHideOnScroll } from "./useHideOnScroll";

type EncargadoNavItem = {
  to: string;
  label: string;
  shortLabel: string;
  icon: typeof Home;
  end?: boolean;
};

const navItems: EncargadoNavItem[] = [
  { to: "/encargado", label: "Inicio", shortLabel: "Inicio", icon: Home, end: true },
  {
    to: "/encargado/venta",
    label: "Generar venta",
    shortLabel: "Generar venta",
    icon: ReceiptText,
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
  const headerBusinessName =
    businessContext?.selectedBusiness?.name ??
    businessContext?.businesses.find((business) => business.role === "encargado")?.name ??
    businessContext?.businesses[0]?.name;
  const scrollRef = useRef<HTMLElement | null>(null);
  const headerHidden = useHideOnScroll(scrollRef);
  const isAdmin = businessContext?.selectedRole === "admin" || roles.includes("admin");

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header
        data-testid="app-header"
        inert={headerHidden || undefined}
        aria-hidden={headerHidden || undefined}
        className={cn(
          "z-30 shrink-0 overflow-hidden border-b-[3px] border-[var(--lp-ink)] bg-[var(--lp-header-bg)] backdrop-blur-[6px] transition-[max-height,transform,opacity] duration-300 ease-out no-print",
          headerHidden
            ? "invisible pointer-events-none max-h-0 -translate-y-full border-transparent opacity-0"
            : "max-h-40 opacity-100",
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Brand
              compact
              className="sm:hidden"
              linkTo="/encargado"
              name={headerBusinessName}
              tagline={headerBusinessName ? null : undefined}
            />
            <Brand
              className="hidden sm:flex"
              linkTo="/encargado"
              name={headerBusinessName}
              tagline={headerBusinessName ? null : undefined}
            />
            <Badge variant="default" className="hidden sm:inline-flex text-[10px]">
              ENCARGADO · NEGOCIO
            </Badge>
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
                    "flex items-center gap-2 rounded-none border-2 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wide transition-all duration-150",
                    isActive
                      ? "border-[var(--lp-ink)] bg-[var(--lp-gold)] text-[#16262e] shadow-[2px_2px_0_var(--lp-ink)]"
                      : "border-transparent text-[var(--lp-ink-soft)] hover:border-[var(--lp-ink)] hover:bg-card hover:text-foreground hover:shadow-[2px_2px_0_var(--lp-ink)]",
                  )
                }
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
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
        <div className="border-t-2 border-[var(--lp-ink)] px-4 py-2 md:hidden">
          <BusinessSwitcher />
        </div>
      </header>

      <main
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-pb-28 md:scroll-pb-14"
        id="contenido-principal"
      >
        <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-4 sm:px-6 md:py-6 md:pb-14">
          <Outlet />
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
