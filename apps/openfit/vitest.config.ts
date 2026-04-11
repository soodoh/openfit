import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig, type Plugin } from "vitest/config";

const stubTanstackVirtualEntries = (): Plugin => {
	const ROUTER_STUB_ID = "\0virtual:tanstack-router-entry";
	const START_STUB_ID = "\0virtual:tanstack-start-entry";
	return {
		name: "stub-tanstack-virtual-entries",
		enforce: "pre",
		resolveId(id) {
			if (id === "#tanstack-router-entry") {
				return ROUTER_STUB_ID;
			}
			if (id === "#tanstack-start-entry") {
				return START_STUB_ID;
			}
		},
		load(id) {
			if (id === ROUTER_STUB_ID) {
				return "export async function getRouter() {}";
			}
			if (id === START_STUB_ID) {
				return "export const startInstance = undefined;";
			}
		},
	};
};

export default defineConfig({
	plugins: [react()],
	resolve: {
		tsconfigPaths: true,
	},
	optimizeDeps: {
		include: ["dayjs", "dayjs/plugin/duration", "dayjs/plugin/relativeTime"],
	},
	test: {
		globals: true,
		coverage: {
			provider: "custom",
			customProviderModule: "vitest-monocart-coverage",
			reporter: [["raw", {}]],
			all: true,
			include: ["src/**/*.{ts,tsx}"],
			exclude: [
				"src/**/*.test.{ts,tsx}",
				"src/routeTree.gen.ts",
				"src/hooks.ts",
				"src/lib/api-types.ts",
				"db/schema/**",
			],
		},
		projects: [
			{
				plugins: [stubTanstackVirtualEntries()],
				resolve: {
					tsconfigPaths: true,
				},
				test: {
					name: "unit-node",
					environment: "node",
					include: ["src/lib/**/*.test.ts", "src/routes/api/**/*.test.ts"],
					exclude: [
						"node_modules",
						".output",
						"src/lib/use-exercise-lookups.test.ts",
					],
				},
			},
			{
				plugins: [stubTanstackVirtualEntries()],
				optimizeDeps: {
					rolldownOptions: {
						plugins: [stubTanstackVirtualEntries()],
					},
				},
				resolve: {
					tsconfigPaths: true,
				},
				test: {
					name: "unit-browser",
					setupFiles: ["./vitest.setup.ts"],
					include: [
						"src/*.test.{ts,tsx}",
						"src/components/**/*.test.{ts,tsx}",
						"src/hooks/**/*.test.{ts,tsx}",
						"src/routes/**/*.test.{ts,tsx}",
						"src/lib/use-exercise-lookups.test.ts",
					],
					exclude: [
						"node_modules",
						".output",
						// API route tests are pure server logic - run in node project
						"src/routes/api/**/*.test.ts",
					],
					browser: {
						enabled: true,
						provider: playwright({
							launchOptions: { channel: "chrome" },
						}),
						headless: true,
						instances: [{ browser: "chromium" }],
					},
				},
			},
		],
	},
});
