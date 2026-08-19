import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'prisma'],
  async headers() {
    return [
      {
        // Service Worker must NEVER be cached by Vercel CDN or browser HTTP cache
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        // offline.html must be cacheable but always fresh
        source: '/offline.html',
        headers: [
          { key: 'Cache-Control', value: 'no-cache' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ]
  },
};

export default nextConfig;
