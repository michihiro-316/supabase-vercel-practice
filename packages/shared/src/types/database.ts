// ========================================
// データベースの行（row）の型定義
// Supabase から返ってくるデータは snake_case（例: user_id）
// TypeScript では camelCase（例: userId）を使うので、
// 変換前の型をここで定義しておく
// ========================================

// tasks テーブルの行の型（Supabase から返ってくる形そのまま）
export interface TaskRow {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  user_id: string;       // snake_case（DB側の名前）
  created_at: string;    // snake_case
  updated_at: string;    // snake_case
}
