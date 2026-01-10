import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "sm",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full transition-colors",
        // Sizes
        size === "sm" && "px-2 py-0.5 text-[10px]",
        size === "md" && "px-2.5 py-1 text-xs",
        // Variants
        variant === "default" && "bg-primary/10 text-primary",
        variant === "success" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        variant === "warning" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        variant === "danger" && "bg-red-500/10 text-red-600 dark:text-red-400",
        variant === "info" && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        variant === "outline" && "border border-border text-muted-foreground",
        className
      )}
    >
      {children}
    </span>
  );
}
