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
};

export default nextConfig;
