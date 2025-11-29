📘 RAG Playground

Next.js + Supabase + OpenAI Embeddings로 만든 간단한 RAG(Retrieval-Augmented Generation) 프로젝트입니다.
PDF 파일을 청크로 나누고, 임베딩을 생성하여 Supabase(pgvector)에 저장한 후,
질문 시 가장 관련 있는 청크를 찾아 OpenAI 모델에게 전달하여 답변을 생성합니다.

개발은 GitHub Codespaces를 기준으로 구성되어 있습니다.

✨ Features

📄 PDF ingestion: PDF 텍스트 추출 → 청킹 → 임베딩 → Supabase 저장

🔍 벡터 검색(pgvector): OpenAI 임베딩 기반 similarity search

🤖 Next.js API Route 기반 RAG Chat API

🖥️ 간단한 웹 UI: / 페이지에서 질문→답변 가능

☁️ Supabase + Vercel로 배포 가능

🧪 Codespaces friendly: 로컬 설치 없이 개발 가능

📁 Project Structure
rag-playground/
  README.md
  package.json
  tsconfig.json
  next.config.mjs
  .env.local (ignored)
  
  data/
    sample.pdf             # ingestion 대상 PDF

  scripts/
    ingest.ts              # PDF to vector DB

  lib/
    supabase.ts            # Supabase client
    openai.ts              # OpenAI client
    chunk.ts               # Text chunking logic

  app/
    page.tsx               # Chat UI
    api/
      chat/
        route.ts           # RAG API

⚙️ Setup
1. Install dependencies

Codespaces에서:

npm install

2. Create .env.local

프로젝트 루트에 .env.local 파일 생성:

# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_SERVICE_ROLE=your-service-role-key

# OpenAI
OPENAI_API_KEY=your-openai-key


SERVICE_ROLE은 절대 클라이언트 컴포넌트에서 사용하면 안 됨
ingest 스크립트와 API Routes에서만 사용됩니다.

🛠 Supabase Setup
1. pgvector 활성화

Supabase SQL Editor:

create extension if not exists vector;

2. documents 테이블 생성
create table if not exists documents (
  id bigserial primary key,
  content text not null,
  metadata jsonb,
  embedding vector(1536)
);

3. 검색 함수 생성
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language sql
stable
as $$
  select
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) as similarity
  from documents d
  where d.embedding is not null
    and 1 - (d.embedding <=> query_embedding) > match_threshold
  order by d.embedding <=> query_embedding
  limit match_count;
$$;

📥 Ingest PDF

PDF를 Supabase 벡터 DB에 넣는 스크립트:

npm run ingest


scripts/ingest.ts가 실행됨

data/sample.pdf 를 읽어서 청킹→임베딩→DB insert

테이블 확인:

select count(*) from documents;
select id, left(content, 80) from documents limit 5;

🤖 Run Dev Server
npm run dev


브라우저에서:

http://localhost:3000


텍스트 입력 → /api/chat 호출 → PDF 기반 답변 생성

사용된 청크(sources)를 함께 확인 가능

🧪 Debugging RAG

벡터 검색이 잘 되는지 확인하려면:

Threshold 낮추기

match_threshold: 0.2 또는 0.0 으로 설정

Supabase에서 직접 테스트
select *
from match_documents(
  (select embedding from documents limit 1),
  0.0,
  5
);

🚀 Deployment
1. Vercel (프론트+API)

GitHub repo → Import into Vercel

Environment Variables에 .env.local 값 입력

Deploy 클릭

2. Supabase

그대로 사용

production 환경에서는 RLS 정책 고려 필요

🔮 Roadmap (Optional)

Auth + 사용자별 문서 업로드

다중 문서 ingestion

chunk overlap 도입

hybrid search (keyword + vector)

reranking 모델 적용

streaming response (Server Actions or Route Handlers)

📝 License

MIT License.