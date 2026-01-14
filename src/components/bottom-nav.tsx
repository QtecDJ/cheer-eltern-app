"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, CalendarDays, User, ClipboardList, File, FileText } from "lucide-react";

const iconMap = {
  Home,
  Calendar,
  CalendarDays,
  User,
  ClipboardList,
  File,
  FileText,
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
    <>
      {/* Mobile Navigation - Bottom */}
      <nav className="md:hidden fixed bottom-5 left-0 right-0 z-50 px-2 pb-safe">
        <div className="max-w-lg mx-auto">
          <div className="bg-card/80 backdrop-blur-2xl border border-border/30 rounded-3xl shadow-2xl shadow-black/20 p-2">
            <div className="flex items-center justify-around">
            {items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = iconMap[item.icon] || Home; // Fallback zu Home wenn Icon nicht existiert

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

      {/* Desktop/Tablet Navigation - Sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 z-50 w-20 lg:w-64 bg-card/95 backdrop-blur-xl border-r border-border/30 shadow-xl">
        <div className="flex flex-col w-full">
          {/* Header/Logo Bereich */}
          <div className="p-4 lg:p-6 border-b border-border/30">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Home className="w-6 h-6 text-primary" />
              </div>
              <span className="hidden lg:block text-lg font-bold">Member App</span>
            </div>
          </div>
          
          {/* Navigation Items */}
          <div className="flex flex-col p-4 gap-2 flex-1">
            {items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = iconMap[item.icon] || Home;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                    "lg:justify-start justify-center",
                    isActive
                      ? "text-primary bg-primary/10 font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <Icon
                    className="w-5 h-5 flex-shrink-0"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className="hidden lg:block text-sm font-medium">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
