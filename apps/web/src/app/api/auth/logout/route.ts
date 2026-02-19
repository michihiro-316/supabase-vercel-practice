// ========================================
// ログアウト API
// URL: /api/auth/logout
// Cookie のセッション情報を削除してログアウトする
// CSRF 対策として X-Requested-With ヘッダーを検証する
// ========================================

import { NextRequest, NextResponse } from "next/server";
import { createSSRClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // CSRF 対策: 外部サイトからの <form> によるログアウト攻撃を防ぐ
  if (request.headers.get("X-Requested-With") !== "XMLHttpRequest") {
    return NextResponse.json(
      { error: "不正なリクエストです" },
      { status: 403 }
    );
  }

  const supabase = await createSSRClient();
  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
}
