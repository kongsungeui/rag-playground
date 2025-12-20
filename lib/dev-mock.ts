// Mock Cloudflare bindings for local development
// Use this when Cloudflare resources are not available

export const mockCloudflareEnv = () => {
  if (process.env.NODE_ENV === 'development' && !process.env.CLOUDFLARE_API_TOKEN) {
    console.warn('⚠️  Running in DEV mode with mock Cloudflare bindings');
    console.warn('⚠️  API calls will fail - this is for UI testing only');

    return {
      db: null as any,
      vectorize: null as any,
      files: null as any,
      openaiApiKey: process.env.OPENAI_API_KEY || '',
    };
  }
  return null;
};

// Mock stats data for testing UI
export const mockStats = {
  total_documents: 3,
  total_chunks: 42,
  total_size: 1024 * 1024 * 2.5, // 2.5 MB
  documents: [
    {
      id: 1,
      filename: 'sample.pdf',
      file_type: 'pdf',
      file_size: 1024 * 500, // 500 KB
      chunk_count: 15,
      uploaded_at: new Date().toISOString(),
    },
    {
      id: 2,
      filename: 'README.md',
      file_type: 'md',
      file_size: 1024 * 50, // 50 KB
      chunk_count: 5,
      uploaded_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 3,
      filename: 'guide.pdf',
      file_type: 'pdf',
      file_size: 1024 * 1500, // 1.5 MB
      chunk_count: 22,
      uploaded_at: new Date(Date.now() - 172800000).toISOString(),
    },
  ],
};
