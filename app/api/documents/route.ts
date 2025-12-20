// Documents management API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';
import { DeleteResponse } from '@/env';

// Force edge runtime for Cloudflare Pages
export const runtime = 'edge';

/**
 * GET /api/documents - Get all documents with stats
 */
export async function GET(request: NextRequest) {
  try {
    const { db } = getEnv();

    // Get all documents
    const documentsResult = await db
      .prepare(
        'SELECT id, filename, file_type, file_size, chunk_count, uploaded_at FROM documents ORDER BY uploaded_at DESC'
      )
      .all();

    // Get total stats
    const statsResult = await db
      .prepare(
        `SELECT
          COUNT(*) as total_documents,
          SUM(chunk_count) as total_chunks,
          SUM(file_size) as total_size
         FROM documents`
      )
      .first();

    return NextResponse.json({
      total_documents: (statsResult as any)?.total_documents || 0,
      total_chunks: (statsResult as any)?.total_chunks || 0,
      total_size: (statsResult as any)?.total_size || 0,
      documents: documentsResult.results,
    });
  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents?id=123 - Delete a specific document
 * DELETE /api/documents?all=true - Delete all documents
 */
export async function DELETE(request: NextRequest) {
  try {
    const { db, vectorize, files } = getEnv();
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get('id');
    const deleteAll = searchParams.get('all') === 'true';

    if (deleteAll) {
      // Delete all documents
      console.log('Deleting all documents');

      // Get all chunks to delete from Vectorize
      const chunksResult = await db.prepare('SELECT vectorize_id FROM chunks').all();

      // Delete from Vectorize
      if (chunksResult.results.length > 0) {
        const vectorIds = chunksResult.results.map((c: any) => c.vectorize_id);
        console.log(`Deleting ${vectorIds.length} vectors from Vectorize`);

        // Vectorize delete in batches (max 1000 per request)
        const batchSize = 1000;
        for (let i = 0; i < vectorIds.length; i += batchSize) {
          const batch = vectorIds.slice(i, i + batchSize);
          await vectorize.deleteByIds(batch);
        }
      }

      // Get all R2 keys to delete
      const docsResult = await db.prepare('SELECT r2_key FROM documents').all();

      // Delete from R2
      if (docsResult.results.length > 0) {
        console.log(`Deleting ${docsResult.results.length} files from R2`);
        for (const doc of docsResult.results) {
          await files.delete((doc as any).r2_key);
        }
      }

      // Delete from D1 (cascades to chunks)
      await db.prepare('DELETE FROM documents').run();

      console.log('Successfully deleted all documents');

      return NextResponse.json({
        success: true,
        deleted_count: docsResult.results.length,
      } as DeleteResponse);
    } else if (documentId) {
      // Delete specific document
      const docId = parseInt(documentId);

      if (isNaN(docId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid document ID' },
          { status: 400 }
        );
      }

      console.log(`Deleting document ${docId}`);

      // Get document info
      const doc = await db
        .prepare('SELECT r2_key FROM documents WHERE id = ?')
        .bind(docId)
        .first();

      if (!doc) {
        return NextResponse.json(
          { success: false, error: 'Document not found' },
          { status: 404 }
        );
      }

      // Get chunks to delete from Vectorize
      const chunksResult = await db
        .prepare('SELECT vectorize_id FROM chunks WHERE document_id = ?')
        .bind(docId)
        .all();

      // Delete from Vectorize
      if (chunksResult.results.length > 0) {
        const vectorIds = chunksResult.results.map((c: any) => c.vectorize_id);
        console.log(`Deleting ${vectorIds.length} vectors from Vectorize`);
        await vectorize.deleteByIds(vectorIds);
      }

      // Delete from R2
      await files.delete((doc as any).r2_key);

      // Delete from D1 (cascades to chunks)
      await db.prepare('DELETE FROM documents WHERE id = ?').bind(docId).run();

      console.log(`Successfully deleted document ${docId}`);

      return NextResponse.json({
        success: true,
        deleted_count: 1,
      } as DeleteResponse);
    } else {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: id or all' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      } as DeleteResponse,
      { status: 500 }
    );
  }
}
