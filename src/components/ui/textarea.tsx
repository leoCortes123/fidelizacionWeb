import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[76px] w-full rounded-none border-2 border-input bg-card px-2.5 py-1.5 text-base font-medium text-foreground shadow-[2px_2px_0_var(--lp-ink)] transition-[border-color,box-shadow] placeholder:font-normal placeholder:text-muted-foreground hover:border-[var(--lp-focus-ring)] focus-visible:border-[var(--lp-focus-ring)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--lp-focus-ring)] focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/25 dark:bg-[var(--lp-paper-deep)] md:text-sm",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
