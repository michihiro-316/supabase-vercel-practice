// ========================================
// Google OAuth ログイン開始 API
// URL: /api/auth/login
// ブラウザがこの URL にアクセスすると、Google ログイン画面にリダイレクトされる
// ========================================

import { NextRequest, NextResponse } from "next/server";
import { createSSRClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const supabase = await createSSRClient();

  // Google OAuth の URL を生成する
  // PKCE の code_verifier は Cookie に自動保存される（@supabase/ssr が処理）
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      // ログイン成功後に /api/auth/callback にリダイレクトされる
      redirectTo: `${origin}/api/auth/callback`,
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(`${origin}/?error=login_failed`);
  }

  // Google のログイン画面にリダイレクト
  return NextResponse.redirect(data.url);
}
