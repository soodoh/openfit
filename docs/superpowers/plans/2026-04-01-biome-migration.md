# Biome Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace oxlint + prettier with biome for linting, formatting, and import sorting across the monorepo.

**Architecture:** Single `biome.json` at the repo root covers all workspaces. Lint scripts in each workspace call `biome check`. Lefthook pre-commit hook consolidated from two commands to one.

**Tech Stack:** @biomejs/biome 2.x, Bun, Turborepo, Lefthook

**Spec:** `docs/superpowers/specs/2026-04-01-biome-migration-design.md`

---

### Task 1: Install biome and create root config

**Files:**

- Create: `biome.json`
- Modify: `package.json` (root)

- [ ] **Step 1: Install biome**

Run:

```bash
bun add -d @biomejs/biome@^2.4.10 --cwd .
```

Expected: `@biomejs/biome` appears in root `package.json` devDependencies.

- [ ] **Step 2: Create `biome.json` at the repo root**

Create `biome.json` with this content:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "files": {
    "ignore": [
      ".output",
      "node_modules",
      "e2e/.auth",
      "playwright-report",
      "test-results",
      "coverage",
      "src/routeTree.gen.ts",
      "src/route-tree.gen.ts",
      "dist"
    ]
  },
  "formatter": {
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 80
  },
  "linter": {
    "rules": {
      "recommended": true
    }
  },
  "organizeImports": {
    "enabled": true
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always"
    }
  }
}
```

- [ ] **Step 3: Verify biome runs**

Run:

```bash
bunx biome check . --max-diagnostics=10
```

Expected: biome outputs diagnostics (formatting diffs, lint warnings). This is expected — we haven't reformatted yet. The goal is to confirm biome reads the config and runs without crashing.

- [ ] **Step 4: Commit**

```bash
git add biome.json package.json bun.lock
git commit -m "chore: install biome and add root config"
```

---

### Task 2: Remove oxlint and prettier configs and dependencies

**Files:**

- Delete: `.prettierrc`
- Delete: `.prettierignore`
- Delete: `apps/openfit/.prettierignore`
- Delete: `apps/openfit/oxlint.config.mjs`
- Modify: `package.json` (root) — remove `oxlint`, `prettier` from devDependencies
- Modify: `apps/openfit/package.json` — remove `oxlint`, `@standard-config/oxlint`, `prettier` from devDependencies

- [ ] **Step 1: Delete prettier config files**

```bash
rm .prettierrc .prettierignore apps/openfit/.prettierignore
```

- [ ] **Step 2: Delete oxlint config**

```bash
rm apps/openfit/oxlint.config.mjs
```

- [ ] **Step 3: Remove oxlint and prettier from root devDependencies**

In `package.json` (root), remove these two lines from `devDependencies`:

```diff
-    "oxlint": "^1.58.0",
-    "prettier": "^3.8.1",
```

Resulting `devDependencies`:

```json
{
  "@changesets/cli": "^2.30.0",
  "@commitlint/cli": "^20.5.0",
  "@commitlint/config-conventional": "^20.5.0",
  "@commitlint/types": "^20.5.0",
  "lefthook": "^2.1.4",
  "turbo": "^2.9.3",
  "@biomejs/biome": "^2.4.10"
}
```

- [ ] **Step 4: Remove oxlint, @standard-config/oxlint, prettier from openfit devDependencies**

In `apps/openfit/package.json`, remove these three lines from `devDependencies`:

```diff
-    "@standard-config/oxlint": "^1.6.2",
-    "oxlint": "^1.51.0",
-    "prettier": "^3.8.1",
```

- [ ] **Step 5: Reinstall to update lockfile**

```bash
bun install
```

Expected: lockfile updates, no errors.

- [ ] **Step 6: Commit**

```bash
git add -u . && git add bun.lock
git commit -m "chore: remove oxlint and prettier configs and dependencies"
```

---

### Task 3: Update lint scripts in all workspaces

**Files:**

- Modify: `apps/openfit/package.json` — update `lint` and `lint:fix` scripts
- Modify: `apps/docs/package.json` — update `lint` and `lint:fix` scripts
- Modify: `apps/mobile-app/package.json` — update `lint` and `lint:fix` scripts

- [ ] **Step 1: Update openfit lint scripts**

In `apps/openfit/package.json`, change the `lint` and `lint:fix` scripts:

```diff
-    "lint": "bun x oxlint -c oxlint.config.mjs . && prettier --check .",
-    "lint:fix": "bun x oxlint -c oxlint.config.mjs --fix . && prettier --write .",
+    "lint": "biome check .",
+    "lint:fix": "biome check --write .",
```

- [ ] **Step 2: Update docs lint scripts**

In `apps/docs/package.json`, change:

```diff
-    "lint": "echo 'docs lint placeholder'",
-    "lint:fix": "echo 'docs lint fix placeholder'",
+    "lint": "biome check .",
+    "lint:fix": "biome check --write .",
```

- [ ] **Step 3: Update mobile-app lint scripts**

In `apps/mobile-app/package.json`, change:

```diff
-    "lint": "echo 'mobile-app lint placeholder'",
-    "lint:fix": "echo 'mobile-app lint fix placeholder'",
+    "lint": "biome check .",
+    "lint:fix": "biome check --write .",
```

- [ ] **Step 4: Commit**

```bash
git add apps/openfit/package.json apps/docs/package.json apps/mobile-app/package.json
git commit -m "chore: update lint scripts to use biome"
```

---

### Task 4: Update lefthook pre-commit hooks

**Files:**

- Modify: `lefthook.yml`

- [ ] **Step 1: Replace prettier and oxlint hooks with biome**

Replace the entire `pre-commit` section in `lefthook.yml`. The `commit-msg` section stays unchanged.

Full file content after change:

```yaml
pre-commit:
  parallel: true
  commands:
    biome:
      glob: "*.{js,jsx,ts,tsx,json,css}"
      run: bunx biome check --write {staged_files}
      stage_fixed: true

commit-msg:
  commands:
    commitlint:
      run: bunx commitlint --edit {1}
```

- [ ] **Step 2: Commit**

```bash
git add lefthook.yml
git commit -m "chore: consolidate lefthook hooks to use biome"
```

---

### Task 5: Reformat the entire codebase

**Files:**

- Many files across the repo (formatting + import sorting changes)

- [ ] **Step 1: Run biome format and lint fix across the codebase**

```bash
bunx biome check --write .
```

Expected: biome reformats files and sorts imports. Output shows which files were modified.

- [ ] **Step 2: Verify biome check passes cleanly**

```bash
bunx biome check .
```

Expected: exit code 0, no diagnostics. If there are remaining lint errors that can't be auto-fixed, review them and either fix manually or adjust `biome.json` rules.

- [ ] **Step 3: Verify turbo lint passes**

```bash
bun run lint
```

Expected: all workspace lint tasks pass.

- [ ] **Step 4: Commit the reformatted codebase**

```bash
git add -A
git commit -m "style: reformat codebase with biome"
```

---

### Task 6: Add git-blame-ignore-revs and run tests

**Files:**

- Create: `.git-blame-ignore-revs`

- [ ] **Step 1: Get the SHA of the formatting commit**

```bash
git log --oneline -1
```

Copy the SHA from the output (the commit from Task 5 Step 4).

- [ ] **Step 2: Create `.git-blame-ignore-revs`**

Create `.git-blame-ignore-revs` with the formatting commit SHA:

```
# Biome migration: mass reformat
<SHA from step 1>
```

- [ ] **Step 3: Configure git to use the ignore-revs file**

```bash
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

- [ ] **Step 4: Run unit tests**

```bash
bun run test:run
```

Expected: all tests pass. Formatting and import sorting changes should not affect test behavior.

- [ ] **Step 5: Commit**

```bash
git add .git-blame-ignore-revs
git commit -m "chore: add git-blame-ignore-revs for biome reformat"
```
