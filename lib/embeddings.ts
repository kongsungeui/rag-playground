// Embedding generation utilities

import OpenAI from 'openai';
import { simpleChunkText } from './chunk';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Create embeddings for text chunks
 */
export async function createEmbeddings(
  texts: string[],
  apiKey: string
): Promise<number[][]> {
  const openai = new OpenAI({ apiKey });

  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
    });

    return response.data.map((item) => item.embedding);
  } catch (error) {
    throw new Error(
      `Failed to create embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Create a single embedding for a query
 */
export async function createQueryEmbedding(
  query: string,
  apiKey: string
): Promise<number[]> {
  const embeddings = await createEmbeddings([query], apiKey);
  return embeddings[0];
}

/**
 * Process document: chunk text and create embeddings
 */
export async function processDocument(
  text: string,
  apiKey: string,
  maxChunkSize: number = 1000
): Promise<Array<{ text: string; embedding: number[] }>> {
  // 1. Chunk the text
  const chunks = simpleChunkText(text, maxChunkSize);

  if (chunks.length === 0) {
    throw new Error('No chunks created from document');
  }

  // 2. Create embeddings for all chunks
  const embeddings = await createEmbeddings(chunks, apiKey);

  // 3. Combine chunks and embeddings
  return chunks.map((text, index) => ({
    text,
    embedding: embeddings[index],
  }));
}

export { EMBEDDING_MODEL, EMBEDDING_DIMENSIONS };
