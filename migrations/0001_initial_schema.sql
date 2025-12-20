-- D1 Database Schema for RAG Playground

-- Documents table: stores metadata about uploaded files
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'pdf' or 'md'
  r2_key TEXT NOT NULL UNIQUE, -- R2 storage key
  file_size INTEGER NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  chunk_count INTEGER DEFAULT 0
);

-- Chunks table: stores text chunks and links to Vectorize embeddings
CREATE TABLE IF NOT EXISTS chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  vectorize_id TEXT NOT NULL UNIQUE, -- ID in Vectorize index
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_vectorize_id ON chunks(vectorize_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents(uploaded_at DESC);
