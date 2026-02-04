"use client";

import React from "react";
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
  userName?: string;
  userRole?: string;
}

export function BottomNav({ items, userName, userRole }: BottomNavProps) {
  const pathname = usePathname();
  const [unread, setUnread] = React.useState<number>(0);
  const [replied, setReplied] = React.useState<number>(0);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/messages/unread-count');
        if (!res.ok) return;
        const json = await res.json();
        if (mounted && typeof json.count === 'number') setUnread(json.count);
        if (mounted && typeof json.replied === 'number') setReplied(json.replied);
      } catch (e) {
        // ignore
      }
    })();
    // listen for global events to refresh counts (e.g., message read/assigned)
    const handler = (e?: any) => {
      // If event signals a local decrement (user read an assigned message or replied), adjust locally
      try {
        const detail = e?.detail;
        if (detail && detail.localDecrementAssigned) {
          setUnread((u) => Math.max(0, u - 1));
          return;
        }
        if (detail && detail.localDecrementReplied) {
          setReplied((r) => Math.max(0, r - 1));
          return;
        }
      } catch (err) {
        // ignore
      }
      (async () => {
        try {
          const res = await fetch('/api/messages/unread-count');
          if (!res.ok) return;
          const json = await res.json();
          if (mounted && typeof json.count === 'number') setUnread(json.count);
          if (mounted && typeof json.replied === 'number') setReplied(json.replied);
        } catch (e) {}
      })();
    };
    window.addEventListener('messages:changed', handler as any);
    return () => { mounted = false; };
  }, []);

  return (
    <nav className="fixed bottom-7 left-0 right-0 z-50 px-4 pb-safe lg:bottom-0 lg:top-0 lg:right-auto lg:w-[280px] lg:h-screen lg:px-0 lg:pb-0 lg:pt-8">
      <div className="max-w-sm mx-auto lg:max-w-none lg:h-full lg:flex lg:flex-col">
        {/* Desktop Logo */}
        <div className="hidden lg:block px-6 mb-8">
          <h1 className="text-2xl font-bold text-primary">ICA Members</h1>
        </div>
        
        <div className="bg-card/40 backdrop-blur-2xl border border-border/30 rounded-3xl shadow-lg shadow-black/10 p-2 lg:bg-transparent lg:border-0 lg:shadow-none lg:rounded-none lg:p-0 lg:flex-1 lg:px-4 lg:flex lg:flex-col">
          <div className="flex items-center justify-around lg:flex-col lg:items-stretch lg:justify-start lg:gap-2 lg:flex-1">
          {items.map((item) => {
            const isActive = pathname === item.href;
            const Icon = iconMap[item.icon] || Home;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={cn(
                  "relative flex flex-col items-center justify-center flex-1 h-14 rounded-2xl transition-all duration-300",
                  "lg:flex-row lg:justify-start lg:gap-4 lg:px-6 lg:h-12",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <Icon
                  className="w-5 h-5 mb-0.5 transition-all duration-300 lg:mb-0 lg:w-6 lg:h-6"
                  strokeWidth={isActive ? 2.5 : 2}
                />
                    <span className={cn(
                  "text-[10px] font-medium transition-all duration-300 lg:text-base",
                  isActive && "font-semibold"
                )}>
                  {item.label}
                </span>
                    {item.href === '/messages' && (
                      <>
                        {unread > 0 && (
                          <span className="absolute -top-0.5 right-3 lg:static lg:ml-auto">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-semibold">{unread > 9 ? '9+' : unread}</span>
                          </span>
                        )}
                        {replied > 0 && (
                          <span className="absolute -top-1 right-0 lg:static lg:ml-2">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 ring-1 ring-white" />
                          </span>
                        )}
                      </>
                    )}
              </Link>
            );
          })}
          </div>
          
          {/* Desktop User Info - Am Ende der Navigation */}
          <div className="hidden lg:block mt-auto pt-4 px-2 border-t border-border/30">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card/20">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {userName ? userName.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {userName || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {userRole || 'Mitglied'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Desktop Footer */}
        <div className="hidden lg:block px-6 mt-4 pb-8">
          <p className="text-xs text-muted-foreground">© 2026 ICA-Dev</p>
        </div>
      </div>
    </nav>
  );
}
