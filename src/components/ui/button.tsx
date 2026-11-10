import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-sans text-sm font-bold tracking-tight transition-all duration-100 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-2 border-slate-900 bg-primary text-primary-foreground shadow-[0_3px_0_#0f172a,inset_0_1px_0_rgba(255,255,255,0.28)] hover:bg-blue-700 active:translate-y-[2px] active:shadow-[0_1px_0_#0f172a] dark:border-slate-200 dark:shadow-[0_3px_0_#020617]",
        destructive:
          "border-2 border-slate-900 bg-destructive text-destructive-foreground shadow-[0_3px_0_#0f172a,inset_0_1px_0_rgba(255,255,255,0.25)] hover:bg-destructive/90 active:translate-y-[2px] active:shadow-[0_1px_0_#0f172a] dark:border-slate-200",
        outline:
          "border-2 border-slate-900 bg-card text-foreground shadow-[0_3px_0_#0f172a,inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-primary hover:bg-blue-50/70 hover:text-primary active:translate-y-[2px] active:shadow-[0_1px_0_#0f172a] dark:border-slate-300 dark:hover:bg-slate-800",
        secondary:
          "border-2 border-slate-900 bg-amber-400 text-slate-950 shadow-[0_3px_0_#0f172a,inset_0_1px_0_rgba(255,255,255,0.45)] hover:bg-amber-300 active:translate-y-[2px] active:shadow-[0_1px_0_#0f172a] dark:border-slate-200",
        ghost:
          "rounded-md border border-transparent text-foreground hover:border-border hover:bg-muted/80 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-11 px-4 py-2",
        sm: "min-h-9 rounded-md px-3 py-1.5 text-xs",
        lg: "min-h-12 rounded-md px-6 py-2.5 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, children, disabled, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            <span>Procesando…</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
