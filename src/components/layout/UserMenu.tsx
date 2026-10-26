import { useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Moon, Sun, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth/AuthProvider';
import { useMyProfile } from '@/features/profile/hooks';
import { useTheme } from '@/components/theme/ThemeProvider';
import { initials } from '@/lib/config';
import { cn } from '@/lib/utils';

interface UserMenuProps {
  compact?: boolean;
  className?: string;
  align?: 'start' | 'end';
}

export function UserMenu({ compact = false, className, align = 'end' }: UserMenuProps) {
  const { displayName, user, signOut } = useAuth();
  const profile = useMyProfile(Boolean(user));
  const nickname = profile.data?.nickname ?? null;
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    toast.success('Sesión cerrada');
    navigate('/', { replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 rounded-xl text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            compact ? 'p-1' : 'w-full p-2',
            className,
          )}
          aria-label="Abrir menú de usuario"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {initials(displayName || user?.email || '?')}
          </span>
          {!compact && (
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-semibold">
                {displayName || 'Mi cuenta'}
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {nickname ? `@${nickname}` : user?.email}
              </span>
            </span>
          )}
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} className="w-60">
        <DropdownMenuLabel className="space-y-0.5">
          <span className="block truncate text-sm font-semibold text-foreground">
            {displayName || 'Mi cuenta'}
          </span>
          <span className="block truncate text-[11px] font-normal text-muted-foreground">
            {nickname ? `@${nickname} · ${user?.email}` : user?.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/perfil')}>
          <UserRound aria-hidden="true" />
          Mi perfil
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => toggleTheme()}>
          {theme === 'dark' ? (
            <Sun aria-hidden="true" />
          ) : (
            <Moon aria-hidden="true" />
          )}
          {theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          onSelect={() => void handleSignOut()}
        >
          <LogOut aria-hidden="true" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
