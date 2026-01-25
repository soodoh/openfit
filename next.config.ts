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
    // Images from /convex/* are same-origin (proxied through nginx)
    // so no additional remotePatterns needed for self-hosted
  },
};

export default nextConfig;
