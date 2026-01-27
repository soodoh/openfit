import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["lib/**/*.test.ts", "components/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "convex/**/*"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
