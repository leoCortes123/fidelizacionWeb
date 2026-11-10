import { useRef, useState } from "react";
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
  { to: "/admin/members", label: "Equipo", icon: UserRound },
  { to: "/admin/redemptions", label: "Solicitudes", icon: TicketCheck },
  { to: "/admin/purchases", label: "Compras", icon: ReceiptText, end: true },
  { to: "/admin/customers", label: "Clientes", icon: Users },
  { to: "/admin/campaigns", label: "Campañas", icon: Megaphone },
  { to: "/admin/audit", label: "Auditoría", icon: ClipboardList },
  { to: "/admin/perfil", label: "Mi perfil", icon: Settings2 },
];

const moreNav: AdminNavItem[] = [
  { to: "/admin/members", label: "Equipo", icon: UserRound },
  { to: "/admin/purchases", label: "Compras", icon: ReceiptText, end: true },
  { to: "/admin/customers", label: "Clientes", icon: Users },
  { to: "/admin/campaigns", label: "Campañas", icon: Megaphone },
  { to: "/admin/audit", label: "Auditoría", icon: ClipboardList },
  { to: "/admin/perfil", label: "Mi perfil", icon: Settings2 },
];

const bottomNav: AdminNavItem[] = [
  { to: "/admin/dashboard", label: "Inicio", icon: Home, end: true },
  { to: "/admin/products", label: "Carta", icon: Package },
  { to: "/admin/rewards", label: "Recompensas", shortLabel: "Premios", icon: Gift },
  { to: "/admin/redemptions", label: "Solicitudes", shortLabel: "Solicitudes", icon: TicketCheck },
];

function isItemActive(item: AdminNavItem, pathname: string) {
  if (item.end) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

function navClass(isActive: boolean) {
  return cn(
    "flex min-h-11 items-center gap-3 rounded-md border px-3 py-2 text-sm font-bold transition-all",
    isActive
      ? "border-slate-900 bg-primary text-primary-foreground shadow-[0_2px_0_#0f172a] dark:border-slate-200"
      : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/80 hover:text-foreground",
  );
}

export function AdminShell() {
  usePortalTheme("admin");
  const { pathname } = useLocation();
  const scrollRef = useRef<HTMLElement | null>(null);
  const headerHidden = useHideOnScroll(scrollRef);
  const [moreOpen, setMoreOpen] = useState(false);

  const dateLabel = new Date().toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <aside className="hidden h-dvh w-64 shrink-0 flex-col border-r-2 border-slate-300 bg-card md:flex dark:border-slate-800">
        <div className="border-b border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <Brand />
          <div className="mt-2 flex items-center gap-2">
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
          className={cn(
            "z-30 shrink-0 overflow-hidden border-b border-slate-300 bg-card/95 backdrop-blur transition-all duration-300 ease-out no-print dark:border-slate-800",
            headerHidden
              ? "max-h-0 -translate-y-full border-transparent opacity-0"
              : "max-h-40 opacity-100",
          )}
        >
          <div className="flex h-14 items-center justify-between gap-3 px-4">
            <div className="md:hidden">
              <Brand compact linkTo="/admin/dashboard" />
            </div>
            <p className="hidden font-mono text-xs font-medium text-muted-foreground md:block">
              CAJA ACTIVA · {dateLabel}
            </p>
            <div className="flex items-center gap-2">
              <BusinessSwitcher className="hidden sm:flex" />
              <UserMenu compact />
            </div>
          </div>
          <div className="border-t border-slate-200 px-4 py-2 sm:hidden dark:border-slate-800">
            <BusinessSwitcher />
          </div>
        </header>

        <main
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          id="contenido-principal"
        >
          <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 md:px-6 md:py-8 md:pb-10">
            <Outlet />
          </div>
        </main>
      </div>

      <PurchaseFab />

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-slate-900 bg-card/98 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden no-print dark:border-slate-700"
        aria-label="Navegación del negocio"
      >
        <div className="grid grid-cols-5 p-1">
          {bottomNav.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item, pathname);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-1 py-1.5 text-[10px] font-bold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-[0_2px_0_#0f172a]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.shortLabel ?? item.label}
              </NavLink>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-1 py-1.5 text-[10px] font-bold text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Más opciones"
          >
            <LayoutGrid className="size-4" aria-hidden="true" />
            Más
          </button>
        </div>
      </nav>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Más opciones</DialogTitle>
            <DialogDescription>Accesos del negocio.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Link
              to="/admin/purchases/new"
              onClick={() => setMoreOpen(false)}
              className="flex items-center gap-3 rounded-lg border p-3 text-sm font-semibold hover:bg-muted"
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
                  className="flex items-center gap-3 rounded-lg border p-3 text-sm font-semibold hover:bg-muted"
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
