import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TopNav, type NavItem } from "@/components/top-nav";
import { getSession, isAdminOrTrainer } from "@/lib/auth";
import { ServiceWorkerRegistration } from "@/components/service-worker";
import { InstallPrompt } from "@/components/install-prompt";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { ContentCacheInit } from "@/components/content-cache-init";
import { OfflineIndicator } from "@/components/offline-indicator";
import { OneSignalInit } from "@/components/OneSignalInit";
import AdminQuickButton from "@/components/admin/AdminQuickButton";
import { ProfileProvider } from "@/modules/profile-switcher/ProfileContext";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Member App",
  description: "Die App für Vereinsmitglieder - Trainings, Events und mehr",
  manifest: "/manifest.json",
  applicationName: "Member App",
  authors: [{ name: "ICA-Dev Kai Püttmann", url: "https://ica-dev.de" }],
  creator: "ICA-Dev Kai Püttmann",
  publisher: "ICA-Dev",
  keywords: ["Verein", "Mitglieder", "Training", "Events", "Cheerleading"],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Member App",
    startupImage: [
      {
        url: "/splash/splash-640x1136.png",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/splash/splash-750x1334.png",
        media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/splash/splash-1242x2208.png",
        media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/splash-1125x2436.png",
        media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/splash-1284x2778.png",
        media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)",
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "ICA Members App",
    title: "ICA Members App",
    description: "Vereinsmanagement by ICA-Dev – Kai Püttmann",
    url: "https://icacheer.space/",
    images: [
      {
        url: "https://icacheer.space/logo.webp",
        width: 800,
        height: 800,
        alt: "ICA Members App Logo",
      },
    ],
    locale: "de_DE",
  },
  twitter: {
    card: "summary_large_image",
    title: "ICA Members App",
    description: "Vereinsmanagement by ICA-Dev – Kai Püttmann",
    images: ["https://icacheer.space/logo.webp"],
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "msapplication-TileColor": "#ec4899",
    "msapplication-tap-highlight": "no",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ec4899" },
    { media: "(prefers-color-scheme: dark)", color: "#ec4899" },
  ],
};

/**
 * Root Layout - Optimized for minimal DB calls
 * 
 * CRITICAL: Layout is rendered for EVERY page, so NO database queries here.
 * All user data must come from cached session to prevent duplicate queries.
 * 
 * Neon Optimization:
 * - Removed DB query that was executed on every page load
 * - Use session.userRole instead (cached in cookie)
 * - Reduces DB calls by ~50% (was: layout + page, now: only page)
 */

import { cookies } from "next/headers";

// Layout uses session from cookies (no DB queries) - dynamic rendering needed for auth

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  
  const userRole = session?.userRole || null;
  const hasAdminAccess = isAdminOrTrainer(session?.roles ?? userRole ?? null);
  const navItems: NavItem[] = [
    { href: "/", icon: "home", label: "Home" },
    { href: "/training", icon: "calendar", label: "Training" },
    { href: "/messages", icon: "mail", label: "Nachricht" },
    { href: "/events", icon: "calendarDays", label: "Events" },
    { href: "/dokumente", icon: "fileText", label: "Dokumente" },
    { href: "/profil", icon: "user", label: "Profil" },
  ];

  return (
    <html lang="de">
      <head>
        {/* ...existing code... */}
      </head>
      <body className={"font-sans antialiased bg-slate-900 text-white"}>
        {session ? (
          <ProfileProvider>
            <ServiceWorkerRegistration />
            <InstallPrompt />
            <ContentCacheInit />
            <OfflineIndicator />
            <OneSignalInit />
            
            <TopNav items={navItems} userName={session.firstName || undefined} userRole={userRole || undefined} isAdmin={hasAdminAccess} />
            {hasAdminAccess && <AdminQuickButton />}
            
            <PullToRefresh>
              <main className={cn(
                "min-h-screen safe-area-inset w-full pb-20"
              )}>
                {children}
              </main>
            </PullToRefresh>
          </ProfileProvider>
        ) : (
          <PullToRefresh>
            <main className="min-h-screen safe-area-inset w-full">
              {children}
            </main>
          </PullToRefresh>
        )}
      </body>
    </html>
  );
}
