// ========================================
// アクセス権限チェック API
// URL: /api/auth/check-access
// ログイン中のユーザーが allowed_users に登録されているか確認する
// ロジックは auth.ts の isUserAllowed() に集約している
// ========================================

import { NextResponse } from "next/server";
import { createSSRClient } from "@/lib/supabase/server";
import { isUserAllowed } from "@/lib/auth";

export async function GET() {
  // 1. Cookie からユーザー情報を取得
  const supabase = await createSSRClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || !user.email) {
    return NextResponse.json({ allowed: false }, { status: 401 });
  }

  // 2. 許可リストをチェック（auth.ts の共通関数を使用）
  const allowed = await isUserAllowed(user.email);
  return NextResponse.json({ allowed });
}
