// ========================================
// API Route 用の認証ヘルパー
// リクエストヘッダーから Bearer トークンを取り出し、
// Supabase Auth でユーザー情報を取得する
// ========================================

import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// 認証結果の型（成功 or 失敗）
type AuthResult =
  | { success: true; userId: string; supabase: ReturnType<typeof createServerClient> }
  | { success: false; response: NextResponse };

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
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "認証に失敗しました。再度ログインしてください。" },
        { status: 401 }
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
