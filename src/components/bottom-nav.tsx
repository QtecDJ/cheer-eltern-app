"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Calendar, 
  CalendarDays, 
  User, 
  ClipboardList, 
  FileText,
  BookOpen 
} from "lucide-react";
import { Mail } from "lucide-react";

const iconMap = {
  Home,
  Calendar,
  CalendarDays,
  User,
  ClipboardList,
  File: FileText,
  FileText,
  BookOpen,
  Mail,
} as const;

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
    <nav className="fixed bottom-7 left-0 right-0 z-50 px-4 pb-safe">
      <div className="max-w-sm mx-auto">
        <div className="bg-card/40 backdrop-blur-2xl border border-border/30 rounded-3xl shadow-lg shadow-black/10 p-2">
          <div className="flex items-center justify-around">
          {items.map((item) => {
            const isActive = pathname === item.href;
            const Icon = iconMap[item.icon] || Home;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-14 rounded-2xl transition-all duration-300",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <Icon
                  className="w-5 h-5 mb-0.5 transition-all duration-300"
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={cn(
                  "text-[10px] font-medium transition-all duration-300",
                  isActive && "font-semibold"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          </div>
        </div>
      </div>
    </nav>
  );
}
