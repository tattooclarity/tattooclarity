// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ 確保 /api/download 用 fs 讀取嘅 storage 檔案會被打包上 Vercel
  outputFileTracingIncludes: {
    "/api/download": ["./storage/designs/**/*"],
  },
};

export default nextConfig;