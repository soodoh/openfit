import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
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

  return {
    server: {
      port: 3000,
    },
    optimizeDeps: {
      include: ["react-timer-hook"],
    },
    plugins: [tailwindcss(), tsconfigPaths(), tanstackStart(), viteReact()],
  };
});
