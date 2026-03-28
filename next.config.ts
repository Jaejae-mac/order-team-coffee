import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESLint 오류가 빌드를 중단시키지 않도록 설정
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
