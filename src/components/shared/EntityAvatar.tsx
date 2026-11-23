import type { LucideIcon } from "lucide-react";
import { initials } from "@/lib/config";
import { cn } from "@/lib/utils";

interface EntityAvatarProps {
  src?: string | null;
  alt: string;
  fallbackText?: string;
  icon?: LucideIcon;
  sizeClassName?: string;
  roundedClassName?: string;
  className?: string;
}

/**
 * Muestra la foto de una entidad (usuario, negocio, producto o recompensa)
 * y cae a iniciales o ícono cuando aún no tiene imagen cargada.
 */
export function EntityAvatar({
  src,
  alt,
  fallbackText,
  icon: Icon,
  sizeClassName = "size-9",
  roundedClassName = "rounded-none",
  className,
}: EntityAvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn(
          "shrink-0 border-2 border-[var(--lp-ink)] bg-muted object-cover shadow-[var(--lp-shadow-sm)]",
          sizeClassName,
          roundedClassName,
          className,
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center border-2 border-[var(--lp-ink)] bg-[var(--lp-paper-deep)] text-xs font-bold text-foreground shadow-[var(--lp-shadow-sm)]",
        sizeClassName,
        roundedClassName,
        className,
      )}
      aria-hidden="true"
    >
      {Icon ? <Icon className="size-4" /> : initials(fallbackText || alt || "?")}
    </span>
  );
}
