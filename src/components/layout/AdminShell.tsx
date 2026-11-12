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
    "flex min-h-11 items-center gap-3 rounded-none px-3 py-2 text-sm font-semibold transition-all duration-150",
    isActive
      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
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
    <div className="flex h-dvh overflow-hidden bg-background">
      <aside className="hidden h-dvh w-64 shrink-0 flex-col border-r border-border/80 bg-card/95 backdrop-blur-sm md:flex dark:border-slate-800">
        <div className="border-b border-border/70 bg-muted/30 p-4 dark:border-slate-800">
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
              Registrar compra
            </Link>
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Panel del negocio">
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

        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          <UserMenu />
        </div>
      </aside>

      <div className="flex h-dvh min-w-0 flex-1 flex-col">
        <header
          data-testid="app-header"
          inert={headerHidden || undefined}
          aria-hidden={headerHidden || undefined}
          className={cn(
            "z-30 shrink-0 overflow-hidden border-b border-border/80 bg-card/85 backdrop-blur-md transition-[max-height,transform,opacity] duration-300 ease-out no-print dark:border-slate-800",
            headerHidden
              ? "invisible pointer-events-none max-h-0 -translate-y-full border-transparent opacity-0"
              : "max-h-40 opacity-100",
          )}
        >
          <div className="flex h-14 items-center justify-between gap-3 px-4">
            <div className="min-w-0 md:hidden">
              <Brand compact name={headerBusinessName} linkTo="/admin/dashboard" />
            </div>
            <p className="hidden items-center gap-2 font-mono text-xs font-medium text-muted-foreground md:flex">
              <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
              {headerBusinessName ? `${headerBusinessName} · ` : ""}CAJA ACTIVA · {dateLabel}
            </p>
            <div className="flex items-center gap-2">
              <BusinessSwitcher className="hidden sm:flex" />
              <UserMenu compact />
            </div>
          </div>
          <div className="border-t border-border/70 px-4 py-2 sm:hidden dark:border-slate-800">
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
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden no-print dark:border-slate-800"
        aria-label="Navegación del negocio"
      >
        <div className="grid grid-cols-5 p-1.5 gap-1">
          {bottomNav.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item, pathname);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-none px-1 py-1.5 text-[10px] font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
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
            className="flex min-h-12 cursor-pointer flex-col items-center justify-center gap-1 rounded-none px-1 py-1.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
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
              className="flex items-center gap-3 rounded-none border p-3 text-sm font-semibold hover:bg-muted"
            >
              <QrCode className="size-4 text-primary" aria-hidden="true" />
              Registrar compra
            </Link>
            {moreNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 rounded-none border p-3 text-sm font-semibold hover:bg-muted"
                >
                  <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
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
