import { defineConfig } from "@standard-config/oxlint";

export default defineConfig({
  react: true,
  ignorePatterns: ["src/routeTree.gen.ts"],
  rules: {},
});
