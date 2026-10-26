import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

function useHasHover() {
  const [hasHover, setHasHover] = useState(true);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setHasHover(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);

  return hasHover;
}

interface HelpHintProps {
  text: string;
  label?: string;
  className?: string;
}

/**
 * Ayuda corta para campos y acciones. En escritorio se muestra como tooltip;
 * en pantallas táctiles se abre al toque para que no dependa del hover.
 */
export function HelpHint({ text, label = 'Mostrar explicación', className }: HelpHintProps) {
  const hasHover = useHasHover();

  const trigger = (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'inline-grid size-5 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <Info className="size-3.5" aria-hidden="true" />
    </button>
  );

  if (hasHover) {
    return (
      <TooltipProvider delayDuration={250}>
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent>{text}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="start" className="text-xs leading-relaxed">
        {text}
      </PopoverContent>
    </Popover>
  );
}
