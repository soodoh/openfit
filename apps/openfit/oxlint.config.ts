import { defineConfig } from "@standard-config/oxlint";

export default defineConfig({
  react: true,
  ignorePatterns: ["node_modules/**", ".output/**", "src/routeTree.gen.ts"],
  rules: {},
});
