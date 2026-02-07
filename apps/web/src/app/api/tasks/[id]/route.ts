// ========================================
// 個別タスクの取得（GET）、更新（PUT）、削除（DELETE）の API
// URL: /api/tasks/:id
// ========================================

import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import type { Task, UpdateTaskInput, TaskRow } from "@task-manager/shared";

// snake_case → camelCase 変換
function toTask(row: TaskRow): Task {
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

// Next.js App Router の動的ルートでは、params は Promise で取得する
type RouteContext = {
  params: Promise<{ id: string }>;
};

// ---------- GET /api/tasks/:id ----------
// 特定のタスクを1つ取得する
export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await authenticate(request);
  if (!auth.success) return auth.response;

  const { supabase } = auth;
  const { id } = await context.params;

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "タスクが見つかりません" },
      { status: 404 }
    );
  }

  return NextResponse.json(toTask(data as TaskRow));
}

// ---------- PUT /api/tasks/:id ----------
// 特定のタスクを更新する
export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = await authenticate(request);
  if (!auth.success) return auth.response;

  const { supabase } = auth;
  const { id } = await context.params;

  // リクエストボディを読み取る
  let body: UpdateTaskInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "リクエストの形式が正しくありません" },
      { status: 400 }
    );
  }

  // 更新するフィールドだけを組み立てる（undefined のフィールドは無視される）
  const updateData: Record<string, unknown> = {};
  if (body.title !== undefined) updateData.title = body.title.trim();
  if (body.description !== undefined) updateData.description = body.description.trim();
  if (body.status !== undefined) updateData.status = body.status;
  if (body.priority !== undefined) updateData.priority = body.priority;

  // 更新するフィールドが1つもない場合
  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "更新する項目がありません" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "タスクの更新に失敗しました" },
      { status: 404 }
    );
  }

  return NextResponse.json(toTask(data as TaskRow));
}

// ---------- DELETE /api/tasks/:id ----------
// 特定のタスクを削除する
export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await authenticate(request);
  if (!auth.success) return auth.response;

  const { supabase } = auth;
  const { id } = await context.params;

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "タスクの削除に失敗しました" },
      { status: 500 }
    );
  }

  // 204 = No Content（削除成功、レスポンスボディなし）
  return new NextResponse(null, { status: 204 });
}
