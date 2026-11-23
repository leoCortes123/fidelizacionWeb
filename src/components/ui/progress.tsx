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
        "relative h-3.5 w-full overflow-hidden rounded-none border-2 border-[var(--lp-ink)] bg-[var(--lp-paper-deep)]",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-none transition-[width] duration-500 ease-out motion-reduce:transition-none",
          indicatorClassName || "bg-[var(--lp-green)]",
        )}
        style={{ width: `${percentage}%` }}
      />
      <div aria-hidden="true" className="lp-progress-ticks pointer-events-none absolute inset-0" />
    </div>
  );
}
