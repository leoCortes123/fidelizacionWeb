import { useRef } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, ReceiptText, TicketCheck, Wrench } from "lucide-react";
import { Brand } from "@/components/shared/Brand";
import { Button } from "@/components/ui/button";
import { BusinessSwitcher } from "@/features/loyalty/BusinessSwitcher";
import { useAuth } from "@/features/auth/AuthProvider";
import { usePortalTheme } from "@/components/theme/ThemeProvider";
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
  const scrollRef = useRef<HTMLElement | null>(null);
  const headerHidden = useHideOnScroll(scrollRef);
  const isAdmin = roles.includes("admin");

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <header
        data-testid="app-header"
        className={cn(
          "z-30 shrink-0 overflow-hidden border-b border-slate-300 bg-card/95 backdrop-blur transition-all duration-300 ease-out no-print dark:border-slate-800",
          headerHidden
            ? "max-h-0 -translate-y-full border-transparent opacity-0"
            : "max-h-40 opacity-100",
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-3 px-4">
          <Brand linkTo="/customer" />
          <nav className="hidden items-center gap-1.5 md:flex" aria-label="Navegación del cliente">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-md border px-3.5 py-2 text-sm font-bold transition-all",
                    isActive
                      ? "border-slate-900 bg-primary text-primary-foreground shadow-[0_2px_0_#0f172a] dark:border-slate-200"
                      : "border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground",
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
        <div className="border-t border-slate-200 px-4 py-2 md:hidden dark:border-slate-800">
          <BusinessSwitcher linkToCustomerHome />
        </div>
      </header>

      <main
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        id="contenido-principal"
      >
        <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 md:pb-14">
          <Outlet />
        </div>
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-slate-900 bg-card/98 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden no-print dark:border-slate-700"
        aria-label="Navegación inferior"
      >
        <div className="grid grid-cols-3 p-1">
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
                  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-bold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-[0_2px_0_#0f172a]"
                    : "text-muted-foreground hover:text-foreground",
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
