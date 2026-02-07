// ========================================
// サーバーサイド用の Supabase クライアント
// API Route（route.ts）の中で使う
// リクエストごとに新しいクライアントを作成する
// ========================================

import { createClient } from "@supabase/supabase-js";

// 環境変数のチェック（起動時にエラーを出す）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "環境変数 NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください"
  );
}

/**
 * サーバーサイド用の Supabase クライアントを作成する
 * API Route のハンドラー内で呼び出して使う
 *
 * @param accessToken - リクエストヘッダーから取得した Bearer トークン
 * @returns Supabase クライアント
 */
export function createServerClient(accessToken?: string) {
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    global: {
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {},
    },
  });
}
