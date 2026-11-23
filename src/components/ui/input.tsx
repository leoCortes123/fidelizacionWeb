import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-[var(--lp-control-h)] w-full rounded-none border-2 border-[var(--lp-input-border)] bg-card px-2.5 py-1 text-base font-medium text-foreground shadow-[var(--lp-shadow-sm)] transition-[border-color,box-shadow] duration-150 file:border-0 file:bg-transparent file:font-mono file:text-xs file:font-semibold placeholder:font-normal placeholder:text-muted-foreground hover:border-[var(--lp-focus-ring)] focus-visible:border-[var(--lp-focus-ring)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--lp-focus-ring)] disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-[invalid=true]:border-[var(--lp-red-dark)] dark:bg-[var(--lp-paper-deep)] md:text-sm",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
