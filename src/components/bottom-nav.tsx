"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, CalendarDays, User, ClipboardList } from "lucide-react";

const iconMap = {
  Home,
  Calendar,
  CalendarDays,
  User,
  ClipboardList,
};

export interface NavItem {
  href: string;
  icon: keyof typeof iconMap;
  label: string;
}

interface BottomNavProps {
  items: NavItem[];
}

export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = iconMap[item.icon];

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-200",
                isActive
                  ? "text-primary bg-primary/10 scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 mb-0.5 transition-transform duration-200",
                  isActive && "scale-110"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
