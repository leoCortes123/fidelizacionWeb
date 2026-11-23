import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-none border-2 border-[var(--lp-ink)] p-3 text-sm shadow-[var(--lp-shadow-md)] sm:p-3.5 [&>svg]:absolute [&>svg]:left-3 [&>svg]:top-3 sm:[&>svg]:left-3.5 sm:[&>svg]:top-3.5 [&>svg]:size-4 [&>svg~*]:pl-6 sm:[&>svg~*]:pl-6",
  {
    variants: {
      variant: {
        default: "bg-card text-foreground",
        destructive:
          "bg-[var(--lp-danger-bg)] text-[var(--lp-danger-text)] [&>svg]:text-[var(--lp-red-text)]",
        success:
          "bg-[var(--lp-success-bg)] text-[var(--lp-success-text)] [&>svg]:text-[var(--lp-green-text)]",
        warning:
          "border-[var(--lp-tip-border)] bg-[var(--lp-tip-bg)] text-foreground [&>svg]:text-[var(--lp-tip-strong)]",
        info: "bg-[var(--lp-info-bg)] text-[var(--lp-info-text)] [&>svg]:text-[var(--lp-accent-link)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

const icons = {
  default: Info,
  destructive: AlertCircle,
  success: CheckCircle2,
  warning: TriangleAlert,
  info: Info,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const Icon = icons[variant ?? "default"];
    return (
      <div
        ref={ref}
        role={variant === "destructive" ? "alert" : "status"}
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <Icon aria-hidden="true" />
        {children}
      </div>
    );
  },
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn("mb-1 font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  ),
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
