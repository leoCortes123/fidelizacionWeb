import { useRef } from "react";
import { Link, NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { Home, ReceiptText, TicketCheck, Wrench } from "lucide-react";
import { Brand } from "@/components/shared/Brand";
import { Button } from "@/components/ui/button";
import { BusinessSwitcher } from "@/features/loyalty/BusinessSwitcher";
import { useOptionalBusinessContext } from "@/features/loyalty/businessContext";
import { useAuth } from "@/features/auth/AuthProvider";
import { usePortalTheme } from "@/components/theme/ThemeProvider";
import "@/features/customer/customerRetro.css";
import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";
import { useHideOnScroll } from "./useHideOnScroll";

const navItems = [
  { to: "/customer", label: "Inicio", icon: Home, end: true },
  { to: "/customer/purchases", label: "Compras", icon: ReceiptText },
  { to: "/customer/redemptions", label: "Canjes", icon: TicketCheck },
];

export function CustomerShell() {
  usePortalTheme("customer");
  const { roles } = useAuth();
  const { pathname } = useLocation();
  const { businessId } = useParams();
  const businessContext = useOptionalBusinessContext();
  const routeBusinessName = businessId
    ? businessContext?.businesses.find((business) => business.id === businessId)?.name
    : undefined;
  const headerBusinessName =
    routeBusinessName ??
    businessContext?.selectedBusiness?.name ??
    businessContext?.businesses[0]?.name;
  const scrollRef = useRef<HTMLElement | null>(null);
  const headerHidden = useHideOnScroll(scrollRef);
  const isAdmin = roles.includes("admin");

  return (
    <div className="retro-customer flex h-dvh flex-col overflow-hidden">
      <header
        data-testid="app-header"
        inert={headerHidden || undefined}
        aria-hidden={headerHidden || undefined}
        className={cn(
          "z-30 shrink-0 overflow-hidden border-b-[3px] border-[var(--line)] bg-[var(--header-bg)] backdrop-blur transition-[max-height,transform,opacity] duration-300 ease-out no-print",
          headerHidden
            ? "invisible pointer-events-none max-h-0 -translate-y-full border-transparent opacity-0"
            : "max-h-40 opacity-100",
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-3 px-3 sm:px-6">
          <Brand
            linkTo="/customer"
            name={headerBusinessName}
            tagline={headerBusinessName ? null : undefined}
          />
          <nav className="hidden items-center gap-2 md:flex" aria-label="Navegación del cliente">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "border-2 px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wide transition-all duration-150",
                    isActive
                      ? "border-[var(--line)] bg-[var(--ink)] text-[var(--paper)] shadow-[2px_2px_0_var(--red)]"
                      : "border-transparent text-[var(--ink)] hover:border-[var(--line)] hover:bg-[var(--cream)] hover:shadow-[2px_2px_0_var(--shadow-ink)]",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <BusinessSwitcher className="hidden md:flex" linkToCustomerHome />
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="inline-flex border-2 border-[var(--line)] bg-[var(--cream)] text-[var(--ink)] shadow-[2px_2px_0_var(--shadow-ink)]"
              >
                <Link to="/admin">
                  <Wrench aria-hidden="true" />
                  <span className="hidden sm:inline">Administrar</span>
                  <span className="sm:hidden">Admin</span>
                </Link>
              </Button>
            )}
            <UserMenu compact />
          </div>
        </div>
        <div className="border-t-2 border-[var(--dash-line)] bg-[var(--cream)] px-3 py-2 md:hidden">
          <BusinessSwitcher linkToCustomerHome />
        </div>
      </header>

      <main
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-clip overscroll-contain scroll-pb-28 md:scroll-pb-14"
        id="contenido-principal"
      >
        <div className="mx-auto w-full max-w-5xl px-3 pb-24 pt-4 sm:px-6 md:py-6 md:pb-14">
          <Outlet />
        </div>
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t-[3px] border-[var(--line)] bg-[var(--nav-bg)] pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden no-print"
        aria-label="Navegación inferior"
      >
        <div className="grid grid-cols-3 gap-1.5 p-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.end
              ? pathname === item.to
              : pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-1 border-2 py-1.5 font-mono text-[11px] font-semibold uppercase transition-colors",
                  active
                    ? "border-[var(--line)] bg-[var(--red)] text-white shadow-[2px_2px_0_var(--shadow-ink)]"
                    : "border-transparent text-[var(--ink-soft)] hover:border-[var(--line)] hover:bg-[var(--paper)] hover:text-[var(--ink)]",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
