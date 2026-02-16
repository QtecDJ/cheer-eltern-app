"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useProfileSwitcher } from "@/modules/profile-switcher";
import { 
  Home, 
  Users, 
  Calendar, 
  MessageSquare, 
  Mail,
  Info,
  Bell,
  CheckSquare,
  ChevronDown,
  User,
  LogOut,
  FileText,
  CalendarDays
} from "lucide-react";

export interface NavItem {
  href: string;
  icon: keyof typeof iconMap;
  label: string;
}

interface TopNavProps {
  items: NavItem[];
  userName?: string;
  userRole?: string;
  isAdmin?: boolean;
}

const iconMap = {
  home: Home,
  users: Users,
  calendar: Calendar,
  calendarDays: CalendarDays,
  messages: MessageSquare,
  mail: Mail,
  info: Info,
  file: FileText,
  fileText: FileText,
  bell: Bell,
  checkSquare: CheckSquare,
  user: User,
} as const;

export function TopNav({ items, userName, userRole, isAdmin }: TopNavProps) {
  const pathname = usePathname();
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAdminDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const adminLinks = [
    { href: "/admin/announcements", icon: Bell, label: "Ankündigungen" },
    { href: "/admin/messages", icon: Mail, label: "Nachrichten" },
    { href: "/admin/todos", icon: CheckSquare, label: "ToDo" },
    { href: "/coaches/training-plans", icon: Calendar, label: "Trainingsplan" },
    { href: "/info/anwesenheit", icon: Calendar, label: "Anwesenheit" },
    { href: "/info/mitglieder", icon: Info, label: "Mitglieder" },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-7 left-0 right-0 z-50 px-4 pb-safe">
        <div className="max-w-sm mx-auto">
          <div className="bg-card/40 backdrop-blur-2xl border border-border/30 rounded-3xl shadow-lg shadow-black/10 p-2">
            <div className="flex justify-around items-center h-14 px-1">
              {items.map((item) => {
                const Icon = iconMap[item.icon];
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg transition-all ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
