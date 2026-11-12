import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-none font-sans text-sm font-semibold tracking-tight transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-primary/90 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow active:scale-[0.98]",
        destructive:
          "border border-destructive/90 bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow active:scale-[0.98]",
        outline:
          "border border-border bg-card text-foreground shadow-sm hover:border-primary/40 hover:bg-muted/60 hover:text-foreground active:scale-[0.98] dark:border-slate-700 dark:hover:bg-slate-800/80",
        secondary:
          "border border-amber-500/80 bg-amber-400 text-slate-950 shadow-sm hover:bg-amber-300 hover:shadow active:scale-[0.98]",
        ghost:
          "rounded-none border border-transparent text-foreground hover:bg-muted/80 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-11 px-4 py-2",
        sm: "min-h-9 rounded-none px-3 py-1.5 text-xs",
        lg: "min-h-11 rounded-none px-5 py-2 text-base",
        icon: "size-11",
      },
    },
    compoundVariants: [
      {
        variant: "link",
        className: "h-auto min-h-6 whitespace-normal px-1 py-0.5 dark:text-blue-400",
      },
    ],
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
