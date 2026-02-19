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

-- ========================================
-- 5. アクセス許可リスト
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

-- ポリシー: 認証済みユーザーは許可リストを読める（自分が許可されているかチェックするため）
CREATE POLICY "認証済みユーザーは許可リストを読める" ON allowed_users
  FOR SELECT USING (auth.role() = 'authenticated');

-- ※ INSERT/UPDATE/DELETE のポリシーは作成しない
-- → Supabase ダッシュボード（service_role）からのみ編集可能

-- ========================================
-- 6. セキュリティ強化（REVOKE + RLS 強化）
-- 前回セッションで発見された脆弱性への対策
-- ========================================

-- ---------- allowed_users テーブルの権限剥奪 ----------
-- anon と authenticated の全権限を剥奪する
-- これにより、ブラウザからの直接アクセスが完全にブロックされる
-- allowed_users へのアクセスは service_role key（サーバー側）のみ可能

-- 古いポリシーを削除（全件読めるポリシーは危険なので削除）
DROP POLICY IF EXISTS "認証済みユーザーは許可リストを読める" ON allowed_users;

-- anon と authenticated の全権限を剥奪
REVOKE ALL ON TABLE public.allowed_users FROM anon;
REVOKE ALL ON TABLE public.allowed_users FROM authenticated;

-- ---------- tasks テーブルの RLS 強化 ----------
-- allowed_users に登録されている人だけがタスクを操作できるようにする

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

-- 既存の tasks RLS ポリシーを削除
DROP POLICY IF EXISTS "自分のタスクを読める" ON tasks;
DROP POLICY IF EXISTS "自分のタスクを作成できる" ON tasks;
DROP POLICY IF EXISTS "自分のタスクを更新できる" ON tasks;
DROP POLICY IF EXISTS "自分のタスクを削除できる" ON tasks;

-- 新しいポリシー: 自分のタスク AND 許可ユーザーであること の両方を満たす場合のみ操作可能
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
