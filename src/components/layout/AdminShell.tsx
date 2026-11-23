import { useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation, type NavLinkRenderProps } from "react-router-dom";
import {
  ArrowRight,
  ClipboardList,
  Gift,
  Home,
  LayoutGrid,
  Megaphone,
  Package,
  QrCode,
  ReceiptText,
  Settings2,
  Sparkles,
  TicketCheck,
  UserRound,
  Users,
} from "lucide-react";
import { Brand } from "@/components/shared/Brand";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BusinessSwitcher } from "@/features/loyalty/BusinessSwitcher";
import { useOptionalBusinessContext } from "@/features/loyalty/businessContext";
import { usePortalTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";
import { PurchaseFab } from "./Fab";

type AdminNavItem = {
  to: string;
  label: string;
  shortLabel?: string;
  icon: typeof Home;
  end?: boolean;
};

const mainNav: AdminNavItem[] = [
  { to: "/admin/dashboard", label: "Inicio", icon: Home, end: true },
  { to: "/admin/products", label: "Carta", icon: Package },
  { to: "/admin/rewards", label: "Recompensas", icon: Gift },
  { to: "/admin/members", label: "Miembros", icon: UserRound },
  { to: "/admin/redemptions", label: "Solicitudes", icon: TicketCheck },
  { to: "/admin/purchases", label: "Ventas", icon: ReceiptText, end: true },
  { to: "/admin/customers", label: "Clientes", icon: Users },
  { to: "/admin/campaigns", label: "Campañas", icon: Megaphone },
  { to: "/admin/audit", label: "Auditoría", icon: ClipboardList },
  { to: "/admin/perfil", label: "Mi perfil", icon: Settings2 },
];

const moreNav: AdminNavItem[] = [
  { to: "/admin/members", label: "Miembros", icon: UserRound },
  { to: "/admin/purchases", label: "Ventas", icon: ReceiptText, end: true },
  { to: "/admin/customers", label: "Clientes", icon: Users },
  { to: "/admin/campaigns", label: "Campañas", icon: Megaphone },
  { to: "/admin/audit", label: "Auditoría", icon: ClipboardList },
  { to: "/admin/perfil", label: "Mi perfil", icon: Settings2 },
];

const bottomNav: AdminNavItem[] = [
  { to: "/admin/dashboard", label: "Inicio", icon: Home, end: true },
  { to: "/admin/products", label: "Carta", icon: Package },
  { to: "/admin/rewards", label: "Recompensas", icon: Gift },
  { to: "/admin/redemptions", label: "Solicitudes", shortLabel: "Solicitudes", icon: TicketCheck },
];

function isItemActive(item: AdminNavItem, pathname: string) {
  if (item.end) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

function navClass(isActive: boolean) {
  return cn(
    "flex min-h-9 items-center gap-2.5 rounded-none border-2 px-2.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wide transition-all duration-150",
    isActive
      ? "border-[var(--lp-ink)] bg-[var(--lp-gold)] text-[#16262e] shadow-[var(--lp-shadow-sm)]"
      : "border-transparent text-[var(--lp-ink-soft)] hover:border-[var(--lp-ink)] hover:bg-card hover:text-foreground hover:shadow-[var(--lp-shadow-sm)]",
  );
}

export function AdminShell({ children }: { children?: ReactNode }) {
  usePortalTheme("admin");
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const businessContext = useOptionalBusinessContext();
  const headerBusinessName =
    businessContext?.selectedBusiness?.name ??
    businessContext?.businesses.find((business) => business.role === "admin")?.name ??
    businessContext?.businesses[0]?.name;

  const dateLabel = new Date().toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex h-dvh overflow-hidden">
      <aside className="hidden h-dvh w-56 shrink-0 flex-col border-r-[3px] border-[var(--lp-ink)] bg-[var(--lp-paper-deep)] md:flex xl:w-60">
        <div className="border-b-[3px] border-[var(--lp-ink)] bg-card px-3 py-3">
          <Brand compact linkTo="/admin/dashboard" />
        </div>

        <div className="px-2.5 py-3">
          <Button
            asChild
            className="group h-auto min-h-[46px] w-full justify-between gap-2 border-[3px] border-[var(--lp-ink)] bg-primary px-3 py-2.5 text-[15px] font-extrabold text-primary-foreground shadow-[4px_4px_0_var(--lp-ink)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--lp-ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_var(--lp-ink)]"
          >
            <Link to="/admin/purchases/new">
              <span className="flex items-center gap-2.5">
                <span className="grid size-7 shrink-0 place-items-center border-2 border-[var(--lp-ink)] bg-[var(--lp-gold)] text-[#16262e] shadow-[2px_2px_0_var(--lp-ink)]">
                  <QrCode className="size-4" aria-hidden="true" />
                </span>
                <span className="flex items-center gap-1.5">
                  Registrar venta
                  <Sparkles
                    className="size-3.5 text-[var(--lp-gold)] transition-transform group-hover:scale-110"
                    aria-hidden="true"
                  />
                </span>
              </span>
              <ArrowRight
                className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </Button>
        </div>

        <nav
          className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-1.5"
          aria-label="Panel del negocio"
        >
          {mainNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }: NavLinkRenderProps) => navClass(isActive)}
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div className="flex h-dvh min-w-0 flex-1 flex-col">
        <header
          data-testid="app-header"
          className="z-30 shrink-0 border-b-[3px] border-[var(--lp-ink)] bg-[var(--lp-header-bg)] backdrop-blur-[6px] no-print"
        >
          <div className="flex h-12 items-center justify-between gap-3 px-4">
            <div className="min-w-0 md:hidden">
              <Brand compact linkTo="/admin/dashboard" />
            </div>
            <p className="hidden items-center gap-2 font-mono text-xs font-semibold uppercase text-[var(--lp-ink-soft)] md:flex">
              <span
                className="size-2.5 border border-[var(--lp-ink)] bg-[var(--lp-green-badge)]"
                aria-hidden="true"
              />
              {headerBusinessName ? `${headerBusinessName} · ` : ""}CAJA ACTIVA · {dateLabel}
            </p>
            <div className="flex items-center gap-2">
              <BusinessSwitcher className="hidden sm:flex" />
              <UserMenu compact />
            </div>
          </div>
          <div className="border-t-2 border-[var(--lp-ink)] px-4 py-1.5 sm:hidden">
            <BusinessSwitcher />
          </div>
        </header>

        <main
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-pb-28 md:scroll-pb-10"
          id="contenido-principal"
        >
          <div className="mx-auto w-full max-w-[var(--lp-shell-max-w)] px-0 pb-28 pt-3 sm:px-5 md:py-4 md:pb-8">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>

      <PurchaseFab />

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t-[3px] border-[var(--lp-ink)] bg-[var(--lp-header-bg)] pb-[env(safe-area-inset-bottom)] backdrop-blur-[6px] md:hidden no-print"
        aria-label="Navegación del negocio"
      >
        <div className="grid grid-cols-5 gap-1 p-1.5">
          {bottomNav.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item, pathname);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-none border-2 px-1 py-1.5 font-mono text-[10px] font-bold uppercase transition-colors",
                  active
                    ? "border-[var(--lp-ink)] bg-[var(--lp-gold)] text-[#16262e] shadow-[2px_2px_0_var(--lp-ink)]"
                    : "border-transparent text-[var(--lp-ink-soft)] hover:border-[var(--lp-ink)] hover:bg-card hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="max-w-full truncate">{item.shortLabel ?? item.label}</span>
              </NavLink>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            className="flex min-h-12 cursor-pointer flex-col items-center justify-center gap-1 rounded-none border-2 border-transparent px-1 py-1.5 font-mono text-[10px] font-bold uppercase text-[var(--lp-ink-soft)] transition-colors hover:border-[var(--lp-ink)] hover:bg-card hover:text-foreground"
            aria-label="Más opciones"
          >
            <LayoutGrid className="size-4" aria-hidden="true" />
            Más
          </button>
        </div>
      </nav>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Más opciones</DialogTitle>
            <DialogDescription>Accesos del negocio.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Link
              to="/admin/purchases/new"
              onClick={() => setMoreOpen(false)}
              className="flex items-center gap-3 rounded-none border-2 border-[var(--lp-ink)] bg-[var(--lp-gold-soft)] p-3 font-mono text-sm font-bold text-[#16262e] shadow-[2px_2px_0_var(--lp-ink)] hover:bg-[var(--lp-gold)]"
            >
              <QrCode className="size-4" aria-hidden="true" />
              Registrar venta
            </Link>
            {moreNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 rounded-none border-2 border-[var(--lp-ink)] bg-secondary p-3 font-mono text-sm font-semibold shadow-[2px_2px_0_var(--lp-ink)] hover:bg-[var(--lp-gold)] hover:text-[#16262e]"
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
