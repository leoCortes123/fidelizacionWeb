import { useRef, useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation, type NavLinkRenderProps } from "react-router-dom";
import {
  ClipboardList,
  Gift,
  Home,
  LayoutGrid,
  Megaphone,
  Package,
  QrCode,
  ReceiptText,
  Settings2,
  TicketCheck,
  UserRound,
  Users,
} from "lucide-react";
import { Brand } from "@/components/shared/Brand";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useHideOnScroll } from "./useHideOnScroll";

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
    "flex min-h-11 items-center gap-3 rounded-none border-2 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wide transition-all duration-150",
    isActive
      ? "border-[var(--lp-ink)] bg-[var(--lp-gold)] text-[#16262e] shadow-[2px_2px_0_var(--lp-ink)]"
      : "border-transparent text-[var(--lp-ink-soft)] hover:border-[var(--lp-ink)] hover:bg-card hover:text-foreground hover:shadow-[2px_2px_0_var(--lp-ink)]",
  );
}

export function AdminShell({ children }: { children?: ReactNode }) {
  usePortalTheme("admin");
  const { pathname } = useLocation();
  const scrollRef = useRef<HTMLElement | null>(null);
  const headerHidden = useHideOnScroll(scrollRef);
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
      <aside className="hidden h-dvh w-64 shrink-0 flex-col border-r-[3px] border-[var(--lp-ink)] bg-[var(--lp-paper-deep)] md:flex">
        <div className="border-b-[3px] border-[var(--lp-ink)] bg-card p-4">
          <Brand
            name={headerBusinessName}
            tagline={headerBusinessName ? null : undefined}
            linkTo="/admin/dashboard"
          />
          <div className="mt-2.5 flex items-center gap-2">
            <Badge variant="default">ADMIN · NEGOCIO</Badge>
          </div>
        </div>

        <div className="p-3">
          <Button asChild className="w-full justify-start">
            <Link to="/admin/purchases/new">
              <QrCode aria-hidden="true" />
              Registrar venta
            </Link>
          </Button>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto p-3" aria-label="Panel del negocio">
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

        <div className="border-t-[3px] border-[var(--lp-ink)] bg-card p-3">
          <UserMenu />
        </div>
      </aside>

      <div className="flex h-dvh min-w-0 flex-1 flex-col">
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
          <div className="flex h-14 items-center justify-between gap-3 px-4">
            <div className="min-w-0 md:hidden">
              <Brand compact name={headerBusinessName} linkTo="/admin/dashboard" />
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
          <div className="border-t-2 border-[var(--lp-ink)] px-4 py-2 sm:hidden">
            <BusinessSwitcher />
          </div>
        </header>

        <main
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-pb-28 md:scroll-pb-10"
          id="contenido-principal"
        >
          <div className="mx-auto w-full max-w-6xl px-0 pb-28 pt-4 sm:px-6 md:py-6 md:pb-10">
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
        <DialogContent className="max-h-[85dvh]">
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
