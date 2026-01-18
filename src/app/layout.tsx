import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNav, type NavItem } from "@/components/bottom-nav";
import { getSession } from "@/lib/auth";
import { ServiceWorkerRegistration } from "@/components/service-worker";
import { InstallPrompt } from "@/components/install-prompt";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { ContentCacheInit } from "@/components/content-cache-init";
import { OfflineIndicator } from "@/components/offline-indicator";
import { cn } from "@/lib/utils";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

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
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  
  // OPTIMIZATION: Use session data (cached) instead of DB query
  // This prevents duplicate DB calls on every page navigation
  const userRole = session?.userRole || null;
  
  // Nav-Items basierend auf Rolle erstellen (serverseitig)
  const isAdminOrTrainer = userRole === "admin" || userRole === "trainer" || userRole === "coach";
  const navItems: NavItem[] = [
    { href: "/", icon: "Home", label: "Home" },
    { href: "/training", icon: "Calendar", label: "Training" },
    { href: "/events", icon: "CalendarDays", label: "Events" },
    { href: "/dokumente", icon: "File", label: "Dokumente" },
    { href: "/berichte", icon: "BookOpen", label: "Berichte" },
  ];
  if (isAdminOrTrainer) {
    navItems.push({ href: "/info", icon: "ClipboardList", label: "Info" });
  }
  navItems.push({ href: "/profil", icon: "User", label: "Profil" });
  
  return (
    <html lang="de">
      <head>
        {/* PWA iOS Spezifisch */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Member" />
        {/* Apple Touch Icons - iOS sucht auch nach /apple-touch-icon.png */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        
        {/* Theme Color für verschiedene Modi */}
        <meta name="theme-color" content="#ec4899" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)" />
        
        {/* Android Chrome */}
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Verhindert Zoom beim Input Focus (iOS) */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-slate-900 text-white`}
      >
        <ServiceWorkerRegistration />
        <InstallPrompt />
        <ContentCacheInit />
        <OfflineIndicator />
        {session && <BottomNav items={navItems} />}
        <PullToRefresh>
          <main className={cn(
            "min-h-screen safe-area-inset",
            session ? "pb-20" : ""
          )}>
            <div className="w-full md:max-w-4xl lg:max-w-5xl xl:max-w-7xl md:mx-auto md:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </PullToRefresh>
      </body>
    </html>
  );
}
