import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // We pre-generate thumb/medium/large WebP derivatives ourselves (seed
    // script for dev, the admin upload pipeline in production via sharp),
    // so Next's per-request image optimizer is unnecessary cost/latency —
    // we serve our own already-optimized files straight through the CDN.
    unoptimized: true,
    remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }],
  },
}

export default nextConfig
