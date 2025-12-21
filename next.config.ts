import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable image optimization (not supported on Cloudflare Pages)
  images: {
    unoptimized: true,
  },
  // Disable experimental features that may cause issues
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
