// ========================================
// packages/shared のエントリーポイント
// ここで全ての型と定数を re-export（まとめて公開）する
//
// 他のプロジェクトからはこう使う:
//   import { Task, TASK_STATUS } from "@task-manager/shared";
// ========================================

// タスク関連の型と定数
export {
  TASK_STATUS,
  TASK_PRIORITY,
  type TaskStatus,
  type TaskPriority,
  type Task,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "./types/task";

// データベース行の型（snake_case のまま）
export { type TaskRow } from "./types/database";

// 表示用の定数（日本語ラベルなど）
export { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from "./constants";
