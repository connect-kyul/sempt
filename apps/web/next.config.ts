import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@sempt/ai", "@sempt/config", "@sempt/database", "@sempt/shared"]
};

export default nextConfig;
