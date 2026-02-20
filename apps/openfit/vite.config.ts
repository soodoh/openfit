import path from "node:path";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import { build, defineConfig, loadEnv } from "vite";
import type { Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Make all env vars available to server-side code via process.env
  // (Vite only exposes VITE_* to client by default)
  for (const key in env) {
    if (process.env[key] === undefined) {
      process.env[key] = env[key];
    }
  }

  function buildDbArtifactsPlugin(): Plugin {
    let root = process.cwd();
    let hasRun = false;

    return {
      name: "openfit-build-db-artifacts",
      apply: "build",
      configResolved(config) {
        root = config.root;
      },
      async closeBundle() {
        // TanStack Start runs multiple build phases; run db build once.
        if (hasRun) {
          return;
        }
        hasRun = true;
        await build({
          configFile: false,
          root,
          publicDir: path.join(root, "db/migrations"),
          plugins: [tsconfigPaths()],
          build: {
            ssr: true,
            outDir: path.join(root, ".output/db"),
            emptyOutDir: false,
            copyPublicDir: true,
            minify: false,
            sourcemap: false,
            rollupOptions: {
              input: {
                migrate: path.join(root, "db/migrate.ts"),
                seed: path.join(root, "db/seed.ts"),
                "seed-mock-user-data": path.join(
                  root,
                  "db/seed-mock-user-data.ts",
                ),
              },
              // Keep package imports external; only bundle local project files.
              external(id) {
                if (id.startsWith("@/")) {
                  return false;
                }
                return !id.startsWith(".") && !path.isAbsolute(id);
              },
              output: {
                format: "es",
                entryFileNames: "[name].js",
                chunkFileNames: "chunks/[name]-[hash].js",
              },
            },
          },
        });
      },
    };
  }

  return {
    server: {
      port: 3000,
    },
    plugins: [
      tailwindcss(),
      tsconfigPaths(),
      tanstackStart(),
      nitro(),
      viteReact(),
      buildDbArtifactsPlugin(),
    ],
  };
});
