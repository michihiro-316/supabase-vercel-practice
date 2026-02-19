// ========================================
// タスク一覧取得（GET）と新規作成（POST）の API
// URL: /api/tasks
// ========================================

import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { toTask, validateTitle, isValidStatus, isValidPriority } from "@/lib/task-helpers";
import type { Task, CreateTaskInput, TaskRow } from "@task-manager/shared";

// ---------- GET /api/tasks ----------
// 自分のタスク一覧を取得する
export async function GET(request: NextRequest) {
  // 1. 認証チェック
  const auth = await authenticate(request);
  if (!auth.success) return auth.response;

  const { userId, supabase } = auth;

  // 2. Supabase からタスクを取得（RLSで自分のタスクのみ返る）
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("タスク取得エラー:", error);
    return NextResponse.json(
      { error: "タスクの取得に失敗しました" },
      { status: 500 }
    );
  }

  // 3. snake_case → camelCase に変換して返す
  const tasks: Task[] = (data as TaskRow[]).map(toTask);
  return NextResponse.json(tasks);
}

// ---------- POST /api/tasks ----------
// 新しいタスクを作成する
export async function POST(request: NextRequest) {
  // 1. 認証チェック
  const auth = await authenticate(request);
  if (!auth.success) return auth.response;

  const { userId, supabase } = auth;

  // 2. リクエストボディを読み取る
  let body: CreateTaskInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "リクエストの形式が正しくありません" },
      { status: 400 }
    );
  }

  // 3. バリデーション
  const titleError = validateTitle(body.title);
  if (titleError) {
    return NextResponse.json({ error: titleError }, { status: 400 });
  }

  if (body.status !== undefined && !isValidStatus(body.status)) {
    return NextResponse.json(
      { error: "無効なステータスです" },
      { status: 400 }
    );
  }

  if (body.priority !== undefined && !isValidPriority(body.priority)) {
    return NextResponse.json(
      { error: "無効な優先度です" },
      { status: 400 }
    );
  }

  // 4. Supabase にタスクを挿入
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: body.title.trim(),
      description: body.description?.trim() ?? "",
      status: body.status ?? "todo",
      priority: body.priority ?? "medium",
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("タスク作成エラー:", error);
    return NextResponse.json(
      { error: "タスクの作成に失敗しました" },
      { status: 500 }
    );
  }

  // 5. 作成したタスクを返す（201 = Created）
  const task: Task = toTask(data as TaskRow);
  return NextResponse.json(task, { status: 201 });
}
