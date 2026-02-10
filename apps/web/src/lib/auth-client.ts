// ========================================
// フロントエンド（ブラウザ）用の認証ユーティリティ
// Googleログイン、ログアウト、セッション取得の関数
// ========================================

import { supabase } from "@/lib/supabase/client";

/**
 * Google アカウントでログインする
 * クリックすると Google のログイン画面に飛ぶ
 */
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      // ログイン成功後にリダイレクトされるURL
      // ログイン完了後にトップページに戻す（ブラウザ側で認証処理する）
      redirectTo: `${window.location.origin}/`,
    },
  });

  if (error) {
    console.error("ログインエラー:", error);
    throw error;
  }
}

/**
 * ログアウトする
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("ログアウトエラー:", error);
    throw error;
  }
}

/**
 * 現在のセッション（ログイン情報）を取得する
 * ログインしていれば session、していなければ null が返る
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * アクセストークンを取得する（API呼び出し用）
 * このトークンを Authorization ヘッダーに付けて API を呼ぶ
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.access_token ?? null;
}
