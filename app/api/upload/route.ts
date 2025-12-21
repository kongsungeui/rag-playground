// File upload API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';
import { detectFileType, extractText, validateFileSize } from '@/lib/parsers';
import { processDocument } from '@/lib/embeddings';
import { UploadResponse, Document } from '@/env';

// Force edge runtime for Cloudflare Pages
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // Get Cloudflare bindings
    const { db, files, vectorize, openaiApiKey } = getEnv();

    if (!openaiApiKey) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const extractedText = formData.get('extractedText') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileType = detectFileType(file.name);
    if (!fileType) {
      return NextResponse.json(
        { success: false, error: 'Unsupported file type. Only PDF and Markdown files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (!validateFileSize(file.size)) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from file
    let text: string;
    if (extractedText) {
      // Use pre-extracted text from client (for PDF files)
      console.log(`Using pre-extracted text from client for ${fileType} file: ${file.name}`);
      text = extractedText;
    } else {
      // Extract text on server (for Markdown files)
      console.log(`Extracting text from ${fileType} file: ${file.name}`);
      text = await extractText(buffer, fileType);
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'No text content found in file' },
        { status: 400 }
      );
    }

    // Generate R2 key
    const timestamp = Date.now();
    const r2Key = `uploads/${timestamp}-${file.name}`;

    // Upload original file to R2
    console.log(`Uploading to R2: ${r2Key}`);
    await files.put(r2Key, buffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Insert document metadata into D1
    const docResult = await db
      .prepare(
        'INSERT INTO documents (filename, file_type, r2_key, file_size, chunk_count) VALUES (?, ?, ?, ?, 0) RETURNING *'
      )
      .bind(file.name, fileType, r2Key, file.size)
      .first();

    if (!docResult) {
      throw new Error('Failed to insert document into database');
    }

    const documentId = (docResult as any).id;

    // Process document: chunk and create embeddings
    console.log(`Processing document ${documentId}: creating chunks and embeddings`);
    const chunks = await processDocument(text, openaiApiKey);

    console.log(`Created ${chunks.length} chunks`);

    // Store chunks in D1 and vectors in Vectorize
    const vectorIds: string[] = [];
    const chunkInserts: Promise<any>[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const vectorId = `doc-${documentId}-chunk-${i}`;
      vectorIds.push(vectorId);

      // Insert into Vectorize
      await vectorize.upsert([
        {
          id: vectorId,
          values: chunk.embedding,
          metadata: {
            document_id: documentId,
            chunk_index: i,
          },
        },
      ]);

      // Insert chunk into D1
      chunkInserts.push(
        db
          .prepare(
            'INSERT INTO chunks (document_id, chunk_index, content, vectorize_id) VALUES (?, ?, ?, ?)'
          )
          .bind(documentId, i, chunk.text, vectorId)
          .run()
      );
    }

    // Wait for all chunk insertions
    await Promise.all(chunkInserts);

    // Update document chunk_count
    await db
      .prepare('UPDATE documents SET chunk_count = ? WHERE id = ?')
      .bind(chunks.length, documentId)
      .run();

    // Fetch updated document
    const updatedDoc = await db
      .prepare('SELECT * FROM documents WHERE id = ?')
      .bind(documentId)
      .first() as any as Document;

    console.log(`Successfully processed document ${documentId} with ${chunks.length} chunks`);

    return NextResponse.json({
      success: true,
      document: updatedDoc,
    } as UploadResponse);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      } as UploadResponse,
      { status: 500 }
    );
  }
}
