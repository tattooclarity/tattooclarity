// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/download": ["./storage/designs/**/*"],
  },
} as any;

export default nextConfig;