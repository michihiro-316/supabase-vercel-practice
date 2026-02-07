// ========================================
// タスクの型定義
// このファイルで「タスクとはどんなデータか」を決める
// フロントエンド（画面）と API（サーバー）の両方がこの定義を使う
// Supabase（PostgreSQL）の tasks テーブルに対応
// ========================================

// ---------- ステータス（タスクの進捗状態） ----------
// "todo" = 未着手, "in_progress" = 進行中, "done" = 完了
// as const をつけると、この3つ以外の値を入れようとしたときにエラーになる
export const TASK_STATUS = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done",
} as const;

// TASK_STATUS の値だけを型として取り出す → "todo" | "in_progress" | "done"
export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

// ---------- 優先度（タスクの重要度） ----------
// "low" = 低, "medium" = 中, "high" = 高
export const TASK_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;

export type TaskPriority = (typeof TASK_PRIORITY)[keyof typeof TASK_PRIORITY];

// ---------- タスクの本体 ----------
// Supabase（PostgreSQL）に保存されるタスク1件分のデータの形
export interface Task {
  id: string;           // タスクのID（Supabaseが自動で作るUUID）
  title: string;        // タスク名（例: "会議の資料を作る"）
  description: string;  // 詳細説明（例: "来週月曜の会議用"）
  status: TaskStatus;   // 進捗状態: "todo" | "in_progress" | "done"
  priority: TaskPriority; // 優先度: "low" | "medium" | "high"
  userId: string;       // このタスクを作ったユーザーのID
  createdAt: string;    // 作成日時（例: "2026-02-06T12:00:00Z"）
  updatedAt: string;    // 最終更新日時
}

// ---------- タスク作成時に送るデータ ----------
// id, userId, createdAt, updatedAt はサーバーが自動で設定するので、
// ユーザーが入力するのは以下の項目だけ
export interface CreateTaskInput {
  title: string;            // 必須: タスク名
  description?: string;     // 任意: 詳細（? = 省略可能）
  status?: TaskStatus;      // 任意: 省略したら "todo" になる
  priority?: TaskPriority;  // 任意: 省略したら "medium" になる
}

// ---------- タスク更新時に送るデータ ----------
// 変更したい項目だけ送ればOK（全部任意）
export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}
