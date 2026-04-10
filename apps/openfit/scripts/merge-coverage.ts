import { CoverageReport } from "monocart-coverage-reports";

const mode = process.argv.includes("--mode")
	? process.argv[process.argv.indexOf("--mode") + 1]
	: "merged";

const unitDirs = ["./coverage/unit-node/raw", "./coverage/unit-browser/raw"];

const inputDir =
	mode === "unit" ? unitDirs : [...unitDirs, "./coverage/e2e/raw"];

const outputDir = mode === "unit" ? "./coverage/unit" : "./coverage/merged";

const coverageOptions = {
	name: `OpenFit Coverage (${mode})`,
	inputDir,
	outputDir,

	entryFilter: {
		"**/node_modules/**": false,
		"**/*": true,
	},
	sourceFilter: {
		"**/node_modules/**": false,
		"**/src/**": true,
	},

	sourcePath: (filePath: string) => {
		// Normalize paths between Vitest and Playwright environments.
		let normalized = filePath;

		// Strip leading /@fs/ absolute prefix from Vite dev server
		const fsPrefix = "/@fs/";
		if (normalized.startsWith(fsPrefix)) {
			normalized = normalized.slice(fsPrefix.length);
		}

		// Strip leading slash to normalize /src/... to src/...
		if (normalized.startsWith("/")) {
			normalized = normalized.slice(1);
		}

		// Strip absolute path prefix up to and including the app root
		const appRoot = "apps/openfit/";
		const appRootIndex = normalized.indexOf(appRoot);
		if (appRootIndex !== -1) {
			normalized = normalized.slice(appRootIndex + appRoot.length);
		}

		return normalized;
	},

	reports: [
		["v8"],
		["console-details"],
		["json-summary", { file: "coverage-summary.json" }],
	],
};

await new CoverageReport(coverageOptions).generate();

console.log(`Coverage report generated in ${outputDir}`);
