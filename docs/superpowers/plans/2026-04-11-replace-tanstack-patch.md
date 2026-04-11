# Replace `patch-tanstack-imports.ts` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete the `patch-tanstack-imports.ts` postinstall workaround and replace it with a small Vite plugin in `apps/openfit/vitest.config.ts` that resolves `#tanstack-router-entry` and `#tanstack-start-entry` to an inline stub module during test runs.

**Architecture:** Add an inline Vite plugin (`stubTanstackVirtualEntries`) to `apps/openfit/vitest.config.ts` that intercepts the two virtual subpath imports via `resolveId` and serves a no-op stub via `load`. Wire it into both test projects' `plugins` arrays. Then delete the patch script and remove its `postinstall` hook from `apps/openfit/package.json`. Production builds (Docker, `vite.config.ts`) are not touched.

**Tech Stack:** Vitest 4, Vite plugin API (Rollup-compatible `resolveId`/`load` hooks), TypeScript, Bun, biome (lint).

**Spec:** `docs/superpowers/specs/2026-04-10-replace-tanstack-patch-design.md`

---

## File Structure

| File | Change |
|---|---|
| `apps/openfit/vitest.config.ts` | Modify: define `stubTanstackVirtualEntries` plugin function above `defineConfig`; add it to each test project's `plugins` array; import `Plugin` type from `vitest/config`. |
| `apps/openfit/package.json` | Modify: remove the `"postinstall": "bun scripts/patch-tanstack-imports.ts"` line from `scripts`. |
| `apps/openfit/scripts/patch-tanstack-imports.ts` | Delete. |

No new files. No production-build files touched. No test source files touched.

---

## Task 1: Confirm a clean baseline before changing anything

**Files:**
- None (read-only verification)

The whole point of this work is to remove a postinstall script, so it is critical to know what state `node_modules` and the test suite are in *before* you start. If tests are already broken on `main`, you will not be able to tell whether your changes broke them or whether they were already broken.

- [ ] **Step 1: Confirm working tree is clean and on main**

Run from repo root (`/Users/pauldiloreto/Projects/openfit`):

```bash
git status
git log --oneline -3
```

Expected: Working tree clean. Top commit is `d6e34df docs: add design doc for replacing tanstack patch script` (or a later doc commit). Branch is `main`.

If working tree is dirty, STOP and report — do not stash.

- [ ] **Step 2: Run the affected test commands once on the unmodified codebase**

From repo root:

```bash
cd apps/openfit
bun run test:run
```

Expected: Both test projects (`unit-node` and `unit-browser`) pass. Note the pass counts — you will compare against them at the end.

If tests fail at this baseline, STOP and report BLOCKED. Do not proceed; the spec assumes a green baseline so we can attribute any regression to the change.

- [ ] **Step 3: Confirm the patch script has run and node_modules is in its patched state**

From repo root:

```bash
cd /Users/pauldiloreto/Projects/openfit
find node_modules/.bun -name "package.json" -path "*@tanstack+start-server-core*" -exec grep -l "tanstack-router-entry" {} \;
```

Expected: One or more paths print. This confirms the current state of `node_modules` includes the patched `imports` entries.

If nothing prints, the patch never ran (perhaps `bun install` was run with `--ignore-scripts` recently). Run `bun install` from repo root to apply the patch, then re-run this step. Do not proceed until you see at least one match.

---

## Task 2: Add the `stubTanstackVirtualEntries` plugin to `vitest.config.ts`

**Files:**
- Modify: `apps/openfit/vitest.config.ts`

The plugin must be defined in TypeScript with the correct `Plugin` type from Vitest's re-exported Vite types so biome and tsc both stay happy. It must run with `enforce: "pre"` so its `resolveId` runs before Vite's built-in resolver fails on the `#`-prefixed specifier. The resolved id starts with `\0` to mark it as a virtual module not on disk (Vite/Rollup convention) so Vite skips its normal disk-resolution pipeline.

The current `vitest.config.ts` (read it before editing — the line numbers below are from the present state):

```ts
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

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
```

- [ ] **Step 1: Update the import to bring in the `Plugin` type**

Change the import line:

```ts
import { defineConfig } from "vitest/config";
```

to:

```ts
import { defineConfig, type Plugin } from "vitest/config";
```

If your editor reports that `Plugin` isn't exported from `vitest/config`, fall back to importing it from `vite` instead:

```ts
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";
```

`vitest/config` re-exports Vite's `Plugin` type in current Vitest versions, but the fallback covers older API surfaces.

- [ ] **Step 2: Define the plugin function above `defineConfig`**

Insert the following function definition between the imports and the `export default defineConfig({` line:

```ts
const stubTanstackVirtualEntries = (): Plugin => {
	const STUB_ID = "\0virtual:tanstack-stub-entry";
	const VIRTUAL_IDS = new Set([
		"#tanstack-router-entry",
		"#tanstack-start-entry",
	]);
	return {
		name: "stub-tanstack-virtual-entries",
		enforce: "pre",
		resolveId(id) {
			if (VIRTUAL_IDS.has(id)) {
				return STUB_ID;
			}
		},
		load(id) {
			if (id === STUB_ID) {
				return "export async function getServerFnById() {}";
			}
		},
	};
};
```

Use tabs for indentation — the rest of the file uses tabs (biome enforces this).

- [ ] **Step 3: Add the plugin to the `unit-node` project's config**

The `unit-node` project currently has no `plugins` field at all. Add one. The project block should change from:

```ts
{
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
```

to:

```ts
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
```

- [ ] **Step 4: Add the plugin to the `unit-browser` project's config**

The `unit-browser` project block should change from:

```ts
{
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
```

to:

```ts
{
	plugins: [stubTanstackVirtualEntries()],
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
```

- [ ] **Step 5: Do NOT touch the top-level `plugins: [react()]`**

The top-level `plugins` array stays as `[react()]`. Adding `stubTanstackVirtualEntries()` there is unnecessary because the per-project `plugins` arrays already cover the only consumers that matter, and a top-level entry would not propagate to projects that have their own `plugins` field.

- [ ] **Step 6: Verify the file parses**

Run from repo root:

```bash
cd apps/openfit
bunx tsc --noEmit -p tsconfig.json
```

Expected: No errors. If `tsc` complains about the `Plugin` import, fall back to importing from `vite` (Step 1). If it complains about anything else (typo, missing comma), re-read your changes against Steps 2-4.

- [ ] **Step 7: Run lint**

```bash
cd apps/openfit
bun run lint
```

Expected: Biome reports no issues. If it reports formatting issues, run `bun run lint:fix` and re-verify with `bun run lint`.

---

## Task 3: Verify the patched-but-still-via-postinstall state still works

This task is a sanity check. With the plugin in place but the postinstall script still active, tests should still pass — the plugin's `resolveId` returns the stub before Vite even tries the patched `package.json#imports`, so they coexist peacefully. If this fails, the plugin itself is broken and we need to fix it before moving on to deleting the patch script.

**Files:**
- None (verification only)

- [ ] **Step 1: Run both test projects**

From repo root:

```bash
cd apps/openfit
bun run test:run
```

Expected: Both `unit-node` and `unit-browser` projects pass with the same totals as Task 1 Step 2.

If `unit-browser` fails with errors about `#tanstack-router-entry` or `#tanstack-start-entry`, the plugin's `resolveId` is not catching the specifier. Common causes:
- Plugin attached only at the top level instead of inside each project's `plugins` array.
- Missing `enforce: "pre"`.
- Typo in one of the `VIRTUAL_IDS` strings.

To debug, temporarily add `console.log("[stub] resolveId", id);` as the first line of `resolveId` and re-run. You should see the virtual ids print. Remove the log before continuing.

If `unit-browser` fails with errors that *don't* mention the virtual ids, the regression is unrelated to your change — investigate before continuing.

---

## Task 4: Delete the postinstall hook and the patch script

**Files:**
- Modify: `apps/openfit/package.json`
- Delete: `apps/openfit/scripts/patch-tanstack-imports.ts`

- [ ] **Step 1: Remove the postinstall line from `apps/openfit/package.json`**

Open `apps/openfit/package.json`. The current `scripts` block (around lines 21-42) starts with:

```json
"scripts": {
	"postinstall": "bun scripts/patch-tanstack-imports.ts",
	"dev": "bun --bun vite dev",
```

Delete the `"postinstall": ...` line entirely so the block becomes:

```json
"scripts": {
	"dev": "bun --bun vite dev",
```

Make sure you do not leave a dangling comma. The line above `"dev"` should be the opening `"scripts": {`.

- [ ] **Step 2: Delete the patch script file**

Run from repo root:

```bash
git rm apps/openfit/scripts/patch-tanstack-imports.ts
```

Expected: `rm 'apps/openfit/scripts/patch-tanstack-imports.ts'`. The `git rm` both deletes the file and stages the deletion.

If `git rm` errors with "did not match any files", the file is already gone — check `git status` to confirm and proceed.

- [ ] **Step 3: Confirm no other file references the deleted script**

```bash
cd /Users/pauldiloreto/Projects/openfit
```

Then use Grep tool (not bash grep) to search:
- pattern: `patch-tanstack-imports`
- path: repo root
- output_mode: `files_with_matches`

Expected results: only the design spec (`docs/superpowers/specs/2026-04-10-replace-tanstack-patch-design.md`) and possibly the historical Docker fix design/plan docs. **No code, config, or workflow file should reference it.** If any code or workflow file matches, that's a leftover reference — remove it before continuing.

---

## Task 5: Verify with a clean reinstall (the load-bearing test)

This is the test that actually proves the plugin works. With the postinstall removed, a clean `bun install` will leave `node_modules` in its pristine upstream state — no patched `imports` entries. If the plugin is doing its job, tests still pass anyway.

**Files:**
- None (verification only)

- [ ] **Step 1: Wipe and reinstall node_modules**

From repo root:

```bash
rm -rf node_modules apps/openfit/node_modules apps/docs/node_modules apps/mobile-app/node_modules
bun install --frozen-lockfile
```

Expected: Install completes successfully. **No "[patch-tanstack-imports]" output should appear** — the postinstall is gone. If you see that message, you missed Task 4 Step 1.

- [ ] **Step 2: Confirm `node_modules` is unpatched**

```bash
find node_modules/.bun -name "package.json" -path "*@tanstack+start-server-core*" -exec grep -l "tanstack-router-entry" {} \;
```

Expected: **Nothing prints.** This is the opposite of Task 1 Step 3 — the upstream `package.json` does not contain `tanstack-router-entry`, so the grep finds no matches.

If something prints, either (a) the postinstall ran anyway (re-check Task 4 Step 1), or (b) the rm did not actually wipe the relevant directory (re-run Step 1 with `sudo` or check filesystem perms).

- [ ] **Step 3: Run the full test suite**

From repo root:

```bash
cd apps/openfit
bun run test:run
```

Expected: Both `unit-node` and `unit-browser` projects pass with the same totals as Task 1 Step 2.

If `unit-browser` fails with errors about `#tanstack-router-entry` or `#tanstack-start-entry`, the plugin is not effective in a fresh-install state. Re-read Task 2 carefully; the most likely culprit is that the plugin is attached at the wrong scope (top-level instead of per-project).

If a test that previously passed now fails for unrelated reasons, investigate — do not proceed.

- [ ] **Step 4: Run lint one more time**

```bash
cd apps/openfit
bun run lint
```

Expected: No issues. Run `bun run lint:fix` and re-verify if needed.

---

## Task 6: Commit

**Files:**
- Commit: `apps/openfit/vitest.config.ts`, `apps/openfit/package.json`, `apps/openfit/scripts/patch-tanstack-imports.ts` (deletion)

- [ ] **Step 1: Confirm exactly the expected files are staged**

```bash
git status
```

Expected:

```
modified:   apps/openfit/package.json
modified:   apps/openfit/vitest.config.ts
deleted:    apps/openfit/scripts/patch-tanstack-imports.ts
```

If anything else is staged or unstaged, investigate before committing. Do not stage unrelated changes.

```bash
git diff --cached apps/openfit/package.json apps/openfit/vitest.config.ts
```

Expected: One line removed from `package.json` (the postinstall entry) and the plugin function plus two `plugins: [stubTanstackVirtualEntries()]` entries added to `vitest.config.ts`.

- [ ] **Step 2: Stage and commit**

```bash
git add apps/openfit/package.json apps/openfit/vitest.config.ts
git commit -m "$(cat <<'EOF'
refactor: replace tanstack postinstall patch with vitest plugin

The openfit workspace had a postinstall script that mutated
node_modules to add stub package.json#imports entries to
@tanstack/start-server-core, working around dynamic subpath
imports (#tanstack-router-entry, #tanstack-start-entry) that
upstream declares but never resolves. The script ran on every
install, broke Docker builds (now bypassed via --ignore-scripts),
and operated by rewriting hoisted dependency files.

Replace it with an inline Vite plugin in vitest.config.ts that
intercepts the two specifiers via resolveId and serves a no-op
stub via load. The plugin is wired into both test projects'
plugins arrays. Production builds are unaffected (the real
TanStack Start Vite plugin in vite.config.ts handles these
specifiers natively).

Delete the script file and remove the postinstall entry.
EOF
)"
```

Commitlint enforces `scope-empty: always`, so use `refactor:` (no scope) — not `refactor(test):`.

Lefthook will run pre-commit and commit-msg hooks. Do not pass `--no-verify`. If a hook fails, fix the reported issue, re-stage, and create a NEW commit (do NOT use `--amend`).

Do NOT add a Co-Authored-By line.

- [ ] **Step 3: Confirm the commit landed**

```bash
git log -1 --stat
```

Expected: Top commit is the refactor. Three files changed: `vitest.config.ts` (modified), `package.json` (modified), `scripts/patch-tanstack-imports.ts` (deleted, ~107 lines removed).

---

## Task 7: Push and watch CI

**Files:**
- None (CI verification)

- [ ] **Step 1: Push to main**

```bash
git push
```

The user has pre-approved committing directly to `main` for cleanup tasks like this, but if you are uncertain, ASK before pushing.

- [ ] **Step 2: Watch the CI workflow**

```bash
gh run list --workflow CI --limit 3
gh run watch
```

Expected: The new run for the latest commit completes with `conclusion: success`. The `Unit Tests` job (the one that previously took ~26 minutes when broken) should pass with a normal duration.

If it fails, fetch logs:

```bash
gh run view --log-failed
```

The most likely failure mode: the `unit-browser` project crashes during Rolldown's pre-bundle scan with an error mentioning `#tanstack-router-entry` or `#tanstack-start-entry`. If so, the plugin is not catching the specifier in the CI environment — investigate by checking that both per-project `plugins` arrays were committed (re-read the diff).

- [ ] **Step 3: Confirm the Docker workflow still passes**

The Docker publish workflow uses `--ignore-scripts`, so it is independent of this change. But it runs on every push to `main`, so confirm it still succeeds:

```bash
gh run list --workflow "Build and Publish Docker Image" --limit 1 --json conclusion
```

Expected: `[{"conclusion":"success"}]` for the latest run.

---

## Self-Review Notes

**Spec coverage:**
- Spec "Approach" / "The plugin" → Task 2
- Spec "Plugin placement" (both test projects) → Task 2 Steps 3 and 4
- Spec "Files changed" table → Tasks 2 and 4
- Spec "Verification" steps 1-5 → Tasks 1, 3, 5, and 7
- Spec "Out of scope" items → intentionally not covered (Dockerfile untouched, vite.config.ts untouched, no upstream issue, no test source files)

**Placeholder scan:** No TBDs, no "add error handling", no "similar to Task N". Every code block is literal content. The one debug suggestion (temporary `console.log` in Task 3) is conditional and explicitly called out as temporary.

**Type consistency:** The function name `stubTanstackVirtualEntries`, the constants `STUB_ID` and `VIRTUAL_IDS`, the plugin name `"stub-tanstack-virtual-entries"`, and the stub id `"\0virtual:tanstack-stub-entry"` are used identically across Tasks 2, 3, 5, and the spec. No drift.
