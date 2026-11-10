import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[96px] w-full rounded-md border-2 border-slate-900 border-l-4 border-l-primary bg-white px-3.5 py-2.5 text-base font-medium text-foreground shadow-[inset_0_2px_4px_rgba(15,23,42,0.06)] transition-all placeholder:font-normal placeholder:text-muted-foreground hover:border-slate-700 hover:border-l-primary focus-visible:border-primary focus-visible:bg-blue-50/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:border-slate-300 disabled:border-l-slate-400 disabled:bg-muted disabled:opacity-60 dark:border-slate-400 dark:border-l-primary dark:bg-slate-900 dark:focus-visible:bg-slate-900",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
