-- ========================================
-- Supabase セットアップ SQL
-- Supabase ダッシュボードの SQL Editor にコピペして実行してください
-- ========================================

-- ========================================
-- 1. プロフィールテーブル
-- Supabase Auth でログインしたユーザーの追加情報を保存する
-- auth.users テーブルと1対1で紐づく
-- ========================================
CREATE TABLE profiles (
  -- Supabase Auth のユーザーID（auth.users.id と同じ値）
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- メールアドレス
  email TEXT NOT NULL,
  -- 表示名（Googleアカウントの名前）
  display_name TEXT NOT NULL DEFAULT '',
  -- プロフィール画像のURL（ない場合は NULL）
  photo_url TEXT,
  -- アカウント作成日時（自動で現在時刻が入る）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- 最終ログイン日時
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS（Row Level Security）を有効にする
-- これにより、ログインしていないユーザーはデータにアクセスできない
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ポリシー: ユーザーは自分のプロフィールだけ読める
CREATE POLICY "自分のプロフィールを読める" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- ポリシー: ユーザーは自分のプロフィールだけ更新できる
CREATE POLICY "自分のプロフィールを更新できる" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ポリシー: 新規ユーザーは自分のプロフィールを作成できる
CREATE POLICY "自分のプロフィールを作成できる" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ========================================
-- 2. タスクテーブル
-- タスク管理アプリのメインデータ
-- ========================================
CREATE TABLE tasks (
  -- タスクのID（自動で一意のUUIDが生成される）
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- タスク名（例: "会議の資料を作る"）
  title TEXT NOT NULL,
  -- 詳細説明（例: "来週月曜の会議用"）
  description TEXT NOT NULL DEFAULT '',
  -- 進捗状態: 'todo'（未着手）, 'in_progress'（進行中）, 'done'（完了）
  status TEXT NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo', 'in_progress', 'done')),
  -- 優先度: 'low'（低）, 'medium'（中）, 'high'（高）
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high')),
  -- このタスクを作ったユーザーのID（profiles テーブルと紐づく）
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- 作成日時（自動で現在時刻が入る）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- 最終更新日時（自動で現在時刻が入る）
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- user_id にインデックスを作成（検索を高速化）
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- RLS（Row Level Security）を有効にする
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- ポリシー: ユーザーは自分のタスクだけ読める
CREATE POLICY "自分のタスクを読める" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

-- ポリシー: ユーザーは自分のタスクだけ作成できる
CREATE POLICY "自分のタスクを作成できる" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ポリシー: ユーザーは自分のタスクだけ更新できる
CREATE POLICY "自分のタスクを更新できる" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

-- ポリシー: ユーザーは自分のタスクだけ削除できる
CREATE POLICY "自分のタスクを削除できる" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 3. updated_at を自動更新する仕組み
-- タスクが更新されるたびに updated_at が現在時刻に変わる
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 4. 新規ユーザー登録時に profiles テーブルに自動でレコードを作る
-- Supabase Auth でユーザーが作られたとき、同時にプロフィールも作成される
-- ========================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name, photo_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
