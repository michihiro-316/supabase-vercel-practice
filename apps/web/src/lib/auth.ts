// ========================================
// API Route 用の認証ヘルパー
// Cookie からセッションを読み取り、ユーザー認証を行う
// allowed_users のチェックは管理者クライアント（Secret key）で行う
// → ブラウザからは allowed_users の中身が一切見えない
// ========================================

import { createSSRClient, createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// 認証結果の型（成功 or 失敗）
type AuthResult =
  | { success: true; userId: string; supabase: SupabaseClient }
  | { success: false; response: NextResponse };

/**
 * ユーザーのメールアドレスが許可リストに含まれているかチェックする
 * 管理者クライアント（Secret key）を使うので、
 * allowed_users テーブルの REVOKE 後も動作する
 */
export async function isUserAllowed(email: string): Promise<boolean> {
  const admin = createAdminClient();
  const normalizedEmail = email.toLowerCase();

  // メールアドレスの完全一致をチェック
  const { data: emailMatch } = await admin
    .from("allowed_users")
    .select("id")
    .eq("type", "email")
    .eq("pattern", normalizedEmail)
    .limit(1);

  if (emailMatch && emailMatch.length > 0) return true;

  // ドメインの一致をチェック（例: "@company.co.jp"）
  const domain = "@" + normalizedEmail.split("@")[1];
  const { data: domainMatch } = await admin
    .from("allowed_users")
    .select("id")
    .eq("type", "domain")
    .eq("pattern", domain)
    .limit(1);

  return domainMatch !== null && domainMatch.length > 0;
}

/**
 * API Route のリクエストからユーザー認証を行う
 * Cookie ベースのセッション管理を使用する
 * CSRF 対策として X-Requested-With ヘッダーを検証する
 *
 * 使い方:
 *   const auth = await authenticate(request);
 *   if (!auth.success) return auth.response; // 認証失敗なら即レスポンス
 *   const { userId, supabase } = auth; // 成功ならユーザーIDとクライアントを使う
 */
export async function authenticate(request: NextRequest): Promise<AuthResult> {
  // 0. CSRF 対策: ブラウザの fetch() から送られる独自ヘッダーを検証する
  //    外部サイトからの <form> 送信や <img src="..."> では独自ヘッダーを付けられない
  if (request.headers.get("X-Requested-With") !== "XMLHttpRequest") {
    return {
      success: false,
      response: NextResponse.json(
        { error: "不正なリクエストです" },
        { status: 403 }
      ),
    };
  }

  // 1. Cookie からセッションを読み取り、ユーザー情報を取得
  const supabase = await createSSRClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "認証が必要です。ログインしてください。" },
        { status: 401 }
      ),
    };
  }

  // 2. 許可リストに含まれているかチェック（管理者クライアントを使用）
  if (!user.email || !(await isUserAllowed(user.email))) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "このアカウントにはアクセス権限がありません。" },
        { status: 403 }
      ),
    };
  }

  // 3. 認証成功
  return {
    success: true,
    userId: user.id,
    supabase,
  };
}
