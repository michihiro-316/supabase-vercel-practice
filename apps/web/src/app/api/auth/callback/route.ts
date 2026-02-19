// ========================================
// Google OAuth コールバック API
// URL: /api/auth/callback
// Google ログイン後にリダイレクトされる URL
// 認証コードをセッション（Cookie）に交換する
// ========================================

import { NextRequest, NextResponse } from "next/server";
import { createSSRClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    // 認証コードをセッションに交換する
    // PKCE の code_verifier は Cookie から自動で読み取られる（@supabase/ssr が処理）
    // 成功すると、セッション情報（トークン）が Cookie に保存される
    const supabase = await createSSRClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // ログイン成功 → トップページにリダイレクト
      return NextResponse.redirect(`${origin}/`);
    }
  }

  // エラー時 → エラーパラメータ付きでトップページにリダイレクト
  return NextResponse.redirect(`${origin}/?error=auth`);
}
