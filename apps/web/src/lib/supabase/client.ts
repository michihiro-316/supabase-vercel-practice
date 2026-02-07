// ========================================
// ブラウザ（クライアントサイド）用の Supabase クライアント
// React コンポーネントの中で使う
// シングルトン（1つだけ作って使い回す）パターン
// ========================================

import { createClient } from "@supabase/supabase-js";

// 環境変数を取得（NEXT_PUBLIC_ がついているのでブラウザから参照できる）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ブラウザ用の Supabase クライアント（1つだけ作って使い回す）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
