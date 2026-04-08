import { readFileSync } from "node:fs";

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

const summaryPath = new URL(
	"../coverage/coverage-summary.json",
	import.meta.url,
);

let summary: CoverageSummary;
try {
	summary = JSON.parse(readFileSync(summaryPath, "utf8")) as CoverageSummary;
} catch (error) {
	console.error(`Failed to read coverage summary at ${summaryPath.pathname}`);
	throw error;
}

const thresholds = {
	package: 95,
	source: 85,
	highRisk: 95,
} as const;

const metricNames = ["statements", "branches", "functions", "lines"] as const;

const normalizePath = (value: string) => value.replaceAll("\\", "/");
const isTestFile = (filePath: string) => /\.test\.(ts|tsx)$/.test(filePath);
const isSourceFile = (filePath: string) =>
	normalizePath(filePath).startsWith("src/");
const isHighRiskFile = (filePath: string) => {
	const normalized = normalizePath(filePath);
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
	if (
		filePath === "total" ||
		!metrics ||
		!isSourceFile(filePath) ||
		isTestFile(filePath)
	) {
		continue;
	}

	const minimum = isHighRiskFile(filePath)
		? thresholds.highRisk
		: thresholds.source;

	for (const metric of metricNames) {
		if ((metrics[metric]?.pct ?? 0) < minimum) {
			failures.push(
				`${filePath} ${metric} coverage ${metrics[metric]?.pct ?? 0}% < ${minimum}%`,
			);
		}
	}
}

if (failures.length > 0) {
	console.error("Coverage audit failed:");
	for (const failure of failures) {
		console.error(`- ${failure}`);
	}
	process.exit(1);
}

console.log("Coverage audit passed.");
