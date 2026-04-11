# Docker Postinstall Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the `Build and Publish Docker Image` workflow on `main` by making `apps/openfit/scripts/patch-tanstack-imports.ts` available inside the Docker builder stage before `bun install` runs its `postinstall` hook.

**Architecture:** Add one `COPY` line to `apps/openfit/Dockerfile` that copies the single patch script into the builder image immediately before `RUN bun install --frozen-lockfile`. Copying only the single file (not the whole `apps/openfit/scripts/` directory) keeps the install layer's cache stable — it invalidates only when the patch script itself changes, not on edits to unrelated scripts like `dev-init.sh` or `docker-entrypoint.sh`.

**Tech Stack:** Docker, Bun, Dockerfile multi-stage builds.

**Spec:** `docs/superpowers/specs/2026-04-10-docker-postinstall-fix-design.md`

---

## File Structure

- Modify: `apps/openfit/Dockerfile` — add one `COPY` line inside the builder stage between the workspace manifest copies and `RUN bun install --frozen-lockfile`.

No new files. No changes to `package.json`, the patch script, or any other workflow file. This is a single-line Dockerfile fix.

---

## Task 1: Reproduce the failure locally

**Files:**
- None (read-only verification)

- [ ] **Step 1: Build the image on the current `main` to confirm the bug reproduces locally**

Run from repo root:

```bash
docker build -f apps/openfit/Dockerfile --target builder -t openfit-builder-broken .
```

Expected: The build fails during `RUN bun install --frozen-lockfile` with output similar to:

```
error: Module not found "scripts/patch-tanstack-imports.ts"
error: postinstall script from "openfit" exited with 1
ERROR: process "/bin/sh -c bun install --frozen-lockfile" did not complete successfully: exit code: 1
```

If the build *succeeds* (e.g. because Docker's layer cache is serving a pre-bug layer), force a clean rebuild:

```bash
docker build --no-cache -f apps/openfit/Dockerfile --target builder -t openfit-builder-broken .
```

If the build still succeeds after `--no-cache`, stop and investigate — the bug may already be fixed or the environment differs from CI. Do not proceed with the fix until you have seen the failure reproduce.

---

## Task 2: Apply the fix

**Files:**
- Modify: `apps/openfit/Dockerfile:13-14`

- [ ] **Step 1: Read the current Dockerfile builder stage**

Open `apps/openfit/Dockerfile`. The builder stage currently looks like this (lines 1-18):

```dockerfile
# Stage 1: Build
FROM oven/bun:1-alpine AS builder

WORKDIR /repo

# Install build dependencies
RUN apk add --no-cache bash

# Install dependencies (cached layer - only re-runs when lockfile changes)
COPY package.json bun.lock turbo.json ./
COPY apps/openfit/package.json ./apps/openfit/package.json
COPY apps/docs/package.json ./apps/docs/package.json
COPY apps/mobile-app/package.json ./apps/mobile-app/package.json
RUN bun install --frozen-lockfile

# Copy source and build the openfit workspace
COPY . .
RUN bun run build:openfit
```

- [ ] **Step 2: Add the `COPY` line for the patch script**

Insert one new line immediately before `RUN bun install --frozen-lockfile`, after the `apps/mobile-app/package.json` copy. The builder stage should then read:

```dockerfile
# Stage 1: Build
FROM oven/bun:1-alpine AS builder

WORKDIR /repo

# Install build dependencies
RUN apk add --no-cache bash

# Install dependencies (cached layer - only re-runs when lockfile changes)
COPY package.json bun.lock turbo.json ./
COPY apps/openfit/package.json ./apps/openfit/package.json
COPY apps/docs/package.json ./apps/docs/package.json
COPY apps/mobile-app/package.json ./apps/mobile-app/package.json
COPY apps/openfit/scripts/patch-tanstack-imports.ts ./apps/openfit/scripts/patch-tanstack-imports.ts
RUN bun install --frozen-lockfile

# Copy source and build the openfit workspace
COPY . .
RUN bun run build:openfit
```

The key change is this single added line:

```dockerfile
COPY apps/openfit/scripts/patch-tanstack-imports.ts ./apps/openfit/scripts/patch-tanstack-imports.ts
```

Do not touch anything else in the file. Do not copy the entire `apps/openfit/scripts/` directory — that would invalidate the install layer whenever any unrelated script (`dev-init.sh`, `docker-entrypoint.sh`, `merge-coverage.ts`, etc.) changes.

---

## Task 3: Verify the builder stage succeeds

**Files:**
- None (verification only)

- [ ] **Step 1: Rebuild the builder stage with the fix**

Run from repo root:

```bash
docker build -f apps/openfit/Dockerfile --target builder -t openfit-builder-fixed .
```

Expected: The build completes successfully. The `RUN bun install --frozen-lockfile` step should print output similar to:

```
bun install v1.3.x
Resolved, downloaded and extracted [NNN]
[patch-tanstack-imports] Patched N @tanstack/start-server-core version(s)
```

(The exact "Patched N" count depends on how many versions Bun hoisted; "All N version(s) already patched" is also acceptable.)

If `bun install` still fails with `Module not found "scripts/patch-tanstack-imports.ts"`, the `COPY` line is in the wrong position or has a typo. Re-read Task 2 Step 2 and confirm the line is between `COPY apps/mobile-app/package.json ...` and `RUN bun install --frozen-lockfile`.

- [ ] **Step 2: Build the full image (not just the builder stage) to confirm nothing downstream broke**

Run from repo root:

```bash
docker build -f apps/openfit/Dockerfile -t openfit-full .
```

Expected: Both stages (`builder` and `runner`) complete successfully. The final image tag `openfit-full` should exist.

Verify with:

```bash
docker image inspect openfit-full --format '{{.Id}}'
```

Expected: A SHA256 image ID is printed. If the command errors with "No such image", the build did not complete — re-read the build output and diagnose.

---

## Task 4: Commit the fix

**Files:**
- Commit: `apps/openfit/Dockerfile`

- [ ] **Step 1: Confirm only the Dockerfile is modified**

Run:

```bash
git status
git diff apps/openfit/Dockerfile
```

Expected: `git status` shows exactly one modified file (`apps/openfit/Dockerfile`). `git diff` shows exactly one added line:

```diff
 COPY apps/mobile-app/package.json ./apps/mobile-app/package.json
+COPY apps/openfit/scripts/patch-tanstack-imports.ts ./apps/openfit/scripts/patch-tanstack-imports.ts
 RUN bun install --frozen-lockfile
```

If there are other modified files, stop and investigate before committing.

- [ ] **Step 2: Stage and commit**

Run:

```bash
git add apps/openfit/Dockerfile
git commit -m "fix(docker): copy patch-tanstack-imports.ts before bun install

The openfit workspace declares a postinstall script that runs
bun scripts/patch-tanstack-imports.ts. The Docker builder stage
copies only workspace manifests before bun install to keep the
install layer cache stable, which caused postinstall to fail with
'Module not found scripts/patch-tanstack-imports.ts'.

Copy the single script file (not the whole scripts/ directory) so
the install layer still only invalidates when the patch script
itself changes."
```

Expected: The commit lands successfully. `lefthook` pre-commit hooks may run — let them; do not pass `--no-verify`. If a hook fails, fix the reported issue and re-stage + re-commit (do **not** `--amend`).

- [ ] **Step 3: Confirm the commit**

Run:

```bash
git log -1 --stat
```

Expected: The top commit is the fix commit, showing 1 file changed, 1 insertion(+), 0 deletions(-).

---

## Task 5: Push and verify CI

**Files:**
- None (CI verification)

- [ ] **Step 1: Push the branch**

If working on `main` directly, push to `main`. If working on a feature branch, push and open a PR.

```bash
git push
```

- [ ] **Step 2: Watch the Docker publish workflow**

Run:

```bash
gh run list --workflow "Build and Publish Docker Image" --limit 3
```

Expected: A new run appears for the commit just pushed. Wait for it to finish:

```bash
gh run watch
```

Expected: The run completes with `conclusion: success`. If it fails, view the failed logs:

```bash
gh run view --log-failed
```

and diagnose. The most likely failure mode is a typo in the `COPY` path — re-read Task 2 Step 2.

- [ ] **Step 3: Confirm success**

Run:

```bash
gh run list --workflow "Build and Publish Docker Image" --limit 1 --json conclusion,status
```

Expected: `[{"conclusion":"success","status":"completed"}]`.

---

## Self-Review Notes

**Spec coverage:**
- Spec "Fix" section → Task 2
- Spec "Verification" section → Tasks 1, 3, and 5 (local reproduction, local rebuild, CI confirmation)
- Spec "Out of scope" items (Renovate PR #39, replacing the patch script) → intentionally not covered, tracked separately

**Placeholder scan:** No TBDs, no "add error handling", no "similar to Task N". Every code block is literal content an engineer can paste.

**Type consistency:** N/A — this plan only modifies one Dockerfile line, no type surface.

**Follow-up not in this plan:** A separate spec/plan will replace `patch-tanstack-imports.ts` with a Vitest-config solution, at which point the `COPY` line added here can be reverted alongside deleting the script and the `postinstall` entry.
