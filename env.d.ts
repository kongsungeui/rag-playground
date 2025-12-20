/// <reference types="@cloudflare/workers-types" />

// Cloudflare bindings for Next.js on Pages
declare global {
  interface CloudflareEnv {
    DB: D1Database;
    VECTORIZE: VectorizeIndex;
    FILES: R2Bucket;
    OPENAI_API_KEY: string;
  }
}

// Document types
export interface Document {
  id: number;
  filename: string;
  file_type: 'pdf' | 'md';
  r2_key: string;
  file_size: number;
  uploaded_at: string;
  chunk_count: number;
}

export interface Chunk {
  id: number;
  document_id: number;
  chunk_index: number;
  content: string;
  vectorize_id: string;
  created_at: string;
}

// API types
export interface UploadResponse {
  success: boolean;
  document?: Document;
  error?: string;
}

export interface ChatRequest {
  query: string;
}

export interface ChatResponse {
  answer: string;
  sources: Array<{
    content: string;
    document_id: number;
    filename: string;
    chunk_index: number;
    similarity: number;
  }>;
}

export interface StatsResponse {
  total_documents: number;
  total_chunks: number;
  total_size: number;
  documents: Array<{
    id: number;
    filename: string;
    file_type: string;
    chunk_count: number;
    uploaded_at: string;
  }>;
}

export interface DeleteResponse {
  success: boolean;
  deleted_count?: number;
  error?: string;
}

export {};
