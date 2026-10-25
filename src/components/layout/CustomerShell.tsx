import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Home,
  LogOut,
  ReceiptText,
  TicketCheck,
  Wallet,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';
import { Brand } from '@/components/shared/Brand';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/features/auth/AuthProvider';
import { BusinessSwitcher } from '@/features/loyalty/BusinessSwitcher';
import { initials } from '@/lib/config';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/customer', label: 'Inicio', icon: Home, end: true },
  { to: '/customer/balance', label: 'Balance', icon: Wallet },
  { to: '/customer/purchases', label: 'Compras', icon: ReceiptText },
  { to: '/customer/redemptions', label: 'Canjes', icon: TicketCheck },
];

export function CustomerShell() {
  const { displayName, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const isAdmin = roles.includes('admin');

  async function handleSignOut() {
    await signOut();
    toast.success('Sesión cerrada');
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur no-print">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
          <Brand />
          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Navegación del cliente"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-secondary text-secondary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <BusinessSwitcher className="hidden md:flex" />
            {isAdmin && (
              <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
                <NavLink to="/admin">
                  <Wrench aria-hidden="true" />
                  Panel de administración
                </NavLink>
              </Button>
            )}
            <div className="hidden items-center gap-2 sm:flex">
              <span className="grid size-9 place-items-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                {initials(displayName)}
              </span>
              <div className="max-w-[9rem] leading-tight">
                <p className="truncate text-xs font-semibold">{displayName}</p>
                {isAdmin && (
                  <Badge variant="secondary" className="mt-0.5 px-1.5 py-0 text-[10px]">
                    Admin
                  </Badge>
                )}
              </div>
            </div>
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

      <div className="border-b bg-card/40 px-4 py-2 md:hidden">
        <BusinessSwitcher />
      </div>

      <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-5 md:pb-14">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden no-print"
        aria-label="Navegación inferior"
      >
        <div className="grid grid-cols-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                <Icon className="size-5" aria-hidden="true" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
