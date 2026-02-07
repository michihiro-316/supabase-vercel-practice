import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // モノレポ内の共有パッケージの TypeScript を直接コンパイルする
  transpilePackages: ["@task-manager/shared"],
};

export default nextConfig;
