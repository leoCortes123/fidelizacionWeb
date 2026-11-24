import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthProvider";
import { useMyProfile } from "@/features/profile/hooks";
import { ThemeToggleButton } from "@/components/theme/ThemeToggleButton";
import { initials } from "@/lib/config";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  compact?: boolean;
  className?: string;
}

export function UserMenu({ compact = true, className }: UserMenuProps) {
  const { displayName, user, signOut } = useAuth();
  const profile = useMyProfile(Boolean(user));
  const nickname = profile.data?.nickname ?? null;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const profilePath = pathname.startsWith("/admin")
    ? "/admin/perfil"
    : pathname.startsWith("/customer")
      ? "/customer/perfil"
      : "/perfil";

  async function handleSignOut() {
    await signOut();
    toast.success("Sesión cerrada");
    navigate("/login", { replace: true });
  }

  return (
    <div className={cn("flex items-center gap-1.5 sm:gap-2", className)}>
      <ThemeToggleButton variant="shell" />

      <Link
        to={profilePath}
        className={cn(
          "inline-flex h-9 cursor-pointer items-center gap-2 rounded-none border-2 border-[var(--lp-ink)] bg-card text-left shadow-[var(--lp-shadow-sm)] transition-colors hover:bg-[var(--lp-tab-hover-bg)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--lp-focus-ring)] [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:min-w-11",
          compact ? "px-1 py-0.5 sm:pr-2.5" : "px-2 py-1",
        )}
        aria-label="Mi perfil"
        title={displayName ? `Mi perfil (${displayName})` : "Mi perfil"}
      >
        {profile.data?.avatar_url ? (
          <img
            src={profile.data.avatar_url}
            alt={displayName || user?.email || "Foto de perfil"}
            className="size-7 shrink-0 rounded-none border-2 border-[var(--lp-ink)] object-cover"
          />
        ) : (
          <span className="grid size-7 shrink-0 place-items-center rounded-none border-2 border-[var(--lp-ink)] bg-[var(--lp-gold)] font-mono text-[11px] font-bold text-[#16262e]">
            {initials(displayName || user?.email || "?")}
          </span>
        )}
        <span className="hidden max-w-[120px] truncate text-xs font-semibold text-foreground lg:inline">
          {displayName || (nickname ? `@${nickname}` : "Mi perfil")}
        </span>
      </Link>

      <button
        type="button"
        onClick={() => void handleSignOut()}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-none border-2 border-[var(--lp-ink)] bg-card px-2 font-mono text-xs font-bold uppercase text-destructive shadow-[var(--lp-shadow-sm)] transition-colors hover:bg-[var(--lp-danger-bg)] hover:text-[var(--lp-danger-text)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--lp-focus-ring)] [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:min-w-11 sm:px-2.5"
      >
        <LogOut className="size-4 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline">Salir</span>
      </button>
    </div>
  );
}
