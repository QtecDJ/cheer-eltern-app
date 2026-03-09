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
  CalendarDays,
  Shield,
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
      {/* ── Desktop Top Navigation ─────────────────────────────────── */}
      <nav className="hidden lg:flex fixed top-0 left-0 right-0 z-50 h-14 bg-card/80 backdrop-blur-xl border-b border-border items-center px-6">
        <div className="max-w-6xl mx-auto w-full flex items-center gap-2">

          {/* Logo + Brand */}
          <Link href="/" className="flex items-center gap-2 mr-4 shrink-0">
            <Image
              src="/icons/icon-192x192.png"
              alt="Logo"
              width={28}
              height={28}
              className="rounded-xl"
            />
            <span className="font-semibold text-sm text-foreground">Member App</span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-0.5">
            {items.map((item) => {
              const Icon = iconMap[item.icon];
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(item.href + "/"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right — Admin + User */}
          <div className="ml-auto flex items-center gap-1">

            {/* Admin Dropdown */}
            {isAdmin && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    adminDropdownOpen
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  Admin
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${adminDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {adminDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-card border border-border rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                    {adminLinks.map((link) => {
                      const LinkIcon = link.icon;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setAdminDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                        >
                          <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Profile link */}
            <Link
              href="/profil"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/profil"
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              {userName || "Profil"}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Mobile Bottom Navigation ───────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-7 left-0 right-0 z-50 px-4 pb-safe">
        <div className="max-w-sm mx-auto">
          <div className="bg-card/40 backdrop-blur-2xl border border-border/30 rounded-3xl shadow-lg shadow-black/10 p-2">
            <div className="flex justify-around items-center h-14 px-1">
              {items.map((item) => {
                const Icon = iconMap[item.icon];
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname?.startsWith(item.href + "/"));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg transition-all ${
                      isActive ? "text-primary" : "text-muted-foreground"
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
