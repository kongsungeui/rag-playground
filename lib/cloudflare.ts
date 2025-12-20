// Cloudflare bindings helper for Next.js on Pages
import { CloudflareEnv } from '@/env';

/**
 * Get Cloudflare environment bindings from the request context
 * This works with @cloudflare/next-on-pages
 */
export function getCloudflareContext(): CloudflareEnv {
  // @ts-ignore - process.env is extended by Cloudflare Pages
  const env = process.env as unknown as CloudflareEnv;

  if (!env.DB || !env.VECTORIZE || !env.FILES) {
    throw new Error('Cloudflare bindings not available. Make sure you are running on Cloudflare Pages.');
  }

  return env;
}

/**
 * Get environment variables safely
 */
export function getEnv() {
  const context = getCloudflareContext();
  return {
    db: context.DB,
    vectorize: context.VECTORIZE,
    files: context.FILES,
    openaiApiKey: context.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  };
}
