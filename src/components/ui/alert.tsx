import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-none border p-3.5 text-sm sm:p-4 [&>svg]:absolute [&>svg]:left-3.5 [&>svg]:top-3.5 sm:[&>svg]:left-4 sm:[&>svg]:top-4 [&>svg]:size-4 [&>svg~*]:pl-6 sm:[&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/40 bg-destructive/5 text-destructive [&>svg]:text-destructive dark:border-red-900/70 dark:bg-red-950/35 dark:text-red-300 dark:[&>svg]:text-red-400",
        success:
          "border-emerald-300 bg-emerald-50 text-emerald-900 [&>svg]:text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/35 dark:text-emerald-200 dark:[&>svg]:text-emerald-400",
        warning:
          "border-amber-300 bg-amber-50 text-amber-950 [&>svg]:text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/35 dark:text-amber-200 dark:[&>svg]:text-amber-400",
        info: "border-sky-300 bg-sky-50 text-sky-950 [&>svg]:text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/35 dark:text-sky-200 dark:[&>svg]:text-sky-400",
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
