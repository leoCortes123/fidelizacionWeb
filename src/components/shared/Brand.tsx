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
        src="/loopoint-coin.png"
        alt=""
        width={40}
        height={40}
        className={cn(
          "shrink-0 rounded-none object-contain drop-shadow-sm",
          compact ? "size-8" : "size-10",
        )}
        aria-hidden="true"
      />
      <span className="flex min-w-0 flex-col leading-tight">
        <span
          className={cn(
            "truncate font-display font-extrabold tracking-tight",
            compact ? "text-base" : "text-base sm:text-lg",
          )}
        >
          {displayName}
        </span>
        {!compact && displayTagline && (
          <span className="hidden truncate text-[11px] font-medium text-muted-foreground sm:block">
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
