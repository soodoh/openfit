import { readFileSync } from "node:fs";
import { isAbsolute, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

type CoverageMetric = {
	pct: number;
};

type CoverageEntry = Record<string, CoverageMetric> & {
	lines: CoverageMetric;
	branches: CoverageMetric;
	functions: CoverageMetric;
	statements: CoverageMetric;
};

type CoverageSummary = {
	total: CoverageEntry;
	[filePath: string]: CoverageEntry | undefined;
};

const mode = process.argv.includes("--mode")
	? process.argv[process.argv.indexOf("--mode") + 1]
	: "merged";

const summaryDir = mode === "unit" ? "coverage/unit" : "coverage/merged";
const summaryPath = new URL(
	`../${summaryDir}/coverage-summary.json`,
	import.meta.url,
);
const projectRoot = fileURLToPath(new URL("..", import.meta.url));

let summary: CoverageSummary;
try {
	summary = JSON.parse(readFileSync(summaryPath, "utf8")) as CoverageSummary;
} catch (error) {
	console.error(`Failed to read coverage summary at ${summaryPath.pathname}`);
	throw error;
}

const thresholds =
	mode === "unit"
		? { package: 80, source: 80, highRisk: 85 }
		: { package: 95, source: 95, highRisk: 95 };

const metricNames = ["statements", "branches", "functions", "lines"] as const;

const normalizePath = (value: string) => value.replaceAll("\\", "/");
const toProjectRelativePath = (value: string) => {
	const absolutePath = isAbsolute(value)
		? value
		: `${projectRoot}${sep}${value}`;
	return normalizePath(relative(projectRoot, absolutePath));
};
const isTestFile = (filePath: string) => /\.test\.(ts|tsx)$/.test(filePath);
const isSourceFile = (filePath: string) =>
	toProjectRelativePath(filePath).startsWith("src/");
const isHighRiskFile = (filePath: string) => {
	const normalized = toProjectRelativePath(filePath);
	return (
		normalized.startsWith("src/routes/api/") ||
		normalized.startsWith("src/hooks/") ||
		normalized.startsWith("src/lib/")
	);
};

const failures: string[] = [];

for (const metric of metricNames) {
	if ((summary.total[metric]?.pct ?? 0) < thresholds.package) {
		failures.push(
			`package ${metric} coverage ${summary.total[metric]?.pct ?? 0}% < ${thresholds.package}%`,
		);
	}
}

for (const [filePath, metrics] of Object.entries(summary)) {
	if (filePath === "total" || !metrics) {
		continue;
	}

	const normalizedPath = toProjectRelativePath(filePath);

	if (!isSourceFile(normalizedPath) || isTestFile(normalizedPath)) {
		continue;
	}

	const minimum = isHighRiskFile(normalizedPath)
		? thresholds.highRisk
		: thresholds.source;

	for (const metric of metricNames) {
		if ((metrics[metric]?.pct ?? 0) < minimum) {
			failures.push(
				`${normalizedPath} ${metric} coverage ${metrics[metric]?.pct ?? 0}% < ${minimum}%`,
			);
		}
	}
}

if (failures.length > 0) {
	console.error(`Coverage audit failed (mode: ${mode}):`);
	for (const failure of failures) {
		console.error(`- ${failure}`);
	}
	process.exit(1);
}

console.log(`Coverage audit passed (mode: ${mode}).`);
