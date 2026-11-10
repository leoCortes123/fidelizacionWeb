import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  label?: string;
}

export function Progress({ value, max = 100, className, label }: ProgressProps) {
  const percentage = Math.max(0, Math.min(100, (value / Math.max(max, 1)) * 100));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      aria-label={label}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded border-2 border-slate-900 bg-slate-200 p-0.5 dark:border-slate-400 dark:bg-slate-800",
        className,
      )}
    >
      <div
        className="h-full rounded-[2px] bg-gradient-to-r from-cyan-500 to-primary transition-[width] duration-500"
        style={{ width: `${percentage}%` }}
      />
      <div aria-hidden="true" className="lp-progress-ticks pointer-events-none absolute inset-0" />
    </div>
  );
}
