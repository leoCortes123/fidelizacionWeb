import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  kicker,
  actions,
  actionsClassName,
  className,
  as: Heading = "h1",
}: {
  title: string;
  description?: string;
  kicker?: string;
  actions?: React.ReactNode;
  actionsClassName?: string;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 px-4 pb-1 sm:flex-row sm:items-end sm:justify-between sm:px-0",
        className,
      )}
    >
      <div className="min-w-0 space-y-1.5">
        {kicker && <span className="lp-section-kicker">{kicker}</span>}
        <Heading className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          {title}
        </Heading>
        {description && (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className={cn("flex flex-wrap items-center gap-2", actionsClassName)}>{actions}</div>
      )}
    </div>
  );
}
