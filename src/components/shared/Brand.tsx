import { Link } from 'react-router-dom';
import { brandName, brandTagline } from '@/lib/config';
import { cn } from '@/lib/utils';

interface BrandProps {
  className?: string;
  compact?: boolean;
  linkTo?: string;
}

export function Brand({ className, compact = false, linkTo = '/' }: BrandProps) {
  const content = (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span
        aria-hidden="true"
        className="grid size-10 place-items-center rounded-xl bg-primary text-xl text-primary-foreground shadow-sm"
      >
        ⭐
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-display text-base font-extrabold tracking-tight sm:text-lg">
          {brandName}
        </span>
        {!compact && (
          <span className="text-[11px] font-medium text-muted-foreground">
            {brandTagline}
          </span>
        )}
      </span>
    </span>
  );

  if (!linkTo) return content;
  return (
    <Link to={linkTo} className="rounded-lg" aria-label={`${brandName}, ir al inicio`}>
      {content}
    </Link>
  );
}
