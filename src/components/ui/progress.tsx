import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
  label?: string;
}

export function Progress({
  value,
  max = 100,
  className,
  indicatorClassName,
  label,
}: ProgressProps) {
  const safeMax = Math.max(max, 1);
  const clampedValue = Math.max(0, Math.min(safeMax, value));
  const percentage = (clampedValue / safeMax) * 100;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={Math.round(clampedValue)}
      aria-label={label}
      className={cn(
        "relative h-3 w-full overflow-hidden rounded-full border border-border/70 bg-slate-200/80 dark:border-slate-700 dark:bg-slate-800",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r from-primary to-cyan-500 transition-[width] duration-500 ease-out",
          indicatorClassName,
        )}
        style={{ width: `${percentage}%` }}
      />
      <div aria-hidden="true" className="lp-progress-ticks pointer-events-none absolute inset-0" />
    </div>
  );
}
