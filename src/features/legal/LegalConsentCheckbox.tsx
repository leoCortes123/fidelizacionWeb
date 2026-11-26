import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function LegalExternalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "font-semibold text-[var(--accent-link,var(--primary))] underline underline-offset-4 hover:opacity-85 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--lp-focus-ring,var(--focus-ring))]",
        className,
      )}
    >
      {children}
    </a>
  );
}

export interface LegalConsentCheckboxProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: ReactNode;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function LegalConsentCheckbox({
  id,
  checked,
  onCheckedChange,
  label,
  error,
  disabled = false,
  className,
}: LegalConsentCheckboxProps) {
  const errorId = `${id}-error`;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={id}
        className={cn(
          "flex min-h-11 cursor-pointer items-start gap-3 rounded-none border-2 p-3 text-xs leading-relaxed transition-colors",
          error
            ? "border-destructive bg-destructive/5"
            : checked
              ? "border-[var(--lp-ink,var(--ink))] bg-[var(--lp-tip-bg,var(--paper-deep))]"
              : "border-[var(--lp-ink-soft,var(--border))] bg-card/70 hover:border-[var(--lp-ink,var(--ink))]",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onCheckedChange(event.target.checked)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[var(--lp-ink,#16262e)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--lp-focus-ring,var(--focus-ring))]"
        />
        <span className="text-foreground">{label}</span>
      </label>
      {error && (
        <p id={errorId} aria-live="polite" className="text-xs font-semibold text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
