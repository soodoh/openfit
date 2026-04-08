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
			"src/*.test.{ts,tsx}",
			"src/lib/**/*.test.{ts,tsx}",
			"src/components/**/*.test.{ts,tsx}",
			"src/hooks/**/*.test.{ts,tsx}",
			"src/routes/**/*.test.{ts,tsx}",
		],
		exclude: ["node_modules", ".output"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "json-summary"],
			all: true,
			include: ["src/**/*.{ts,tsx}"],
			exclude: [
				"src/**/*.test.{ts,tsx}",
				"src/routeTree.gen.ts",
				"db/schema/**",
			],
		},
	},
});
