// ========================================
// タスク関連のヘルパー関数
// API Route 間で共通して使う変換・バリデーション処理をまとめる
// ========================================

import type { Task, TaskRow, TaskStatus, TaskPriority } from "@task-manager/shared";
import { TASK_STATUS, TASK_PRIORITY } from "@task-manager/shared";

// タイトルの最大文字数
const TITLE_MAX_LENGTH = 200;

// 許可されるステータス値の集合（高速ルックアップ用）
const VALID_STATUSES = new Set<string>(Object.values(TASK_STATUS));

// 許可される優先度値の集合
const VALID_PRIORITIES = new Set<string>(Object.values(TASK_PRIORITY));

/** ステータス値が有効かどうかを検証する */
export function isValidStatus(value: string): value is TaskStatus {
  return VALID_STATUSES.has(value);
}

/** 優先度値が有効かどうかを検証する */
export function isValidPriority(value: string): value is TaskPriority {
  return VALID_PRIORITIES.has(value);
}

/** タイトルが有効かどうかを検証し、エラーメッセージを返す（有効なら null） */
export function validateTitle(title: unknown): string | null {
  if (!title || typeof title !== "string" || title.trim() === "") {
    return "タスク名は必須です";
  }
  if (title.trim().length > TITLE_MAX_LENGTH) {
    return `タスク名は${TITLE_MAX_LENGTH}文字以内で入力してください`;
  }
  return null;
}

/**
 * Supabase から返ってくる snake_case のデータを camelCase に変換する
 * tasks テーブルの行（TaskRow）→ アプリで使う形式（Task）
 */
export function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status as Task["status"],
    priority: row.priority as Task["priority"],
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
