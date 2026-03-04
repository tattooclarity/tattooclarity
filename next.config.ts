// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      "/api/download": ["./storage/designs/**/*"],
    },
  },
};

export default nextConfig;