import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable image optimization (not supported on Cloudflare Pages)
  images: {
    unoptimized: true,
  },
  // Generate build trace for Cloudflare adapter
  outputFileTracingRoot: process.cwd(),
  // Ensure proper output for Cloudflare Pages
  output: 'standalone',
};

export default nextConfig;
