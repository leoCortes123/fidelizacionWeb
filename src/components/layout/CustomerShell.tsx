import { useRef } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, ReceiptText, TicketCheck, Wrench } from 'lucide-react';
import { Brand } from '@/components/shared/Brand';
import { Button } from '@/components/ui/button';
import { BusinessSwitcher } from '@/features/loyalty/BusinessSwitcher';
import { useAuth } from '@/features/auth/AuthProvider';
import { usePortalTheme } from '@/components/theme/ThemeProvider';
import { cn } from '@/lib/utils';
import { UserMenu } from './UserMenu';
import { useHideOnScroll } from './useHideOnScroll';

const navItems = [
  { to: '/customer', label: 'Inicio', icon: Home, end: true },
  { to: '/customer/purchases', label: 'Compras', icon: ReceiptText },
  { to: '/customer/redemptions', label: 'Canjes', icon: TicketCheck },
];

export function CustomerShell() {
  usePortalTheme('customer');
  const { roles } = useAuth();
  const { pathname } = useLocation();
  const scrollRef = useRef<HTMLElement | null>(null);
  const headerHidden = useHideOnScroll(scrollRef);
  const isAdmin = roles.includes('admin');

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <header
        data-testid="app-header"
        className={cn(
          'z-30 shrink-0 overflow-hidden border-b bg-background/95 backdrop-blur transition-all duration-300 ease-out no-print',
          headerHidden
            ? 'max-h-0 -translate-y-full border-transparent opacity-0'
            : 'max-h-40 opacity-100',
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-3 px-4">
          <Brand linkTo="/customer" />
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
                <Link to="/admin">
                  <Wrench aria-hidden="true" />
                  Administrar
                </Link>
              </Button>
            )}
            <UserMenu compact />
          </div>
        </div>
        <div className="border-t px-4 py-2 md:hidden">
          <BusinessSwitcher />
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
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden no-print"
        aria-label="Navegación inferior"
      >
        <div className="grid grid-cols-3">
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
                  'flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
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
