// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { supabaseServer } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  // 1. 사용자 질문 → 임베딩
  const embRes = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });
  const queryEmbedding = embRes.data[0].embedding;

  // 2. Supabase RPC 호출
  const { data: matches, error } = await supabaseServer.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_threshold: 0.2,
    match_count: 1,
  });

  console.log("Supabase matches:", matches, error);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "search_failed" }, { status: 500 });
  }

  const contextText = (matches ?? [])
    .map((m: any) => m.content)
    .join("\n\n---\n\n");

  const prompt = `
다음은 내가 가진 문서의 일부야:

${contextText}

위 내용을 참고해서 사용자 질문에 답변해줘.
질문: "${query}"

답변은 한국어로, 너무 장황하지 않게 해줘.
`;

console.log("Prompt to LLM:", prompt);

  // 3. ChatCompletion 호출
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  const answer = completion.choices[0].message.content;

  return NextResponse.json({
    answer,
    sources: matches ?? [],
  });
}