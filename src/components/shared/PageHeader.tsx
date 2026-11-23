import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  kicker,
  actions,
  actionsClassName,
  titleClassName,
  className,
  as: Heading = "h1",
}: {
  title: string;
  description?: string;
  kicker?: string;
  actions?: React.ReactNode;
  actionsClassName?: string;
  titleClassName?: string;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 px-4 pb-0.5 sm:flex-row sm:items-end sm:justify-between sm:px-0",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        {kicker && <span className="lp-section-kicker">{kicker}</span>}
        <Heading
          className={cn(
            "font-display text-xl font-extrabold tracking-tight text-foreground [text-shadow:var(--lp-h1-shadow)] sm:text-2xl",
            titleClassName,
          )}
        >
          {title}
        </Heading>
        {description && (
          <p className="max-w-2xl text-sm leading-snug text-[var(--lp-ink-soft)]">{description}</p>
        )}
      </div>
      {actions && (
        <div className={cn("flex flex-wrap items-center gap-2", actionsClassName)}>{actions}</div>
      )}
    </div>
  );
}
