import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Use placeholder URL for Docker builds - gets replaced at container startup
  // Must be a valid URL format for Next.js prerendering to work
  env: {
    NEXT_PUBLIC_CONVEX_URL:
      process.env.NEXT_PUBLIC_CONVEX_URL ||
      "http://PLACEHOLDER_CONVEX_URL:3210",
  },
  images: {
    remotePatterns: [
      // Convex cloud storage
      {
        protocol: "https",
        hostname: "**.convex.cloud",
      },
      // Self-hosted Convex (uses same URL as API)
      {
        protocol: "http",
        hostname: "localhost",
        port: "3210",
        pathname: "/api/storage/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "3210",
        pathname: "/api/storage/**",
      },
    ],
  },
};

export default nextConfig;
