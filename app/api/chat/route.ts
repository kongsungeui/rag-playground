// RAG Chat API endpoint using Cloudflare Vectorize + D1
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getEnv } from '@/lib/cloudflare';
import { createQueryEmbedding } from '@/lib/embeddings';
import { ChatRequest, ChatResponse } from '@/env';

// Force edge runtime for Cloudflare Pages
export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    // Get Cloudflare bindings
    const { db, vectorize, openaiApiKey } = getEnv();

    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Parse request
    const { query } = (await req.json()) as ChatRequest;

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // 1. Create query embedding
    console.log(`Creating embedding for query: ${query}`);
    const queryEmbedding = await createQueryEmbedding(query, openaiApiKey);

    // 2. Search Vectorize for similar vectors
    console.log('Searching Vectorize for similar documents');
    const searchResults = await vectorize.query(queryEmbedding, {
      topK: 3, // Get top 3 most relevant chunks
      returnMetadata: true,
    });

    if (!searchResults.matches || searchResults.matches.length === 0) {
      // No matches found
      const openai = new OpenAI({ apiKey: openaiApiKey });
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `다음 질문에 답변해주세요:\n\n"${query}"\n\n참고할 문서가 없으니, 일반적인 지식으로 답변해주세요. 답변은 한국어로 해주세요.`,
          },
        ],
      });

      return NextResponse.json({
        answer: completion.choices[0].message.content,
        sources: [],
      } as ChatResponse);
    }

    console.log(`Found ${searchResults.matches.length} matches`);

    // 3. Fetch chunk details from D1
    const chunkIds = searchResults.matches.map((match) => match.id);
    const placeholders = chunkIds.map(() => '?').join(',');

    const chunksResult = await db
      .prepare(
        `SELECT c.*, d.filename
         FROM chunks c
         JOIN documents d ON c.document_id = d.id
         WHERE c.vectorize_id IN (${placeholders})`
      )
      .bind(...chunkIds)
      .all();

    // 4. Build context and sources
    const sources = searchResults.matches.map((match, index) => {
      const chunk = chunksResult.results.find(
        (c: any) => c.vectorize_id === match.id
      );

      return {
        content: chunk?.content || '',
        document_id: match.metadata?.document_id || 0,
        filename: chunk?.filename || 'Unknown',
        chunk_index: match.metadata?.chunk_index || 0,
        similarity: match.score || 0,
      };
    });

    const contextText = sources.map((s) => s.content).join('\n\n---\n\n');

    // 5. Generate answer using OpenAI
    const prompt = `다음은 내가 가진 문서의 일부야:

${contextText}

위 내용을 참고해서 사용자 질문에 답변해줘.
질문: "${query}"

답변은 한국어로, 너무 장황하지 않게 해줘.`;

    console.log('Generating answer with LLM');

    const openai = new OpenAI({ apiKey: openaiApiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    });

    const answer = completion.choices[0].message.content;

    return NextResponse.json({
      answer,
      sources,
    } as ChatResponse);
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}