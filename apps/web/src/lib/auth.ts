// ========================================
// API Route 用の認証ヘルパー
// リクエストヘッダーから Bearer トークンを取り出し、
// Supabase Auth でユーザー情報を取得する
// さらに、許可リスト（allowed_users）に登録されているかチェックする
// ========================================

import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// 認証結果の型（成功 or 失敗）
type AuthResult =
  | { success: true; userId: string; supabase: ReturnType<typeof createServerClient> }
  | { success: false; response: NextResponse };

/**
 * ユーザーのメールアドレスが許可リストに含まれているかチェックする
 * allowed_users テーブルに、メールアドレスの完全一致 または ドメインの一致があれば許可
 */
async function isUserAllowed(
  supabase: ReturnType<typeof createServerClient>,
  email: string
): Promise<boolean> {
  // 大文字小文字を統一（Gmail は大文字でも小文字でも同じアドレスになるため）
  const normalizedEmail = email.toLowerCase();

  // メールアドレスの完全一致をチェック
  const { data: emailMatch } = await supabase
    .from("allowed_users")
    .select("id")
    .eq("type", "email")
    .eq("pattern", normalizedEmail)
    .limit(1);

  if (emailMatch && emailMatch.length > 0) return true;

  // ドメインの一致をチェック（例: "@company.co.jp"）
  const domain = "@" + normalizedEmail.split("@")[1];
  const { data: domainMatch } = await supabase
    .from("allowed_users")
    .select("id")
    .eq("type", "domain")
    .eq("pattern", domain)
    .limit(1);

  return domainMatch !== null && domainMatch.length > 0;
}

/**
 * API Route のリクエストからユーザー認証を行う
 *
 * 使い方:
 *   const auth = await authenticate(request);
 *   if (!auth.success) return auth.response; // 認証失敗なら即レスポンス
 *   const { userId, supabase } = auth; // 成功ならユーザーIDとクライアントを使う
 */
export async function authenticate(request: NextRequest): Promise<AuthResult> {
  // 1. Authorization ヘッダーから Bearer トークンを取り出す
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "認証が必要です。ログインしてください。" },
        { status: 401 }
      ),
    };
  }

  const accessToken = authHeader.replace("Bearer ", "");

  // 2. トークンを使って Supabase クライアントを作成し、ユーザー情報を取得
  const supabase = createServerClient(accessToken);
  const { data: {  user}, error } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "認証に失敗しました。再度ログインしてください。" },
        { status: 401 }
      ),
    };
  }

  // 3. 許可リストに含まれているかチェック
  if (!user.email || !(await isUserAllowed(supabase, user.email))) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "このアカウントにはアクセス権限がありません。" },
        { status: 403 }
      ),
    };
  }

  // 4. 認証成功
  return {
    success: true,
    userId: user.id,
    supabase,
  };
}
