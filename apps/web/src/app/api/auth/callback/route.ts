// ========================================
// Google OAuth コールバック API
// Supabase Auth の OAuth フローで、Googleログイン後にリダイレクトされるURL
// URL: /api/auth/callback
// ========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  // 1. URLからコード（authorization code）を取得
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    // 2. コードをアクセストークンに交換
    const supabase = createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 3. ログイン成功 → トップページにリダイレクト
      return NextResponse.redirect(`${origin}/`);
    }
  }

  // エラー時 → エラーページにリダイレクト
  return NextResponse.redirect(`${origin}/?error=auth`);
}
