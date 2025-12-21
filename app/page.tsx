"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import type { ChatResponse, StatsResponse, UploadResponse, DeleteResponse } from "@/env";

type Tab = "chat" | "upload" | "documents";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                RAG Playground
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Powered by Cloudflare Vectorize + D1 + R2
              </p>
            </div>
            <div className="flex gap-2">
              <TabButton
                active={activeTab === "chat"}
                onClick={() => setActiveTab("chat")}
              >
                💬 Chat
              </TabButton>
              <TabButton
                active={activeTab === "upload"}
                onClick={() => setActiveTab("upload")}
              >
                📤 Upload
              </TabButton>
              <TabButton
                active={activeTab === "documents"}
                onClick={() => setActiveTab("documents")}
              >
                📚 Documents
              </TabButton>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === "chat" && <ChatTab />}
        {activeTab === "upload" && <UploadTab />}
        {activeTab === "documents" && <DocumentsTab />}
      </div>
    </main>
  );
}

// Tab Button Component
function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-all ${
        active
          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

// Chat Tab Component
function ChatTab() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<ChatResponse['sources']>([]);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAnswer(null);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = (await res.json()) as ChatResponse & { error?: string };

      if (!res.ok) {
        throw new Error(data.error || "Failed to get answer");
      }

      setAnswer(data.answer);
      setSources(data.sources ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              질문을 입력하세요
            </label>
            <textarea
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              rows={4}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="업로드한 문서에 대해 질문해보세요..."
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "🤔 생각 중..." : "✨ 질문하기"}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-400">
          ❌ {error}
        </div>
      )}

      {answer && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            💡 답변
          </h3>
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {answer}
            </p>
          </div>
        </div>
      )}

      {sources.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            📄 사용된 컨텍스트
          </h3>
          <div className="space-y-3">
            {sources.map((s, i) => (
              <div
                key={i}
                className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-900"
              >
                <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mb-2">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                    {s.filename}
                  </span>
                  <span>Chunk #{s.chunk_index}</span>
                  <span>Similarity: {(s.similarity * 100).toFixed(1)}%</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3">
                  {s.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Upload Tab Component
function UploadTab() {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await res.json()) as UploadResponse;

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setUploadResult(data);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/markdown": [".md", ".markdown"],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          파일 업로드
        </h2>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
            isDragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500"
          } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input {...getInputProps()} />
          <div className="text-6xl mb-4">📁</div>
          {uploading ? (
            <p className="text-lg text-slate-600 dark:text-slate-400">
              업로드 중...
            </p>
          ) : isDragActive ? (
            <p className="text-lg text-blue-600 dark:text-blue-400 font-medium">
              파일을 여기에 드롭하세요
            </p>
          ) : (
            <>
              <p className="text-lg text-slate-700 dark:text-slate-300 font-medium mb-2">
                PDF 또는 Markdown 파일을 드래그하거나 클릭하세요
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                지원 형식: .pdf, .md, .markdown (최대 10MB)
              </p>
            </>
          )}
        </div>
      </div>

      {uploadError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-400">
          ❌ {uploadError}
        </div>
      )}

      {uploadResult?.success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
            ✅ 업로드 성공!
          </h3>
          <div className="space-y-2 text-sm text-green-800 dark:text-green-200">
            <p>파일명: {uploadResult.document?.filename}</p>
            <p>타입: {uploadResult.document?.file_type?.toUpperCase()}</p>
            <p>청크 수: {uploadResult.document?.chunk_count}개</p>
            <p>
              파일 크기: {((uploadResult.document?.file_size ?? 0) / 1024).toFixed(1)}{" "}
              KB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Documents Tab Component
function DocumentsTab() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | "all" | null>(null);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documents");
      const data = (await res.json()) as StatsResponse;
      setStats(data);
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const deleteDocument = async (id: number) => {
    if (!confirm("이 문서를 삭제하시겠습니까?")) return;

    setDeleting(id);
    try {
      await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
      await loadStats();
    } catch (err) {
      alert("삭제 실패: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setDeleting(null);
    }
  };

  const deleteAll = async () => {
    if (!confirm("모든 문서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다!"))
      return;

    setDeleting("all");
    try {
      await fetch("/api/documents?all=true", { method: "DELETE" });
      await loadStats();
    } catch (err) {
      alert("삭제 실패: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-600 dark:text-slate-400">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon="📚"
          label="전체 문서"
          value={stats?.total_documents || 0}
          unit="개"
        />
        <StatCard
          icon="📄"
          label="전체 청크"
          value={stats?.total_chunks || 0}
          unit="개"
        />
        <StatCard
          icon="💾"
          label="총 용량"
          value={((stats?.total_size ?? 0) / 1024 / 1024).toFixed(2)}
          unit="MB"
        />
      </div>

      {/* Documents List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            문서 목록
          </h2>
          {stats?.documents && stats.documents.length > 0 && (
            <button
              onClick={deleteAll}
              disabled={deleting === "all"}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all text-sm"
            >
              {deleting === "all" ? "삭제 중..." : "🗑️ 전체 삭제"}
            </button>
          )}
        </div>

        {!stats?.documents || stats.documents.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            업로드된 문서가 없습니다
          </div>
        ) : (
          <div className="space-y-3">
            {stats.documents.map((doc: any) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {doc.file_type === "pdf" ? "📕" : "📝"}
                    </span>
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-slate-100">
                        {doc.filename}
                      </h3>
                      <div className="flex gap-3 text-xs text-slate-600 dark:text-slate-400 mt-1">
                        <span>{doc.chunk_count} chunks</span>
                        <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                        <span>
                          {new Date(doc.uploaded_at).toLocaleDateString("ko-KR")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteDocument(doc.id)}
                  disabled={deleting === doc.id}
                  className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-all text-sm"
                >
                  {deleting === doc.id ? "삭제 중..." : "삭제"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  unit,
}: {
  icon: string;
  label: string;
  value: number | string;
  unit: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3">
        <div className="text-3xl">{icon}</div>
        <div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {value}
            <span className="text-sm font-normal text-slate-600 dark:text-slate-400 ml-1">
              {unit}
            </span>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}