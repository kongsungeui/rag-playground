// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE!;

// 클라이언트: 브라우저/서버 공용으로 쓸 때 (anon)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// 서버에서만 쓸 서비스 롤 (ingest, RAG 검색 등)
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRole);