import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  experimental: {
    reactCompiler: true,
  },
  compiler: {
    styledComponents: true,
  },
};

export default nextConfig;
