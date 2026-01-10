import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtext?: string;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "primary" | "success" | "warning";
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  variant = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-4 transition-all duration-200",
        variant === "default" && "bg-card border border-border",
        variant === "primary" && "bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20",
        variant === "success" && "bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20",
        variant === "warning" && "bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20",
        className
      )}
    >
      {/* Hintergrund Dekoration */}
      <div
        className={cn(
          "absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10",
          variant === "default" && "bg-muted-foreground",
          variant === "primary" && "bg-primary",
          variant === "success" && "bg-emerald-500",
          variant === "warning" && "bg-amber-500"
        )}
      />

      <div className="relative">
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center mb-3",
            variant === "default" && "bg-secondary text-muted-foreground",
            variant === "primary" && "bg-primary/20 text-primary",
            variant === "success" && "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
            variant === "warning" && "bg-amber-500/20 text-amber-600 dark:text-amber-400"
          )}
        >
          <Icon className="w-4 h-4" />
        </div>

        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {subtext && (
          <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        )}
      </div>
    </div>
  );
}
