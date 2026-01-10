import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel-optimierte Konfiguration
  poweredByHeader: false,
  
  // Bilder-Domains erlauben (falls externe Bilder geladen werden)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Optimierte Bildformate
    formats: ['image/avif', 'image/webp'],
  },
  
  // PWA-optimierte Headers
  async headers() {
    return [
      {
        // Service Worker mit korrektem Scope
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        // Manifest.json cachen
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate',
          },
        ],
      },
      {
        // Icons länger cachen
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, immutable',
          },
        ],
      },
      {
        // Statische Assets cachen
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // Sicherheits-Headers für alle Routen
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Experimentelle Features für bessere Performance
  experimental: {
    // Optimierte Package-Imports
  },
};

export default nextConfig;
