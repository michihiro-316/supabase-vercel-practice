// ========================================
// セッション確認 API
// URL: /api/auth/session
// Cookie からログイン状態を確認し、ユーザー情報を返す
// ========================================

import { NextResponse } from "next/server";
import { createSSRClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSSRClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
    },
  });
}
