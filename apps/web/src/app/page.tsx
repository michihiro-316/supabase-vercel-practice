// ========================================
// タスク管理アプリのメインページ
// URL: / （トップページ）
// このファイルが全パーツ（認証・API）をつなぐ「司令塔」
// ========================================

"use client"; // ブラウザで動くコンポーネント（ボタンクリックなどの操作があるため）

import { useState, useEffect } from "react";
import { signInWithGoogle, signOut, getAccessToken } from "@/lib/auth-client";
import { supabase } from "@/lib/supabase/client";
import type { Task, CreateTaskInput } from "@task-manager/shared";
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
} from "@task-manager/shared";
import type { Session } from "@supabase/supabase-js";

// ========================================
// メインコンポーネント
// ========================================
export default function Home() {
  // ---------- 状態（state）の定義 ----------
  // useState = 画面に表示するデータを管理する仕組み
  // [値, 値を変える関数] = useState(初期値)

  // ログイン中のセッション情報（null = 未ログイン）
  const [session, setSession] = useState<Session | null>(null);
  // タスク一覧
  const [tasks, setTasks] = useState<Task[]>([]);
  // 読み込み中かどうか
  const [loading, setLoading] = useState(true);
  // エラーメッセージ
  const [error, setError] = useState<string | null>(null);

  // 新規タスク入力フォームの値
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // ---------- 初回読み込み時の処理 ----------
  // useEffect = コンポーネントが画面に表示されたときに1回だけ実行する
  useEffect(() => {
    // 現在のセッション（ログイン状態）を取得
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setLoading(false);
    });

    // ログイン状態が変わったときに自動で検知する（リスナー）
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    // コンポーネントが画面から消えるときにリスナーを解除する（メモリリーク防止）
    return () => subscription.unsubscribe();
  }, []);

  // セッションが変わったらタスク一覧を取得
  useEffect(() => {
    if (session) {
      fetchTasks();
    } else {
      setTasks([]);
    }
  }, [session]);

  // ---------- API 呼び出し関数 ----------

  // タスク一覧を取得する
  async function fetchTasks() {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch("/api/tasks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("タスクの取得に失敗しました");
      }

      const data: Task[] = await response.json();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    }
  }

  // 新しいタスクを作成する
  async function handleCreateTask(e: React.SyntheticEvent<HTMLFormElement>) {
    // フォーム送信時のページリロードを防ぐ
    e.preventDefault();

    if (!newTitle.trim()) return;

    try {
      const token = await getAccessToken();
      if (!token) return;

      const body: CreateTaskInput = {
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
      };

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("タスクの作成に失敗しました");
      }

      // 入力欄をクリア
      setNewTitle("");
      setNewDescription("");
      // タスク一覧を再取得
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    }
  }

  // タスクのステータスを更新する
  async function handleUpdateStatus(taskId: string, newStatus: Task["status"]) {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("ステータスの更新に失敗しました");
      }

      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    }
  }

  // タスクを削除する
  async function handleDeleteTask(taskId: string) {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("タスクの削除に失敗しました");
      }

      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    }
  }

  // ---------- 読み込み中の表示 ----------
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  // ---------- 未ログイン時の表示 ----------
  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-bold">タスク管理アプリ</h1>
          <p className="mb-8 text-zinc-500">
            Google アカウントでログインしてください
          </p>
          <button
            onClick={() => signInWithGoogle()}
            className="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
          >
            Google でログイン
          </button>
        </div>
      </div>
    );
  }

  // ---------- ログイン済みの表示 ----------
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* ========== ヘッダー ========== */}
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <h1 className="text-xl font-bold">タスク管理</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">
              {session.user.email}
            </span>
            <button
              onClick={() => signOut()}
              className="rounded bg-zinc-200 px-3 py-1 text-sm transition-colors hover:bg-zinc-300"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* ========== メインコンテンツ ========== */}
      <main className="mx-auto max-w-3xl px-6 py-8">
        {/* エラー表示 */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-600">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 underline"
            >
              閉じる
            </button>
          </div>
        )}

        {/* ========== 新規タスク作成フォーム ========== */}
        <form
          onSubmit={handleCreateTask}
          className="mb-8 rounded-lg bg-white p-6 shadow-sm"
        >
          <h2 className="mb-4 text-lg font-semibold">新しいタスク</h2>
          <div className="mb-3">
            <input
              type="text"
              placeholder="タスク名（必須）"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="mb-3">
            <input
              type="text"
              placeholder="詳細（任意）"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!newTitle.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:bg-zinc-300 disabled:cursor-not-allowed"
          >
            追加
          </button>
        </form>

        {/* ========== タスク一覧 ========== */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">
            タスク一覧（{tasks.length}件）
          </h2>

          {tasks.length === 0 ? (
            <p className="text-zinc-500">タスクがありません。上のフォームから追加してみましょう。</p>
          ) : (
            <ul className="space-y-3">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="rounded-lg bg-white p-4 shadow-sm"
                >
                  {/* タスクのヘッダー部分（タイトル + 削除ボタン） */}
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h3 className={`font-medium ${task.status === "done" ? "text-zinc-400 line-through" : ""}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="mt-1 text-sm text-zinc-500">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-sm text-red-400 transition-colors hover:text-red-600"
                    >
                      削除
                    </button>
                  </div>

                  {/* ステータス・優先度の表示と変更 */}
                  <div className="flex items-center gap-3">
                    {/* ステータス切り替え */}
                    <select
                      value={task.status}
                      onChange={(e) =>
                        handleUpdateStatus(task.id, e.target.value as Task["status"])
                      }
                      className="rounded border px-2 py-1 text-sm"
                    >
                      {Object.entries(TASK_STATUS_LABELS).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        )
                      )}
                    </select>

                    {/* 優先度の表示 */}
                    <span className="text-xs text-zinc-400">
                      優先度: {TASK_PRIORITY_LABELS[task.priority]}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
