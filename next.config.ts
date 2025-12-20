import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable image optimization (not supported on Cloudflare Pages)
  images: {
    unoptimized: true,
  },

  // Webpack configuration for Cloudflare compatibility
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
};

export default nextConfig;
