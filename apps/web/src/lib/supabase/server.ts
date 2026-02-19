// ========================================
// サーバーサイド専用の Supabase クライアント
// ブラウザには一切公開されない（NEXT_PUBLIC_ なし）
// ========================================

import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// 環境変数のチェック（NEXT_PUBLIC_ なし = サーバー専用）
const supabaseUrl = process.env.SUPABASE_URL;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "環境変数 SUPABASE_URL と SUPABASE_PUBLISHABLE_KEY を設定してください"
  );
}

/**
 * SSR 用クライアント（Cookie ベースのセッション管理）
 * API Route や Server Component から使う
 * ユーザーのセッション情報を Cookie から読み書きする
 */
export async function createSSRClient() {
  const cookieStore = await cookies();
  return createSSRServerClient(supabaseUrl!, supabasePublishableKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component から呼ばれた場合は Cookie の書き込みができない
          // middleware でセッションリフレッシュするので問題ない
        }
      },
    },
  });
}

/**
 * 管理者用クライアント（Secret key を使用）
 * RLS をバイパスして直接 DB を操作する
 * allowed_users テーブルのチェックなど、特権操作に使う
 */
export function createAdminClient() {
  if (!supabaseSecretKey) {
    throw new Error(
      "環境変数 SUPABASE_SECRET_KEY を設定してください"
    );
  }
  return createClient(supabaseUrl!, supabaseSecretKey);
}
