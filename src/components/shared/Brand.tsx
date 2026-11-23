import { Link } from "react-router-dom";
import { brandName, brandTagline } from "@/lib/config";
import { cn } from "@/lib/utils";

interface BrandProps {
  className?: string;
  compact?: boolean;
  linkTo?: string;
  name?: string;
  tagline?: string | null;
}

export function Brand({ className, compact = false, linkTo = "/", name, tagline }: BrandProps) {
  const displayName = name?.trim() || brandName;
  const displayTagline = tagline === null ? null : (tagline ?? brandTagline);

  const content = (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <img
        src="/fideliapp-coin.png"
        alt=""
        width={40}
        height={40}
        className={cn(
          "shrink-0 rounded-none object-contain [image-rendering:pixelated]",
          compact ? "size-8" : "size-9",
        )}
        aria-hidden="true"
      />
      <span className="flex min-w-0 flex-col leading-tight">
        <span
          className={cn(
            "truncate font-display font-bold tracking-tight text-foreground",
            compact ? "text-base" : "text-lg",
          )}
        >
          <span>{displayName}</span>
          {!name?.trim() && (
            <span
              className="ml-0.5 font-pixel text-[11px] text-[var(--lp-gold-ink)]"
              aria-hidden="true"
            >
              .
            </span>
          )}
        </span>
        {!compact && displayTagline && (
          <span className="hidden truncate font-mono text-[11px] font-medium text-muted-foreground sm:block">
            {displayTagline}
          </span>
        )}
      </span>
    </span>
  );

  if (!linkTo) return content;
  return (
    <Link to={linkTo} className="min-w-0 rounded-none" aria-label={`${displayName}, ir al inicio`}>
      {content}
    </Link>
  );
}
