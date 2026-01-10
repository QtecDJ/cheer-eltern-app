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
  },
  
  // Experimentelle Features für bessere Performance
  experimental: {
    // Optimierte Package-Imports
  },
};

export default nextConfig;
