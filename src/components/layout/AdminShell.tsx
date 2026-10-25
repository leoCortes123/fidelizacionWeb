import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Home,
  LogOut,
  QrCode,
  ReceiptText,
  Settings,
  Users,
  LayoutDashboard,
  Gift,
  Package,
  Settings2,
  TicketCheck,
  UserRound,
  ClipboardList,
  Megaphone,
  PlusCircle,
  Rocket,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { Brand } from '@/components/shared/Brand';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/features/auth/AuthProvider';
import { BusinessSwitcher } from '@/features/loyalty/BusinessSwitcher';
import { cn } from '@/lib/utils';

type AdminNavItem = {
  to: string;
  label: string;
  shortLabel?: string;
  icon: typeof Home;
  end?: boolean;
  primary?: boolean;
  legacy?: boolean;
};

const adminNav: AdminNavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, primary: true },
  { to: '/admin/program', label: 'Programa', icon: Settings2, primary: true },
  { to: '/admin/products', label: 'Carta', icon: Package, primary: true },
  { to: '/admin/rewards', label: 'Recompensas', icon: Gift, primary: true },
  { to: '/admin/campaigns', label: 'Campañas', icon: Megaphone },
  { to: '/admin/redemptions', label: 'Solicitudes', icon: TicketCheck, primary: true },
  {
    to: '/admin/purchases/new',
    label: 'Registrar compra',
    shortLabel: 'Registrar',
    icon: PlusCircle,
    primary: true,
  },
  { to: '/admin/economic', label: 'Económico', icon: TrendingUp },
  { to: '/admin/audit', label: 'Auditoría', icon: ClipboardList },
  { to: '/admin/onboarding', label: 'Configuración inicial', shortLabel: 'Inicio guiado', icon: Rocket },
  { to: '/admin/members', label: 'Miembros', icon: UserRound },
  { to: '/admin/customers', label: 'Clientes', icon: Users },
  { to: '/admin/purchases', label: 'Compras', icon: ReceiptText },
  { to: '/admin', label: 'QR de compras', icon: QrCode, end: true, legacy: true },
  { to: '/admin/settings', label: 'Ajustes anteriores', icon: Settings, legacy: true },
];

const modernNav = adminNav.filter((item) => !item.legacy);
const legacyNav = adminNav.filter((item) => item.legacy);
const bottomNav = adminNav.filter((item) => item.primary);

export function AdminShell() {
  const { displayName, user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    toast.success('Sesión cerrada');
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className="hidden w-64 shrink-0 border-r bg-card md:flex md:flex-col no-print">
        <div className="border-b p-5">
          <Brand />
          <Badge variant="secondary" className="mt-3">
            Administración
          </Badge>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Panel de administración">
          {modernNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            );
          })}

          <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Sistema anterior
          </p>
          {legacyNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="space-y-3 border-t p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut aria-hidden="true" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur no-print md:hidden">
          <div className="flex h-14 items-center justify-between gap-3 px-4">
            <Brand compact />
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Admin</Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                aria-label="Cerrar sesión"
              >
                <LogOut aria-hidden="true" />
              </Button>
            </div>
          </div>
        </header>

        <div className="hidden items-center justify-between gap-4 border-b bg-card/50 px-6 py-3 md:flex no-print">
          <p className="text-sm text-muted-foreground">
            Caja ·{' '}
            {new Date().toLocaleDateString('es-CO', {
              timeZone: 'America/Bogota',
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
          <div className="flex items-center gap-3">
            <BusinessSwitcher />
            <Button variant="ghost" size="sm" asChild>
              <NavLink to="/customer">
                <Home aria-hidden="true" />
                Ver portal del cliente
              </NavLink>
            </Button>
          </div>
        </div>

        <div className="border-b bg-card/40 px-4 py-2 md:hidden no-print">
          <BusinessSwitcher />
        </div>

        <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-5 md:px-6 md:py-8 md:pb-8">
          <Outlet />
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden no-print"
        aria-label="Navegación del administrador"
      >
        <div className="grid grid-cols-6">
          {bottomNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                <Icon className="size-5" aria-hidden="true" />
                {item.shortLabel ?? item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
