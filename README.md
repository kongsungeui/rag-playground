# RAG Playground

**Cloudflare Vectorize + D1 + R2 + Next.js**로 구현한 풀스택 RAG (Retrieval-Augmented Generation) 프로젝트입니다.

PDF와 Markdown 파일을 업로드하고, OpenAI 임베딩을 사용하여 벡터 검색 기반 질의응답을 제공합니다.

## ✨ 주요 기능

- 📤 **파일 업로드**: PDF 및 Markdown 파일 드래그앤드롭 업로드
- 🤖 **RAG 챗봇**: 업로드된 문서 기반 질의응답
- 📊 **문서 관리**: 벡터 통계 대시보드 및 문서 삭제 기능
- 🌍 **Cloudflare Edge**: 글로벌 엣지 네트워크에서 실행
- 🎨 **모던 UI**: 다크모드 지원, 탭 기반 인터페이스

## 🏗️ 아키텍처

```
┌─────────────────────────────────────────┐
│      Cloudflare Pages (Next.js)         │
│         - Chat UI                        │
│         - File Upload UI                 │
│         - Document Management UI         │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Cloudflare Workers (Edge API)      │
│  /api/chat  │  /api/upload  │  /api/docs│
└─────────────────────────────────────────┘
        ↓               ↓               ↓
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Vectorize  │  │     D1      │  │     R2      │
│  (Vectors)  │  │ (Metadata)  │  │   (Files)   │
└─────────────┘  └─────────────┘  └─────────────┘
```

### 데이터 흐름

1. **파일 업로드**: R2에 원본 파일 저장
2. **텍스트 추출**: PDF/MD 파싱
3. **청킹**: 1000자 단위로 분할
4. **임베딩**: OpenAI text-embedding-3-small (1536차원)
5. **저장**:
   - Vectorize: 벡터 임베딩
   - D1: 문서 메타데이터 및 청크 내용
6. **검색**: 쿼리 임베딩 → Vectorize 유사도 검색 → D1에서 내용 조회
7. **생성**: OpenAI GPT-4o-mini로 답변 생성

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. Cloudflare 계정 설정

1. [Cloudflare Dashboard](https://dash.cloudflare.com)에서 계정 생성
2. Wrangler CLI로 로그인:

```bash
npx wrangler login
```

### 3. D1 데이터베이스 생성

```bash
npx wrangler d1 create rag-db
```

출력된 `database_id`를 `wrangler.toml`의 `database_id` 필드에 복사하세요.

### 4. D1 마이그레이션 실행

```bash
npm run cf:d1:migrate:local  # 로컬 개발용
npm run cf:d1:migrate         # 프로덕션용
```

### 5. Vectorize 인덱스 생성

```bash
npx wrangler vectorize create rag-embeddings --dimensions=1536 --metric=cosine
```

### 6. R2 버킷 생성

```bash
npx wrangler r2 bucket create rag-files
```

### 7. OpenAI API 키 설정

```bash
npx wrangler secret put OPENAI_API_KEY
# 프롬프트에서 OpenAI API 키 입력
```

로컬 개발용으로 `.env.local` 파일도 생성:

```bash
cp .env.example .env.local
# .env.local에 OPENAI_API_KEY 입력
```

### 8. 로컬 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

### 9. Cloudflare Pages 배포

**방법 1: Cloudflare Dashboard 사용 (권장)**

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**

2. GitHub 저장소 선택: `kongsungeui/rag-playground`

3. 빌드 설정:
   - **Framework preset**: Next.js
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
   - **Root directory**: (비워두기)

4. 환경 변수 추가:
   - `NODE_VERSION`: `20`
   - `OPENAI_API_KEY`: (여기에 OpenAI API 키 입력)

5. **Deploy** 클릭

6. 첫 배포 완료 후, **Settings** → **Functions** → **Bindings**에서 추가:
   - **D1 database bindings**:
     - Variable name: `DB`
     - D1 database: `rag-db`
   - **Vectorize bindings**:
     - Variable name: `VECTORIZE`
     - Index: `rag-embeddings`
   - **R2 bindings**:
     - Variable name: `FILES`
     - Bucket: `rag-files`

7. **Redeploy**로 바인딩 적용

**방법 2: GitHub Actions로 리소스만 생성**

리포지토리에 Secrets 추가:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Actions 탭에서 "Setup Cloudflare Resources" 워크플로우 수동 실행

## 📁 프로젝트 구조

```
rag-playground/
├── app/
│   ├── page.tsx              # 메인 UI (Chat, Upload, Documents 탭)
│   ├── layout.tsx
│   └── api/
│       ├── chat/route.ts     # RAG 검색 API
│       ├── upload/route.ts   # 파일 업로드 API
│       └── documents/route.ts # 문서 관리 API
├── lib/
│   ├── cloudflare.ts         # Cloudflare 바인딩 헬퍼
│   ├── parsers.ts            # PDF/MD 파서
│   ├── embeddings.ts         # OpenAI 임베딩 생성
│   ├── chunk.ts              # 텍스트 청킹 유틸
│   └── openai.ts             # OpenAI 클라이언트
├── migrations/
│   └── 0001_initial_schema.sql # D1 데이터베이스 스키마
├── wrangler.toml             # Cloudflare 설정
├── env.d.ts                  # TypeScript 타입 정의
└── package.json
```

## 🗄️ 데이터베이스 스키마

### D1 테이블

**documents** - 업로드된 문서 메타데이터

| Column      | Type    | Description                |
| ----------- | ------- | -------------------------- |
| id          | INTEGER | Primary key                |
| filename    | TEXT    | 파일명                     |
| file_type   | TEXT    | 'pdf' 또는 'md'            |
| r2_key      | TEXT    | R2 저장 키                 |
| file_size   | INTEGER | 파일 크기 (bytes)          |
| uploaded_at | DATETIME| 업로드 시간                |
| chunk_count | INTEGER | 청크 개수                  |

**chunks** - 텍스트 청크 및 벡터 참조

| Column       | Type    | Description                |
| ------------ | ------- | -------------------------- |
| id           | INTEGER | Primary key                |
| document_id  | INTEGER | documents 외래 키          |
| chunk_index  | INTEGER | 청크 순서                  |
| content      | TEXT    | 텍스트 내용                |
| vectorize_id | TEXT    | Vectorize 벡터 ID          |
| created_at   | DATETIME| 생성 시간                  |

### Vectorize 인덱스

- **rag-embeddings**
  - Dimensions: 1536 (OpenAI text-embedding-3-small)
  - Metric: Cosine similarity
  - Metadata: `{ document_id, chunk_index }`

## 📡 API 엔드포인트

### POST `/api/chat`

RAG 기반 질의응답

**Request:**

```json
{
  "query": "사용자 질문"
}
```

**Response:**

```json
{
  "answer": "생성된 답변",
  "sources": [
    {
      "content": "청크 내용",
      "document_id": 1,
      "filename": "sample.pdf",
      "chunk_index": 0,
      "similarity": 0.85
    }
  ]
}
```

### POST `/api/upload`

파일 업로드 (PDF/MD)

**Request:** `multipart/form-data` with `file` field

**Response:**

```json
{
  "success": true,
  "document": {
    "id": 1,
    "filename": "document.pdf",
    "file_type": "pdf",
    "chunk_count": 12
  }
}
```

### GET `/api/documents`

문서 목록 및 통계 조회

**Response:**

```json
{
  "total_documents": 5,
  "total_chunks": 47,
  "total_size": 1024000,
  "documents": [...]
}
```

### DELETE `/api/documents?id=1`

특정 문서 삭제

### DELETE `/api/documents?all=true`

모든 문서 삭제

## 🔧 개발 가이드

### 로컬 개발

```bash
npm run dev              # Next.js 개발 서버
npm run preview          # Cloudflare Pages 로컬 프리뷰
```

### 빌드

```bash
npm run build            # Next.js 빌드
npm run pages:build      # Cloudflare Pages 빌드
```

### 배포

```bash
npm run deploy           # Cloudflare Pages에 배포
```

### D1 데이터베이스 관리

```bash
# 로컬 D1 쿼리
npx wrangler d1 execute rag-db --local --command "SELECT * FROM documents"

# 프로덕션 D1 쿼리
npx wrangler d1 execute rag-db --command "SELECT COUNT(*) FROM documents"
```

### Vectorize 관리

```bash
# 인덱스 정보 확인
npx wrangler vectorize get rag-embeddings

# 인덱스 삭제
npx wrangler vectorize delete rag-embeddings
```

## 🐛 문제 해결

### 업로드가 실패합니다

- OpenAI API 키가 설정되어 있는지 확인
- 파일 크기가 10MB 이하인지 확인
- PDF 파일이 손상되지 않았는지 확인

### 검색 결과가 없습니다

- 문서가 업로드되어 있는지 확인 (Documents 탭)
- Vectorize 인덱스가 생성되었는지 확인
- D1 마이그레이션이 실행되었는지 확인

### Edge Runtime 오류

- `export const runtime = 'edge'`가 API routes에 있는지 확인
- Node.js 전용 라이브러리 사용 여부 확인

## 📊 비용 예상

Cloudflare의 무료 플랜으로 시작할 수 있습니다:

- **Pages**: 500 빌드/월
- **Workers**: 100,000 요청/일
- **D1**: 5GB 저장, 500만 읽기/일
- **R2**: 10GB 저장, 1백만 읽기/월
- **Vectorize**: 30만 쿼리 차원/월, 500만 저장 차원

OpenAI 비용:
- **Embeddings**: ~$0.02 / 1M 토큰
- **GPT-4o-mini**: ~$0.15 / 1M 입력 토큰

## 🛣️ 로드맵

- [x] PDF/MD 파일 업로드
- [x] 벡터 검색 기반 RAG
- [x] 문서 관리 UI
- [ ] Chunk overlap 적용
- [ ] Hybrid search (키워드 + 벡터)
- [ ] 스트리밍 응답
- [ ] 사용자 인증
- [ ] 다국어 지원

## 📄 라이선스

MIT License

## 🤝 기여

이슈 및 PR은 언제나 환영합니다!

---

**Made with ❤️ using Cloudflare's Edge Platform**
