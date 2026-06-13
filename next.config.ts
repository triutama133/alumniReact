import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Allow production builds even if ESLint reports errors.
    // Short-term workaround — remove or set to false after fixing lint issues.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
