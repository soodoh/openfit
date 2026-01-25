import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      // Convex cloud storage (for cloud deployments)
      {
        protocol: "https",
        hostname: "**.convex.cloud",
      },
    ],
    // Self-hosted storage uses /api/storage/* proxy route (same-origin)
  },
};

export default nextConfig;
