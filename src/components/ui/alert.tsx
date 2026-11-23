import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-none border-2 border-[var(--lp-ink)] p-3.5 text-sm shadow-[3px_3px_0_var(--lp-ink)] sm:p-4 [&>svg]:absolute [&>svg]:left-3.5 [&>svg]:top-3.5 sm:[&>svg]:left-4 sm:[&>svg]:top-4 [&>svg]:size-4 [&>svg~*]:pl-6 sm:[&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-card text-foreground",
        destructive:
          "bg-[#fee2e2] text-[#7f1d1d] [&>svg]:text-[#991b1b] dark:bg-[#4c1d1b] dark:text-[#ffdad4] dark:[&>svg]:text-[#ffbab0]",
        success:
          "bg-[#dcfce7] text-[#14532d] [&>svg]:text-[#15803d] dark:bg-[#143d27] dark:text-[#d1fae5] dark:[&>svg]:text-[#86efac]",
        warning:
          "border-[var(--lp-tip-border)] bg-[var(--lp-tip-bg)] text-foreground [&>svg]:text-[var(--lp-tip-strong)]",
        info: "bg-[#dbeafe] text-[#16262e] [&>svg]:text-[#1765cc] dark:bg-[#1d394b] dark:text-[#fff8e6] dark:[&>svg]:text-[#fad24b]",
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
