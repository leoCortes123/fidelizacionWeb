import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-none border-2 border-[var(--lp-ink)] px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wide shadow-[2px_2px_0_var(--lp-ink)] transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--lp-focus-ring)]",
  {
    variants: {
      variant: {
        default: "bg-[var(--lp-surface-elevated-deep)] text-[var(--lp-gold)]",
        secondary: "bg-[var(--lp-gold-soft)] text-[#16262e]",
        destructive: "bg-[#fee2e2] text-[#991b1b] dark:bg-[#4c1d1b] dark:text-[#ffbab0]",
        outline: "bg-card text-foreground",
        success: "bg-[#dcfce7] text-[#14532d] dark:bg-[#143d27] dark:text-[#86efac]",
        warning: "bg-[var(--lp-gold)] text-[#16262e]",
        muted: "bg-secondary text-muted-foreground shadow-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
