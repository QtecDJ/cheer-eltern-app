import { cn } from "@/lib/utils";
import { ReactNode, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  variant?: "default" | "gradient" | "outline";
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  children,
  className,
  variant = "default",
  padding = "md",
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-2xl transition-all duration-200",
        // Variants
        variant === "default" && "bg-card border border-border shadow-sm",
        variant === "gradient" &&
          "bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border border-primary/20",
        variant === "outline" && "border border-border",
        // Padding
        padding === "none" && "p-0",
        padding === "sm" && "p-3",
        padding === "md" && "p-4",
        padding === "lg" && "p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-3", className)}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function CardTitle({ children, className, size = "md" }: CardTitleProps) {
  return (
    <h3
      className={cn(
        "font-semibold text-card-foreground",
        size === "sm" && "text-sm",
        size === "md" && "text-base",
        size === "lg" && "text-lg",
        className
      )}
    >
      {children}
    </h3>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn(className)}>{children}</div>;
}
