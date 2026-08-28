import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin"],
  experimental: {
    proxyClientMaxBodySize: "32mb",
  },
};

export default nextConfig;
