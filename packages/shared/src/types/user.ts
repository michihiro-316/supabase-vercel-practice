// ========================================
// ユーザーの型定義
// Google OAuth でログインしたユーザーの情報の形
// Supabase Auth + profiles テーブルに対応
// ========================================

export interface UserProfile {
  id: string;               // ユーザーID（Supabase Auth が自動で作るUUID）
  email: string;            // メールアドレス（Googleアカウントのもの）
  displayName: string;      // 表示名（Googleアカウントの名前）
  photoURL: string | null;  // プロフィール画像のURL（ない場合は null）
  createdAt: string;        // アカウント作成日時
  lastLoginAt: string;      // 最終ログイン日時
}
