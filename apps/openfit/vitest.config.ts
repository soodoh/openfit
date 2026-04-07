import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./vitest.setup.ts"],
		include: [
			"src/lib/**/*.test.ts",
			"src/components/**/*.test.{ts,tsx}",
			"src/hooks/mutations/**/*.test.ts",
			"src/routes/**/*.test.{ts,tsx}",
		],
		exclude: ["node_modules", ".output"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html"],
		},
	},
});
