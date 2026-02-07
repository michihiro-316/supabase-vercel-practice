// ========================================
// 定数（画面の表示ラベルなど）
// ステータスや優先度を画面に表示するときの日本語ラベル
// ========================================

// ステータスの日本語ラベル
export const TASK_STATUS_LABELS = {
  todo: "未着手",
  in_progress: "進行中",
  done: "完了",
} as const;

// 優先度の日本語ラベル
export const TASK_PRIORITY_LABELS = {
  low: "低",
  medium: "中",
  high: "高",
} as const;
