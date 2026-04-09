# Vitest Browser Mode Migration + Unified Coverage Merge

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate 97 component/hook tests from RTL + jsdom to Vitest browser mode (Playwright), and unify coverage from unit, component, and E2E tests via monocart-coverage-reports.

**Architecture:** Vitest config uses `projects` array with two projects: `unit-node` (pure logic, 16 files) and `unit-browser` (component/hook tests, 97 files in Chromium via Playwright). Coverage flows through monocart: Vitest outputs raw V8 data per project, Playwright collects E2E V8 coverage via `monocart-reporter`, and a merge script combines them. Dual thresholds: 80%/85% for unit-only, 95% for merged.

**Tech Stack:** Vitest 4.x, `@vitest/browser-playwright`, `vitest-browser-react`, `vitest-monocart-coverage`, `monocart-coverage-reports`, `monocart-reporter`

**Spec:** `docs/superpowers/specs/2026-04-09-vitest-browser-mode-coverage-merge-design.md`

---

## File Map

**Modify:**
- `apps/openfit/package.json` — update scripts and devDependencies
- `apps/openfit/vitest.config.ts` — replace with projects-based config
- `apps/openfit/vitest.setup.ts` — strip RTL setup, remove coverage hack
- `apps/openfit/playwright.config.ts` — add monocart-reporter with COLLECT_COVERAGE gate
- `apps/openfit/scripts/check-coverage.ts` — add --mode flag for unit vs merged thresholds
- `apps/openfit/src/test/query-client.tsx` — no changes expected (verify compatibility)
- 97 test files — migrate RTL imports to vitest-browser-react / @vitest/browser/context

**Create:**
- `apps/openfit/scripts/merge-coverage.ts` — coverage merge script using monocart CoverageReport

**Delete (Phase 4):**
- Old deps: `@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`, `@vitest/coverage-v8`, `jsdom`

---

## Phase 1: Infrastructure

### Task 1: Install new dependencies

**Files:**
- Modify: `apps/openfit/package.json`

- [ ] **Step 1: Install new packages**

```bash
cd apps/openfit && bun add -d @vitest/browser @vitest/browser-playwright vitest-browser-react vitest-monocart-coverage monocart-coverage-reports monocart-reporter
```

- [ ] **Step 2: Verify installation**

```bash
cd apps/openfit && bun pm ls | grep -E "vitest-browser-react|@vitest/browser|monocart"
```

Expected: all 6 packages listed.

- [ ] **Step 3: Commit**

```bash
cd apps/openfit && git add package.json bun.lock && git commit -m "chore: install vitest browser mode and monocart coverage deps"
```

---

### Task 2: Rewrite vitest.config.ts with projects

**Files:**
- Modify: `apps/openfit/vitest.config.ts`

- [ ] **Step 1: Replace vitest.config.ts**

Replace the entire file with:

```typescript
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		globals: true,
		projects: [
			{
				test: {
					name: "unit-node",
					environment: "node",
					include: ["src/lib/**/*.test.ts"],
					exclude: [
						"node_modules",
						".output",
						// Hook test that needs browser mode (imports renderHook)
						"src/lib/use-exercise-lookups.test.ts",
					],
				},
			},
			{
				test: {
					name: "unit-browser",
					setupFiles: ["./vitest.setup.ts"],
					include: [
						"src/*.test.{ts,tsx}",
						"src/components/**/*.test.{ts,tsx}",
						"src/hooks/**/*.test.{ts,tsx}",
						"src/routes/**/*.test.{ts,tsx}",
						// Hook test that lives in lib/ but needs browser mode
						"src/lib/use-exercise-lookups.test.ts",
					],
					exclude: ["node_modules", ".output"],
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: "chromium" }],
					},
				},
			},
		],
	},
});
```

- [ ] **Step 2: Verify node project tests still pass**

```bash
cd apps/openfit && bunx vitest run --project unit-node
```

Expected: All `src/lib/**/*.test.ts` pure logic tests pass (these have no RTL imports). The `use-exercise-lookups.test.ts` file is excluded and will be migrated later.

- [ ] **Step 3: Verify browser project starts** (tests will fail because RTL imports haven't been migrated yet — that's expected)

```bash
cd apps/openfit && bunx vitest run --project unit-browser 2>&1 | head -30
```

Expected: Chromium launches. Tests fail with import errors (RTL not available in browser mode). This confirms the browser provider is working.

- [ ] **Step 4: Commit**

```bash
cd apps/openfit && git add vitest.config.ts && git commit -m "chore: rewrite vitest config with node and browser projects"
```

---

### Task 3: Update vitest.setup.ts

**Files:**
- Modify: `apps/openfit/vitest.setup.ts`

- [ ] **Step 1: Strip RTL setup and coverage hack**

Replace the entire file with:

```typescript
// Browser-mode setup for unit-browser project.
// The @testing-library/jest-dom matchers are no longer needed —
// browser mode uses Playwright-compatible expect.element() assertions.
// The coverage/.tmp keepalive hack is no longer needed —
// monocart manages coverage directories.
```

Note: If browser-specific setup is needed later (e.g., global polyfills), it goes here. For now, an empty setup file is fine. The `setupFiles` entry stays in the config so it's ready.

- [ ] **Step 2: Commit**

```bash
cd apps/openfit && git add vitest.setup.ts && git commit -m "chore: strip RTL setup and coverage hack from vitest.setup.ts"
```

---

## Phase 2: Coverage Pipeline

### Task 4: Write merge-coverage.ts

**Files:**
- Create: `apps/openfit/scripts/merge-coverage.ts`

- [ ] **Step 1: Create the merge script**

```typescript
import { CoverageReport } from "monocart-coverage-reports";

const mode = process.argv.includes("--mode")
	? process.argv[process.argv.indexOf("--mode") + 1]
	: "merged";

const unitDirs = ["./coverage/unit-node/raw", "./coverage/unit-browser/raw"];

const inputDir =
	mode === "unit"
		? unitDirs
		: [...unitDirs, "./coverage/e2e/raw"];

const outputDir =
	mode === "unit" ? "./coverage/unit" : "./coverage/merged";

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
		// Vitest reports paths relative to project root: src/lib/utils.ts
		// Playwright reports bundled paths: /src/lib/utils.ts or /@fs/.../src/lib/utils.ts
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
		[
			"json-summary",
			{ file: "coverage-summary.json" },
		],
	],
};

await new CoverageReport(coverageOptions).generate();

console.log(`Coverage report generated in ${outputDir}`);
```

- [ ] **Step 2: Verify script parses without errors**

```bash
cd apps/openfit && bun scripts/merge-coverage.ts --mode unit 2>&1 || true
```

Expected: May fail because no raw coverage data exists yet, but should not fail on syntax/import errors. Look for "Cannot find module" (bad) vs "no coverage data" (good — means script loaded correctly).

- [ ] **Step 3: Commit**

```bash
cd apps/openfit && git add scripts/merge-coverage.ts && git commit -m "feat: add coverage merge script using monocart"
```

---

### Task 5: Update check-coverage.ts with --mode flag

**Files:**
- Modify: `apps/openfit/scripts/check-coverage.ts`

- [ ] **Step 1: Rewrite check-coverage.ts**

Replace the entire file with:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
cd apps/openfit && git add scripts/check-coverage.ts && git commit -m "feat: add --mode flag to check-coverage for unit vs merged thresholds"
```

---

### Task 6: Add monocart-reporter to playwright.config.ts

**Files:**
- Modify: `apps/openfit/playwright.config.ts`

- [ ] **Step 1: Add monocart-reporter to the reporter array**

In `apps/openfit/playwright.config.ts`, find the `reporter` configuration and add monocart-reporter conditionally:

```typescript
// Add at the top of the file, after the dotenv import:
const collectCoverage = process.env.COLLECT_COVERAGE === "true";
```

Then update the `reporter` array:

```typescript
	reporter: [
		["html", { outputFolder: "playwright-report" }],
		["list"],
		...(process.env.CI ? [["github"] as const] : []),
		...(collectCoverage
			? [
					[
						"monocart-reporter",
						{
							name: "OpenFit E2E Coverage",
							outputFile: "coverage/e2e/report.html",
							coverage: {
								reports: [["raw", { outputDir: "coverage/e2e/raw" }]],
							},
						},
					] as const,
				]
			: []),
	],
```

- [ ] **Step 2: Verify playwright config still loads**

```bash
cd apps/openfit && bunx playwright test --list 2>&1 | head -10
```

Expected: Test list prints without config errors. No coverage collection happens (COLLECT_COVERAGE is not set).

- [ ] **Step 3: Commit**

```bash
cd apps/openfit && git add playwright.config.ts && git commit -m "feat: add monocart-reporter to playwright config gated by COLLECT_COVERAGE"
```

---

### Task 7: Update package.json scripts

**Files:**
- Modify: `apps/openfit/package.json`

- [ ] **Step 1: Update the test scripts**

Replace the test-related scripts in `apps/openfit/package.json`:

```json
"test": "vitest",
"test:run": "vitest run",
"test:coverage:unit": "vitest run --coverage --fileParallelism=false && bun scripts/merge-coverage.ts --mode unit && bun scripts/check-coverage.ts --mode unit",
"test:coverage": "vitest run --coverage --fileParallelism=false && COLLECT_COVERAGE=true playwright test --project=setup --project=chromium && bun scripts/merge-coverage.ts --mode merged && bun scripts/check-coverage.ts --mode merged",
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"test:e2e:headed": "playwright test --headed",
"test:e2e:debug": "playwright test --debug",
```

Note: The old `test:coverage` script is replaced. The new one runs both unit and E2E coverage then merges.

- [ ] **Step 2: Commit**

```bash
cd apps/openfit && git add package.json && git commit -m "chore: update test scripts for vitest browser mode and coverage merge"
```

---

### Task 8: Configure vitest-monocart-coverage provider

**Files:**
- Modify: `apps/openfit/vitest.config.ts`

- [ ] **Step 1: Add monocart coverage config to vitest.config.ts**

Update the vitest.config.ts to include coverage configuration. Add to the top-level `test` object (outside `projects` since coverage applies to both):

```typescript
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	resolve: {
		tsconfigPaths: true,
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
				test: {
					name: "unit-node",
					environment: "node",
					include: ["src/lib/**/*.test.ts"],
					exclude: [
						"node_modules",
						".output",
						"src/lib/use-exercise-lookups.test.ts",
					],
				},
			},
			{
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
					exclude: ["node_modules", ".output"],
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: "chromium" }],
					},
				},
			},
		],
	},
});
```

Note: The `vitest-monocart-coverage` provider uses `provider: "custom"` with `customProviderModule`. The raw output directories for each project may need configuration — consult the `vitest-monocart-coverage` docs. If per-project output dirs aren't supported at the top level, move coverage config into each project's `test` block.

- [ ] **Step 2: Verify coverage runs on node project**

```bash
cd apps/openfit && bunx vitest run --project unit-node --coverage 2>&1 | tail -20
```

Expected: Coverage output appears. Raw V8 data written to a coverage directory.

- [ ] **Step 3: Commit**

```bash
cd apps/openfit && git add vitest.config.ts && git commit -m "feat: configure vitest-monocart-coverage provider"
```

---

## Phase 3: Test Migration

Each task in this phase shows the **complete before/after for one representative file**, then lists all remaining files that follow the same pattern. Apply the same transformation to each file.

**Import replacement reference** (used across all migration tasks):

| Old import | New import |
|---|---|
| `import { render, screen } from "@testing-library/react"` | `import { render } from "vitest-browser-react"` |
| `import { render, screen, fireEvent } from "@testing-library/react"` | `import { render } from "vitest-browser-react"` + `import { userEvent } from "@vitest/browser/context"` |
| `import { render, screen, fireEvent, waitFor } from "@testing-library/react"` | `import { render } from "vitest-browser-react"` + `import { userEvent } from "@vitest/browser/context"` |
| `import { renderHook } from "@testing-library/react"` | `import { renderHook } from "vitest-browser-react"` |
| `import { renderHook, waitFor } from "@testing-library/react"` | `import { renderHook } from "vitest-browser-react"` |
| `import { renderHook, act, waitFor } from "@testing-library/react"` | `import { renderHook } from "vitest-browser-react"` + `import { act } from "react"` (only if still needed) |

**Assertion replacement reference:**

| Old assertion | New assertion |
|---|---|
| `expect(el).toBeInTheDocument()` | `await expect.element(el).toBeInTheDocument()` |
| `expect(el).toHaveAttribute("x", "y")` | `await expect.element(el).toHaveAttribute("x", "y")` |
| `expect(el).toHaveClass("x")` | `await expect.element(el).toHaveClass("x")` |
| `expect(el).toHaveTextContent("x")` | `await expect.element(el).toHaveTextContent("x")` |
| `expect(el).toBeDisabled()` | `await expect.element(el).toBeDisabled()` |
| `expect(el).toHaveStyle({...})` | `await expect.element(el).toHaveAttribute("style", ...)` |
| `screen.getByTestId("x")` | `screen.getByTestId("x")` (destructure `screen` from `render()` return) |
| `screen.queryByText("x")` | `screen.getByText("x")` with `.query()` if checking absence |
| `fireEvent.click(el)` | `await el.click()` or `await userEvent.click(el)` |
| `fireEvent.change(el, { target: { value: "x" } })` | `await el.fill("x")` |
| `fireEvent.submit(el)` | `await el.click()` (click the submit button instead) |
| `waitFor(() => expect(...))` | `await expect.element(...).<matcher>()` (built-in retry) |
| `await screen.findByText("x")` | `await expect.element(screen.getByText("x")).toBeVisible()` |

---

### Task 9: Migrate render+screen tests (Category 1 — 16 files)

These files only import `{ render, screen }` from RTL. Simplest migration.

**Files:**
- Modify: all files listed below

- [ ] **Step 1: Migrate representative file — separator.test.tsx**

Before (`apps/openfit/src/components/ui/separator.test.tsx`):

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Separator } from "./separator";

describe("Separator", () => {
	it("renders a horizontal decorative separator by default", () => {
		render(<Separator data-testid="separator" />);

		const separator = screen.getByTestId("separator");
		expect(separator).toHaveAttribute("role", "none");
		expect(separator).toHaveAttribute("data-orientation", "horizontal");
	});

	it("renders a vertical separator and forwards custom props", () => {
		render(
			<Separator
				data-testid="separator"
				orientation="vertical"
				decorative={false}
				className="custom-separator"
			/>,
		);

		const separator = screen.getByTestId("separator");
		expect(separator).toHaveAttribute("data-orientation", "vertical");
		expect(separator).toHaveClass("custom-separator");
		expect(separator).toHaveAttribute("role", "separator");
	});
});
```

After:

```tsx
import { render } from "vitest-browser-react";
import { describe, expect, it } from "vitest";
import { Separator } from "./separator";

describe("Separator", () => {
	it("renders a horizontal decorative separator by default", async () => {
		const screen = render(<Separator data-testid="separator" />);

		const separator = screen.getByTestId("separator");
		await expect.element(separator).toHaveAttribute("role", "none");
		await expect.element(separator).toHaveAttribute("data-orientation", "horizontal");
	});

	it("renders a vertical separator and forwards custom props", async () => {
		const screen = render(
			<Separator
				data-testid="separator"
				orientation="vertical"
				decorative={false}
				className="custom-separator"
			/>,
		);

		const separator = screen.getByTestId("separator");
		await expect.element(separator).toHaveAttribute("data-orientation", "vertical");
		await expect.element(separator).toHaveClass("custom-separator");
		await expect.element(separator).toHaveAttribute("role", "separator");
	});
});
```

**Key changes:**
1. Import `render` from `vitest-browser-react` (not RTL)
2. Assign `render()` return to `screen` variable (no global `screen`)
3. Test callbacks become `async`
4. `expect(el).toHaveX()` becomes `await expect.element(el).toHaveX()`

- [ ] **Step 2: Apply same pattern to all 16 files**

```
src/components/admin/admin-page.test.tsx
src/components/admin/shared-entities-view.test.tsx
src/components/exercises/exercise-detail-modal.test.tsx
src/components/gyms/gym-card.test.tsx
src/components/layout/app-wrapper.test.tsx
src/components/layout/header.test.tsx
src/components/providers/auth-provider.test.tsx
src/components/providers/query-provider.test.tsx
src/components/providers/theme-provider.test.tsx
src/components/sessions/session-page.test.tsx
src/components/ui/calendar.test.tsx
src/components/ui/separator.test.tsx
src/routes/__root.test.tsx
src/routes/admin.test.tsx
src/routes/auth-pages.test.tsx
src/routes/logs.test.tsx
```

- [ ] **Step 3: Run browser project tests for these files**

```bash
cd apps/openfit && bunx vitest run --project unit-browser --reporter verbose 2>&1 | grep -E "PASS|FAIL|separator|calendar|admin-page|header"
```

Expected: All 16 files PASS.

- [ ] **Step 4: Commit**

```bash
cd apps/openfit && git add -A src/components src/routes && git commit -m "refactor: migrate render+screen tests to vitest-browser-react (16 files)"
```

---

### Task 10: Migrate renderHook-only tests (Category 2 — 5 files)

These files only import `{ renderHook }` with no async operations.

**Files:**
- Modify: all files listed below

- [ ] **Step 1: Migrate representative file — use-countdown-timer.test.ts**

Before (`apps/openfit/src/hooks/use-countdown-timer.test.ts`):

```typescript
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCountdownTimer } from "./use-countdown-timer";
```

After:

```typescript
import { renderHook } from "vitest-browser-react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCountdownTimer } from "./use-countdown-timer";
```

**Key change:** `renderHook` from `vitest-browser-react`, `act` from `react` (if still needed). The test body stays the same — `renderHook` API is compatible.

Note: `act()` is still needed for fake timer tests that manually trigger React state updates. Import it from `react` directly instead of RTL.

- [ ] **Step 2: Apply same pattern to all 5 files**

```
src/components/admin/use-exercise-form-state.test.ts
src/components/admin/use-exercise-image-queue.test.ts
src/hooks/use-countdown-timer.test.ts
src/hooks/use-in-view.test.ts
src/lib/use-exercise-lookups.test.ts
```

For files that don't use `act`, only change the `renderHook` import. For files that use `act`, also import `act` from `react`.

- [ ] **Step 3: Run tests**

```bash
cd apps/openfit && bunx vitest run --project unit-browser --reporter verbose 2>&1 | grep -E "use-countdown-timer|use-exercise-form|use-exercise-image|use-in-view|use-exercise-lookups"
```

Expected: All 5 files PASS.

- [ ] **Step 4: Commit**

```bash
cd apps/openfit && git add -A src/components/admin src/hooks src/lib && git commit -m "refactor: migrate renderHook-only tests to vitest-browser-react (5 files)"
```

---

### Task 11: Migrate renderHook+waitFor tests (Category 3 — 10 files)

These files import `{ renderHook, waitFor }`. The `waitFor` from RTL is no longer needed — `vitest-browser-react`'s `renderHook` result updates reactively and assertions can use `expect.poll()` for async checks.

**Files:**
- Modify: all files listed below

- [ ] **Step 1: Migrate representative file — use-exercises.test.ts**

Before (`apps/openfit/src/hooks/queries/use-exercises.test.ts`):

```typescript
import { renderHook, waitFor } from "@testing-library/react";
// ... rest of imports

const { result } = renderHook(() => useExercise(undefined), { wrapper });

await waitFor(() => {
	expect(result.current.fetchStatus).toBe("idle");
});
```

After:

```typescript
import { renderHook } from "vitest-browser-react";
// ... rest of imports

const { result } = renderHook(() => useExercise(undefined), { wrapper });

await vi.waitFor(() => {
	expect(result.current.fetchStatus).toBe("idle");
});
```

**Key changes:**
1. `renderHook` from `vitest-browser-react`
2. `waitFor` from RTL → `vi.waitFor` from vitest (built-in, works in browser mode)
3. Test body stays the same otherwise — `result.current` access is identical

- [ ] **Step 2: Apply same pattern to all 10 files**

```
src/hooks/mutations/use-admin-mutations.test.ts
src/hooks/mutations/use-set-group-mutations.test.ts
src/hooks/queries/use-admin.test.ts
src/hooks/queries/use-dashboard.test.ts
src/hooks/queries/use-exercises.test.ts
src/hooks/queries/use-gyms.test.ts
src/hooks/queries/use-lookups.test.ts
src/hooks/queries/use-routine-days.test.ts
src/hooks/queries/use-sessions.test.ts
src/hooks/queries/use-user-profile.test.ts
```

- [ ] **Step 3: Run tests**

```bash
cd apps/openfit && bunx vitest run --project unit-browser --reporter verbose 2>&1 | grep -E "use-admin|use-set-group|use-dashboard|use-exercises|use-gyms|use-lookups|use-routine-days|use-sessions|use-user-profile"
```

Expected: All 10 files PASS.

- [ ] **Step 4: Commit**

```bash
cd apps/openfit && git add -A src/hooks && git commit -m "refactor: migrate renderHook+waitFor tests to vitest-browser-react (10 files)"
```

---

### Task 12: Migrate renderHook+act tests (Category 4 — 8 files)

These files import `{ renderHook, act, waitFor }`. Mutation tests that call `mutateAsync` inside `act()`.

**Files:**
- Modify: all files listed below

- [ ] **Step 1: Migrate representative file — use-session-mutations.test.ts**

Before (`apps/openfit/src/hooks/mutations/use-session-mutations.test.ts`):

```typescript
import { act, renderHook, waitFor } from "@testing-library/react";
// ... rest of imports

const { result } = renderHook(() => useCreateSession(), { wrapper });

await act(async () => {
	await result.current.mutateAsync(input);
});

await waitFor(() => {
	expect(result.current.isSuccess).toBe(true);
});
```

After:

```typescript
import { renderHook } from "vitest-browser-react";
import { act } from "react";
// ... rest of imports

const { result } = renderHook(() => useCreateSession(), { wrapper });

await act(async () => {
	await result.current.mutateAsync(input);
});

await vi.waitFor(() => {
	expect(result.current.isSuccess).toBe(true);
});
```

**Key changes:**
1. `renderHook` from `vitest-browser-react`
2. `act` from `react` (not RTL)
3. `waitFor` → `vi.waitFor`

- [ ] **Step 2: Apply same pattern to all 8 files**

```
src/components/profile/use-profile-settings-form.test.tsx
src/hooks/mutations/use-gym-mutations.test.ts
src/hooks/mutations/use-routine-day-mutations.test.ts
src/hooks/mutations/use-routine-mutations.test.ts
src/hooks/mutations/use-session-mutations.test.ts
src/hooks/mutations/use-set-mutations.test.ts
src/hooks/mutations/use-user-profile-mutations.test.ts
src/hooks/queries/use-routines.test.ts
```

- [ ] **Step 3: Run tests**

```bash
cd apps/openfit && bunx vitest run --project unit-browser --reporter verbose 2>&1 | grep -E "use-gym-mutations|use-routine-day|use-routine-mutations|use-session-mutations|use-set-mutations|use-user-profile-mutations|use-routines|use-profile-settings"
```

Expected: All 8 files PASS.

- [ ] **Step 4: Commit**

```bash
cd apps/openfit && git add -A src/hooks src/components/profile && git commit -m "refactor: migrate renderHook+act tests to vitest-browser-react (8 files)"
```

---

### Task 13: Migrate fireEvent tests without waitFor (Category 5 — 23 files)

These files import `{ fireEvent, render, screen }`. Synchronous interactions need migration from `fireEvent` to locator-based interactions.

**Files:**
- Modify: all files listed below

- [ ] **Step 1: Migrate representative file — weekday-selector.test.tsx**

Before (`apps/openfit/src/components/routines/weekday-selector.test.tsx`):

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { WeekdaySelector } from "./weekday-selector";

function WeekdaySelectorHarness({
	initialWeekdays,
}: {
	initialWeekdays: number[];
}) {
	const [selectedWeekdays, setSelectedWeekdays] = useState(initialWeekdays);

	return (
		<WeekdaySelector
			selectedWeekdays={selectedWeekdays}
			onChange={setSelectedWeekdays}
		/>
	);
}

describe("WeekdaySelector", () => {
	it("toggles weekdays in sorted order", () => {
		const onChange = vi.fn();

		render(<WeekdaySelector selectedWeekdays={[3, 1]} onChange={onChange} />);

		expect(screen.getByRole("button", { name: "Monday" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(screen.getByRole("button", { name: "Wednesday" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);

		fireEvent.click(screen.getByRole("button", { name: "Friday" }));

		expect(onChange).toHaveBeenCalledWith([1, 3, 5]);
		expect(
			screen.getByText(
				(_, element) =>
					element?.tagName.toLowerCase() === "p" &&
					element.textContent?.includes("Wednesday, Monday") === true,
			),
		).toBeInTheDocument();
	});

	it("does not change weekdays when disabled", () => {
		const onChange = vi.fn();

		render(
			<WeekdaySelector selectedWeekdays={[0]} onChange={onChange} disabled />,
		);

		fireEvent.click(screen.getByRole("button", { name: "Sunday" }));

		expect(onChange).not.toHaveBeenCalled();
		expect(screen.getByRole("button", { name: "Sunday" })).toBeDisabled();
	});

	it("removes a selected weekday and hides the summary when none remain", () => {
		render(<WeekdaySelectorHarness initialWeekdays={[1]} />);

		expect(screen.getByText(/Selected:/)).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Monday" }));

		expect(screen.queryByText(/Selected:/)).not.toBeInTheDocument();
	});

	it("does not render a summary before any weekday is selected", () => {
		render(<WeekdaySelector selectedWeekdays={[]} onChange={vi.fn()} />);

		expect(screen.queryByText(/Selected:/)).not.toBeInTheDocument();
	});
});
```

After:

```tsx
import { render } from "vitest-browser-react";
import { userEvent } from "@vitest/browser/context";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { WeekdaySelector } from "./weekday-selector";

function WeekdaySelectorHarness({
	initialWeekdays,
}: {
	initialWeekdays: number[];
}) {
	const [selectedWeekdays, setSelectedWeekdays] = useState(initialWeekdays);

	return (
		<WeekdaySelector
			selectedWeekdays={selectedWeekdays}
			onChange={setSelectedWeekdays}
		/>
	);
}

describe("WeekdaySelector", () => {
	it("toggles weekdays in sorted order", async () => {
		const onChange = vi.fn();

		const screen = render(<WeekdaySelector selectedWeekdays={[3, 1]} onChange={onChange} />);

		await expect.element(screen.getByRole("button", { name: "Monday" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		await expect.element(screen.getByRole("button", { name: "Wednesday" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);

		await userEvent.click(screen.getByRole("button", { name: "Friday" }));

		expect(onChange).toHaveBeenCalledWith([1, 3, 5]);
		await expect.element(screen.getByText(/Wednesday, Monday/)).toBeInTheDocument();
	});

	it("does not change weekdays when disabled", async () => {
		const onChange = vi.fn();

		const screen = render(
			<WeekdaySelector selectedWeekdays={[0]} onChange={onChange} disabled />,
		);

		await userEvent.click(screen.getByRole("button", { name: "Sunday" }));

		expect(onChange).not.toHaveBeenCalled();
		await expect.element(screen.getByRole("button", { name: "Sunday" })).toBeDisabled();
	});

	it("removes a selected weekday and hides the summary when none remain", async () => {
		const screen = render(<WeekdaySelectorHarness initialWeekdays={[1]} />);

		await expect.element(screen.getByText(/Selected:/)).toBeInTheDocument();
		await userEvent.click(screen.getByRole("button", { name: "Monday" }));

		await expect.element(screen.getByText(/Selected:/)).not.toBeInTheDocument();
	});

	it("does not render a summary before any weekday is selected", async () => {
		const screen = render(<WeekdaySelector selectedWeekdays={[]} onChange={vi.fn()} />);

		await expect.element(screen.getByText(/Selected:/)).not.toBeInTheDocument();
	});
});
```

**Key changes:**
1. `render` from `vitest-browser-react`, `userEvent` from `@vitest/browser/context`
2. `screen` is a local variable from `render()` return
3. `fireEvent.click(el)` → `await userEvent.click(el)`
4. `expect(el).toX()` → `await expect.element(el).toX()` for DOM assertions
5. `screen.queryByText(...)` absence checks → `await expect.element(screen.getByText(...)).not.toBeInTheDocument()`
6. Custom text matcher functions (`(_, element) => ...`) → simplify to regex where possible
7. All test callbacks become `async`
8. Non-DOM assertions (e.g., `expect(onChange).toHaveBeenCalledWith(...)`) stay synchronous — no `expect.element()` needed

- [ ] **Step 2: Apply same pattern to all 23 files**

```
src/components/exercises/autocomplete-exercise.test.tsx
src/components/exercises/exercise-card.test.tsx
src/components/gyms/autocomplete-equipment.test.tsx
src/components/gyms/delete-gym-modal.test.tsx
src/components/gyms/equipment-selector.test.tsx
src/components/gyms/gym-menu.test.tsx
src/components/profile/profile-modal.test.tsx
src/components/routines/create-routine.test.tsx
src/components/routines/routine-card.test.tsx
src/components/routines/routine-modal.test.tsx
src/components/routines/weekday-selector.test.tsx
src/components/sessions/edit-session-menu.test.tsx
src/components/sessions/monthly-calendar.test.tsx
src/components/sessions/rest-timer.test.tsx
src/components/sessions/select-template.test.tsx
src/components/sessions/session-detail-modal.test.tsx
src/components/sessions/session-summary-card.test.tsx
src/components/ui/carousel.test.tsx
src/components/ui/date-time-picker.test.tsx
src/components/ui/duration-input.test.tsx
src/components/ui/pagination.test.tsx
src/components/ui/select.test.tsx
src/components/ui/ui-wrappers.test.tsx
```

- [ ] **Step 3: Run tests**

```bash
cd apps/openfit && bunx vitest run --project unit-browser --reporter verbose 2>&1 | grep -E "PASS|FAIL" | head -30
```

Expected: All 23 files PASS.

- [ ] **Step 4: Commit**

```bash
cd apps/openfit && git add -A src/components && git commit -m "refactor: migrate fireEvent tests to vitest-browser-react (23 files)"
```

---

### Task 14: Migrate fireEvent+waitFor tests (Category 6 — 32 files)

These files import `{ fireEvent, render, screen, waitFor }`. The largest group — async user interactions.

**Files:**
- Modify: all files listed below

- [ ] **Step 1: Migrate representative file — login-form.test.tsx**

Before (`apps/openfit/src/components/auth/login-form.test.tsx`):

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
// ... vi.mock declarations stay the same

it("refreshes session and redirects after email login", async () => {
	render(<LoginForm />);

	fireEvent.change(screen.getByLabelText("Email"), {
		target: { value: "person@example.com" },
	});
	fireEvent.change(screen.getByLabelText("Password"), {
		target: { value: "Password1!" },
	});
	fireEvent.click(screen.getByRole("button", { name: "Login" }));

	await waitFor(() => {
		expect(mockSignInEmail).toHaveBeenCalledWith({
			email: "person@example.com",
			password: "Password1!",
		});
		expect(mockGetSession).toHaveBeenCalledTimes(1);
		expect(mockNavigate).toHaveBeenCalledWith({ to: "/", replace: true });
	});
});

it("shows an error when session is missing after successful login", async () => {
	// ...
	expect(
		await screen.findByText("Authentication succeeded but session was not ready"),
	).toBeInTheDocument();
});
```

After:

```tsx
import { render } from "vitest-browser-react";
import { userEvent } from "@vitest/browser/context";
// ... vi.mock declarations stay the same

it("refreshes session and redirects after email login", async () => {
	const screen = render(<LoginForm />);

	await screen.getByLabelText("Email").fill("person@example.com");
	await screen.getByLabelText("Password").fill("Password1!");
	await userEvent.click(screen.getByRole("button", { name: "Login" }));

	await vi.waitFor(() => {
		expect(mockSignInEmail).toHaveBeenCalledWith({
			email: "person@example.com",
			password: "Password1!",
		});
		expect(mockGetSession).toHaveBeenCalledTimes(1);
		expect(mockNavigate).toHaveBeenCalledWith({ to: "/", replace: true });
	});
});

it("shows an error when session is missing after successful login", async () => {
	// ...
	await expect.element(
		screen.getByText("Authentication succeeded but session was not ready"),
	).toBeVisible();
});
```

**Key changes:**
1. `fireEvent.change(el, { target: { value: "x" } })` → `await el.fill("x")`
2. `fireEvent.click(el)` → `await userEvent.click(el)`
3. `fireEvent.submit(form)` → `await userEvent.click(submitButton)` (click the submit button directly)
4. `waitFor(() => { ... })` → `await vi.waitFor(() => { ... })` for non-DOM assertions
5. `await screen.findByText("x")` → `await expect.element(screen.getByText("x")).toBeVisible()`
6. `screen` from `render()` return, tests are `async`

- [ ] **Step 2: Apply same pattern to all 32 files**

```
src/components/admin/admin-modals-and-hooks.test.tsx
src/components/admin/admin-tables.test.tsx
src/components/admin/delete-exercise-modal.test.tsx
src/components/admin/exercise-form-modal.test.tsx
src/components/auth/login-form.test.tsx
src/components/exercises/replace-exercise-modal.test.tsx
src/components/gyms/gym-form-modal.test.tsx
src/components/layout/account-nav-item.test.tsx
src/components/routines/add-exercise-row.test.tsx
src/components/routines/delete-day-modal.test.tsx
src/components/routines/delete-routine-modal.test.tsx
src/components/routines/delete-set-group-modal.test.tsx
src/components/routines/edit-day-modal.test.tsx
src/components/routines/edit-routine-modal.test.tsx
src/components/routines/routine-day-tab.test.tsx
src/components/routines/routine-overview-tab.test.tsx
src/components/sessions/current-session-page.test.tsx
src/components/sessions/edit-duration-popover.test.tsx
src/components/sessions/edit-name-popover.test.tsx
src/components/sessions/edit-notes-popover.test.tsx
src/components/sessions/edit-rating-popover.test.tsx
src/components/sessions/edit-session-modal.test.tsx
src/components/sessions/session-controls.test.tsx
src/components/workoutSet/bulk-edit-set-modal.test.tsx
src/components/workoutSet/workout-controls.test.tsx
src/components/workoutSet/workout-list.test.tsx
src/components/workoutSet/workout-set-group.test.tsx
src/components/workoutSet/workout-set-row.test.tsx
src/routes/exercises.test.tsx
src/routes/index.test.tsx
src/routes/routines.test.tsx
src/routes/workout.test.tsx
```

- [ ] **Step 3: Run tests**

```bash
cd apps/openfit && bunx vitest run --project unit-browser --reporter verbose 2>&1 | grep -E "PASS|FAIL" | head -40
```

Expected: All 32 files PASS.

- [ ] **Step 4: Commit**

```bash
cd apps/openfit && git add -A src/components src/routes && git commit -m "refactor: migrate fireEvent+waitFor tests to vitest-browser-react (32 files)"
```

---

### Task 15: Migrate container.querySelector + act tests (Category 7+8 — 2 files)

These are the highest-complexity files. `container.querySelector` needs to be replaced with locator-based queries.

**Files:**
- Modify: `apps/openfit/src/components/ui/progress-circle.test.tsx`
- Modify: `apps/openfit/src/components/sessions/current-duration.test.tsx`

- [ ] **Step 1: Migrate progress-circle.test.tsx**

Before (`apps/openfit/src/components/ui/progress-circle.test.tsx`):

```tsx
import { render, screen } from "@testing-library/react";

it("renders with default props", () => {
	const { container } = render(<ProgressCircle value={50} />);
	const svg = container.querySelector("svg");
	expect(svg).toBeInTheDocument();
});

it("uses default size of 100", () => {
	const { container } = render(<ProgressCircle value={50} />);
	const wrapper = container.firstChild as HTMLElement;
	expect(wrapper).toHaveStyle({ width: "100px", height: "100px" });
});

it("calculates correct radius based on size and strokeWidth", () => {
	const { container } = render(
		<ProgressCircle value={50} size={size} strokeWidth={strokeWidth} />,
	);
	const circle = container.querySelector("circle");
	expect(circle).toHaveAttribute("r", String(expectedRadius));
});
```

After:

```tsx
import { render } from "vitest-browser-react";
import { page } from "@vitest/browser/context";

it("renders with default props", async () => {
	render(<ProgressCircle value={50} />);
	await expect.element(page.getByRole("img").or(page.locator("svg"))).toBeVisible();
});

it("uses default size of 100", async () => {
	const screen = render(<ProgressCircle value={50} />);
	await expect.element(screen.getByTestId("progress-circle")).toHaveAttribute("style", /width: 100px/);
});

it("calculates correct radius based on size and strokeWidth", async () => {
	render(<ProgressCircle value={50} size={size} strokeWidth={strokeWidth} />);
	const circle = page.locator("circle").first();
	await expect.element(circle).toHaveAttribute("r", String(expectedRadius));
});
```

**Key changes:**
1. `container.querySelector("svg")` → `page.locator("svg")` or role-based query
2. `container.querySelectorAll("circle")` → `page.locator("circle")`
3. `container.firstChild` → use a test ID or `page.locator()` with CSS selector
4. `toHaveStyle({ width: "100px" })` → `toHaveAttribute("style", /width: 100px/)` or add `data-testid` to the component
5. Import `page` from `@vitest/browser/context` for CSS-selector-based queries

Note: Some tests may require adding `data-testid` attributes to the `ProgressCircle` component to make queries more reliable. This is preferred over fragile CSS selectors.

- [ ] **Step 2: Migrate current-duration.test.tsx**

Apply the same pattern: replace `container` queries with `page.locator()` or role/testid queries. Replace `act` import to come from `react` instead of RTL.

- [ ] **Step 3: Run tests**

```bash
cd apps/openfit && bunx vitest run --project unit-browser --reporter verbose 2>&1 | grep -E "progress-circle|current-duration"
```

Expected: Both files PASS.

- [ ] **Step 4: Commit**

```bash
cd apps/openfit && git add -A src/components && git commit -m "refactor: migrate container.querySelector and act tests to vitest-browser-react (2 files)"
```

---

### Task 16: Run full test suite and fix failures

- [ ] **Step 1: Run all tests across both projects**

```bash
cd apps/openfit && bunx vitest run
```

Expected: All tests pass across both `unit-node` and `unit-browser` projects.

- [ ] **Step 2: Fix any remaining failures**

If any tests fail, debug and fix them. Common issues:
- Missing `await` on interactions or assertions
- `screen` variable shadowing (local `screen` from `render()` vs accidental global reference)
- `vi.waitFor` timeout needs increasing for slow async operations
- `page.locator()` selectors not matching the actual DOM structure

- [ ] **Step 3: Commit fixes**

```bash
cd apps/openfit && git add -A && git commit -m "fix: resolve remaining test failures after browser mode migration"
```

---

## Phase 4: Cleanup

### Task 17: Remove old dependencies

**Files:**
- Modify: `apps/openfit/package.json`

- [ ] **Step 1: Remove RTL, jsdom, and old coverage deps**

```bash
cd apps/openfit && bun remove @testing-library/react @testing-library/dom @testing-library/jest-dom @vitest/coverage-v8 jsdom
```

- [ ] **Step 2: Verify no imports remain**

```bash
cd apps/openfit && grep -r "@testing-library" src/ --include="*.ts" --include="*.tsx" | head -5
```

Expected: No matches. If any remain, fix them.

```bash
cd apps/openfit && grep -r "jsdom" vitest.config.ts vitest.setup.ts
```

Expected: No matches.

- [ ] **Step 3: Run all tests to confirm nothing broke**

```bash
cd apps/openfit && bunx vitest run
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
cd apps/openfit && git add package.json bun.lock && git commit -m "chore: remove @testing-library/*, jsdom, and @vitest/coverage-v8"
```

---

### Task 18: Verify coverage pipeline end-to-end

- [ ] **Step 1: Run unit coverage**

```bash
cd apps/openfit && bun run test:coverage:unit
```

Expected: Coverage report generated, thresholds pass (80%/85%).

- [ ] **Step 2: Run full merged coverage** (requires E2E environment to be set up)

```bash
cd apps/openfit && bun run test:coverage
```

Expected: Both unit and E2E coverage collected, merged, 95% threshold enforced.

If E2E environment isn't available, verify the merge script works with just unit data:

```bash
cd apps/openfit && bun scripts/merge-coverage.ts --mode merged
```

Expected: Merged report generated (with only unit data, E2E directory may be empty/missing — script should handle gracefully).

- [ ] **Step 3: Inspect coverage report**

```bash
cd apps/openfit && cat coverage/unit/coverage-summary.json | head -20
```

Expected: JSON with file-level coverage percentages.

- [ ] **Step 4: Commit any final adjustments**

```bash
cd apps/openfit && git add -A && git commit -m "chore: verify coverage pipeline end-to-end"
```

---

### Task 19: Update .gitignore for new coverage directories

**Files:**
- Modify: `apps/openfit/.gitignore` (or root `.gitignore`)

- [ ] **Step 1: Ensure coverage directories are gitignored**

Check that these paths are covered by existing gitignore rules:
- `coverage/unit-node/`
- `coverage/unit-browser/`
- `coverage/e2e/`
- `coverage/unit/`
- `coverage/merged/`

If the existing `/coverage` rule covers them all (since they're subdirectories), no change needed. Verify:

```bash
cd apps/openfit && git check-ignore coverage/unit-node coverage/unit-browser coverage/e2e coverage/unit coverage/merged
```

Expected: All paths listed as ignored.

- [ ] **Step 2: Commit if changes needed**

```bash
cd apps/openfit && git add .gitignore && git commit -m "chore: update gitignore for new coverage directories"
```
