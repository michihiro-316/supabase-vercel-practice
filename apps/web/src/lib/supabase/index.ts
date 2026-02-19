// ========================================
// Supabase クライアントのまとめ（barrel export）
// サーバーサイド専用 — ブラウザ用クライアントは存在しない
// ========================================

export { createSSRClient, createAdminClient } from "./server";
