import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Supabase가 설정되었는지 여부 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

/** 브라우저용 Supabase 클라이언트 (미설정 시 null) */
export function createClient() {
  if (!supabaseUrl || !supabaseKey) return null;
  return createBrowserClient(supabaseUrl, supabaseKey);
}
