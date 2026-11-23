import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[76px] w-full rounded-none border-2 border-[var(--lp-input-border)] bg-card px-2.5 py-1.5 text-base font-medium text-foreground shadow-[var(--lp-shadow-sm)] transition-[border-color,box-shadow] placeholder:font-normal placeholder:text-muted-foreground hover:border-[var(--lp-focus-ring)] focus-visible:border-[var(--lp-focus-ring)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--lp-focus-ring)] disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-[invalid=true]:border-[var(--lp-red-dark)] dark:bg-[var(--lp-paper-deep)] md:min-h-[64px] md:text-sm",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
