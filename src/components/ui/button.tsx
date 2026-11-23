import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-none font-mono text-sm font-semibold tracking-tight transition-[transform,box-shadow,background-color] duration-150 select-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--lp-focus-ring)] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-2 border-[var(--lp-ink)] bg-[var(--lp-blue)] text-white shadow-[inset_2px_2px_0_rgba(255,255,255,0.32),inset_-2px_-2px_0_rgba(0,0,0,0.16),3px_3px_0_var(--lp-ink)] hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[var(--lp-blue-hover)] hover:shadow-[inset_2px_2px_0_rgba(255,255,255,0.38),2px_2px_0_var(--lp-ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0 motion-reduce:active:translate-x-0 motion-reduce:active:translate-y-0",
        destructive:
          "border-2 border-[var(--lp-ink)] bg-[var(--lp-red-dark)] text-white shadow-[inset_2px_2px_0_rgba(255,255,255,0.28),inset_-2px_-2px_0_rgba(0,0,0,0.16),3px_3px_0_var(--lp-ink)] hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[var(--lp-red-hover)] hover:shadow-[inset_2px_2px_0_rgba(255,255,255,0.34),2px_2px_0_var(--lp-ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0 motion-reduce:active:translate-x-0 motion-reduce:active:translate-y-0",
        outline:
          "border-2 border-[var(--lp-ink)] bg-card text-foreground shadow-[inset_2px_2px_0_rgba(255,255,255,0.28),3px_3px_0_var(--lp-ink)] hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[var(--lp-tab-hover-bg)] hover:text-foreground hover:shadow-[2px_2px_0_var(--lp-ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0 motion-reduce:active:translate-x-0 motion-reduce:active:translate-y-0",
        secondary:
          "border-2 border-[var(--lp-ink)] bg-[var(--lp-gold)] text-[#16262e] shadow-[inset_2px_2px_0_rgba(255,255,255,0.42),inset_-2px_-2px_0_rgba(0,0,0,0.12),3px_3px_0_var(--lp-ink)] hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[var(--lp-gold-dark)] hover:shadow-[inset_2px_2px_0_rgba(255,255,255,0.45),2px_2px_0_var(--lp-ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0 motion-reduce:active:translate-x-0 motion-reduce:active:translate-y-0",
        success:
          "border-2 border-[var(--lp-ink)] bg-[var(--lp-green-cta)] text-white shadow-[inset_2px_2px_0_rgba(255,255,255,0.32),inset_-2px_-2px_0_rgba(0,0,0,0.16),3px_3px_0_var(--lp-ink)] hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[var(--lp-green-cta-hover)] hover:shadow-[inset_2px_2px_0_rgba(255,255,255,0.38),2px_2px_0_var(--lp-ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0 motion-reduce:active:translate-x-0 motion-reduce:active:translate-y-0",
        ghost:
          "rounded-none border-2 border-transparent text-foreground hover:border-[var(--lp-ink)] hover:bg-card hover:text-foreground hover:shadow-[2px_2px_0_var(--lp-ink)]",
        link: "font-sans text-[var(--lp-accent-link)] underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-[var(--lp-btn-h)] px-3.5 py-1.5",
        sm: "min-h-[var(--lp-btn-h-sm)] rounded-none px-2.5 py-1 text-xs",
        lg: "min-h-12 rounded-none px-4 py-2 text-sm md:min-h-10 [@media(pointer:coarse)]:min-h-11",
        icon: "size-[var(--lp-btn-h)]",
        "icon-sm": "size-[var(--lp-btn-h-sm)]",
      },
    },
    compoundVariants: [
      {
        variant: "link",
        className: "h-auto min-h-6 whitespace-normal px-1 py-0.5",
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
