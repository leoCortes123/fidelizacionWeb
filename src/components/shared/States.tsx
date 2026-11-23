import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { errorMessage } from "@/lib/errors";
import { Brand } from "./Brand";

export function LoadingScreen({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="grid min-h-[60vh] place-items-center p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-sm text-muted-foreground" role="status">
          {label}
        </p>
      </div>
    </div>
  );
}

export function FullPageLoader({ label = "Preparando tu cuenta…" }: { label?: string }) {
  return (
    <div className="hero-glow grid min-h-screen place-items-center p-6">
      <div className="flex flex-col items-center gap-5 text-center">
        <Brand />
        <Loader2 className="size-7 animate-spin text-primary" aria-hidden="true" />
        <p className="text-sm text-muted-foreground" role="status">
          {label}
        </p>
      </div>
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  title = "No pudimos cargar la información",
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
  className?: string;
}) {
  return (
    <Alert variant="destructive" className={cn("flex flex-col gap-3", className)}>
      <AlertTriangle aria-hidden="true" />
      <div>
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{errorMessage(error)}</AlertDescription>
      </div>
      {onRetry && (
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </Alert>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2.5 rounded-none border-2 border-dashed border-[var(--lp-ink)] bg-secondary/60 px-4 py-6 text-center sm:px-5 sm:py-8",
        className,
      )}
    >
      <span className="grid size-11 place-items-center rounded-none border-2 border-[var(--lp-ink)] bg-[var(--lp-gold)] text-[#16262e] shadow-[var(--lp-shadow-md)]">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="space-y-1">
        <h3 className="font-display font-bold">{title}</h3>
        {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "space-y-2.5 rounded-none border-2 border-[var(--lp-ink)] bg-card p-[var(--lp-pad-card)] shadow-[var(--lp-shadow-lg)]",
        className,
      )}
    >
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2.5" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3.5 rounded-none border-2 border-[var(--lp-ink)] bg-card p-3 shadow-[var(--lp-shadow-md)] sm:p-3.5"
        >
          <Skeleton className="size-10 shrink-0 rounded-none" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
