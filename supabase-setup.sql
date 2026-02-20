-- ========================================
-- Supabase セットアップ SQL
-- Supabase ダッシュボードの SQL Editor にコピペして実行してください
-- ========================================

-- ========================================
-- 1. タスクテーブル
-- タスク管理アプリのメインデータ
-- user_id は auth.users(id) を直接参照する（profiles テーブルは不要）
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
  -- このタスクを作ったユーザーのID（auth.users テーブルと紐づく）
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 作成日時（自動で現在時刻が入る）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- 最終更新日時（自動で現在時刻が入る）
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- user_id にインデックスを作成（検索を高速化）
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- RLS（Row Level Security）を有効にする
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. updated_at を自動更新する仕組み
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
-- 3. アクセス許可リスト
-- このテーブルに登録されたメールアドレスまたはドメインのユーザーだけがログインできる
-- Supabase ダッシュボードの Table Editor から追加・削除する
-- ========================================
CREATE TABLE allowed_users (
  -- 行のID（自動生成）
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 許可の種類: 'email'（個別のメールアドレス）または 'domain'（ドメイン全体）
  type TEXT NOT NULL DEFAULT 'email'
    CHECK (type IN ('email', 'domain')),
  -- 許可パターン: メールアドレス（例: "taro@gmail.com"）またはドメイン（例: "@company.co.jp"）
  pattern TEXT NOT NULL UNIQUE,
  -- 説明メモ（例: "田中太郎" や "株式会社ABC"）
  description TEXT NOT NULL DEFAULT '',
  -- 登録日時
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS を有効にする
ALTER TABLE allowed_users ENABLE ROW LEVEL SECURITY;

-- anon と authenticated の全権限を剥奪
-- allowed_users へのアクセスは service_role key（サーバー側）のみ可能
REVOKE ALL ON TABLE public.allowed_users FROM anon;
REVOKE ALL ON TABLE public.allowed_users FROM authenticated;

-- ========================================
-- 4. セキュリティ強化（RLS ポリシー）
-- allowed_users に登録されている人だけがタスクを操作できるようにする
-- ========================================

-- PostgreSQL 関数: ユーザーが許可リストに含まれているかチェック
-- SECURITY DEFINER = この関数は作成者（管理者）の権限で実行される
-- → REVOKE で allowed_users へのアクセスを剥奪しても、この関数内からは読める
CREATE OR REPLACE FUNCTION public.is_user_allowed(user_email TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.allowed_users
    WHERE (type = 'email' AND pattern = lower(user_email))
       OR (type = 'domain' AND pattern = '@' || split_part(lower(user_email), '@', 2))
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS ポリシー: 自分のタスク AND 許可ユーザーであること の両方を満たす場合のみ操作可能
CREATE POLICY "許可ユーザーが自分のタスクを読める" ON tasks
  FOR SELECT USING (
    auth.uid() = user_id
    AND is_user_allowed(auth.jwt()->>'email')
  );

CREATE POLICY "許可ユーザーが自分のタスクを作成できる" ON tasks
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND is_user_allowed(auth.jwt()->>'email')
  );

CREATE POLICY "許可ユーザーが自分のタスクを更新できる" ON tasks
  FOR UPDATE USING (
    auth.uid() = user_id
    AND is_user_allowed(auth.jwt()->>'email')
  );

CREATE POLICY "許可ユーザーが自分のタスクを削除できる" ON tasks
  FOR DELETE USING (
    auth.uid() = user_id
    AND is_user_allowed(auth.jwt()->>'email')
  );
