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
      <img
        src="/loopoint-coin.png"
        alt=""
        width={40}
        height={40}
        className={cn(
          'shrink-0 rounded-xl object-contain drop-shadow-sm',
          compact ? 'size-8' : 'size-10',
        )}
        aria-hidden="true"
      />
      <span className="flex min-w-0 flex-col leading-tight">
        <span
          className={cn(
            'font-display font-extrabold tracking-tight',
            compact ? 'text-base' : 'text-base sm:text-lg',
          )}
        >
          {brandName}
        </span>
        {!compact && (
          <span className="truncate text-[11px] font-medium text-muted-foreground">
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
