import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    root: "./convex",
    include: ["**/*.test.ts"],
    exclude: ["_generated/**"],
  },
});
