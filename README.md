READMRAG Playground

Next.js + Supabase(pgvector) + OpenAI Embeddings로 구현한 간단한 RAG(Retrieval-Augmented Generation) 프로젝트입니다.
PDF 파일을 텍스트로 추출하고, 청크 단위로 나누어 임베딩을 Supabase에 저장한 후,
유사도 검색을 통해 관련된 내용을 찾아 답변을 생성합니다.
개발 환경은 GitHub Codespaces 기준입니다.

============================================================

기능 요약

PDF 텍스트 추출 및 청킹

OpenAI 임베딩(text-embedding-3-small) 기반 벡터 생성

Supabase(pgvector) 기반 벡터 검색

Next.js API Routes 기반 RAG Chat API

간단한 웹 UI 제공

Codespaces에서 로컬 환경 없이 개발 가능

Vercel로 간단하게 배포 가능

============================================================

프로젝트 구조

rag-playground/

README (현재 문서)

package.json

tsconfig.json

next.config.mjs

.env.local (ignored)

data/

sample.pdf

scripts/

ingest.ts (PDF → 벡터 DB)

lib/

supabase.ts

openai.ts

chunk.ts

app/

page.tsx

api/chat/route.ts

============================================================

환경 설정

의존성 설치
npm install

루트 디렉토리에 .env.local 생성
(SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE, OPENAI_API_KEY 입력)

SERVICE_ROLE 키는 ingest 스크립트와 서버(API Route)에서만 사용해야 합니다.

============================================================

Supabase 설정

pgvector 활성화
SQL Editor에서 실행:
create extension if not exists vector;

documents 테이블 생성
create table documents (
id bigserial primary key,
content text not null,
metadata jsonb,
embedding vector(1536)
);

match_documents 검색 함수 생성
(query_embedding, match_threshold, match_count를 입력받아
유사도 순으로 정렬된 청크 목록을 반환)

============================================================

PDF Ingest

명령 실행:
npm run ingest

ingest.ts가 data/sample.pdf를 읽어서
텍스트 추출 → 청킹 → 임베딩 생성 → Supabase 저장까지 수행합니다.

Supabase 콘솔에서 데이터 확인 가능:

select count(*) from documents;

============================================================

개발 서버 실행

npm run dev

브라우저에서 접속:
http://localhost:3000

텍스트 입력 → /api/chat 호출 → PDF 기반 RAG 응답 확인

============================================================

RAG 디버깅 팁

match_threshold 값을 낮추기 (예: 0.2 또는 0.0)
값을 너무 높게 잡으면 검색 결과가 비어 있을 수 있습니다.

Supabase에서 직접 검색 테스트
select * from match_documents((select embedding from documents limit 1), 0.0, 5);

Next.js API에서 matches 출력
console.log(matches);

응답에 sources 포함하여 UI에서 확인 가능

============================================================

배포

Vercel로 배포

GitHub Repo 연결

환경 변수 설정

Deploy

Supabase는 그대로 사용
배포 환경에서는 RLS 정책 고려 필요

============================================================

로드맵

사용자별 문서 업로드

여러 PDF ingest 지원

chunk overlap 적용

hybrid search (keyword + vector)

reranking 적용

streaming response 적용

============================================================

라이선스

MIT License

============================================================