// app/page.tsx
"use client";

import { useState } from "react";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<any[]>([]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAnswer(null);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const data = await res.json();
    setAnswer(data.answer);
    setSources(data.sources ?? []);
    setLoading(false);
  };

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">RAG Playground</h1>

      <form onSubmit={onSubmit} className="mb-4 space-y-2">
        <textarea
          className="w-full border rounded p-2"
          rows={3}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="PDF 내용에 대해 질문해보세요..."
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="border px-4 py-2 rounded"
        >
          {loading ? "생각 중..." : "질문하기"}
        </button>
      </form>

      {answer && (
        <div className="mt-4 border rounded p-3 whitespace-pre-wrap">
          {answer}
        </div>
      )}

      {sources.length > 0 && (
        <div className="mt-4 border rounded p-3 text-sm">
          <div className="font-bold mb-1">사용된 컨텍스트</div>
          {sources.map((s, i) => (
            <div key={i} className="mb-2 border-t pt-2">
              <div className="text-xs text-gray-500">
                source: {s.metadata?.source} / chunk: {s.metadata?.chunk_index} / sim: {s.similarity?.toFixed?.(3)}
              </div>
              <div className="whitespace-pre-wrap mt-1">
                {s.content.slice(0, 200)}…
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}