# Docker Publish Fix: Postinstall Script Missing in Builder Stage

**Date:** 2026-04-10
**Status:** Approved, ready for implementation plan

## Problem

The `Build and Publish Docker Image` workflow fails on `main` during the builder stage:

```
error: Module not found "scripts/patch-tanstack-imports.ts"
error: postinstall script from "openfit" exited with 1
ERROR: process "/bin/sh -c bun install --frozen-lockfile" did not complete successfully: exit code: 1
```

Failing run: <https://github.com/soodoh/openfit/actions/runs/24234707749>

## Root Cause

`apps/openfit/package.json` declares:

```json
"postinstall": "bun scripts/patch-tanstack-imports.ts"
```

The script was added in commit `df27f75` (vitest browser mode migration) to patch `@tanstack/start-server-core/package.json#imports` with stub entries that Vitest's dep optimizer (Rolldown) needs to resolve `#tanstack-router-entry` and `#tanstack-start-entry` virtual imports during test pre-bundling.

The Docker builder stage intentionally copies only workspace manifests before `bun install --frozen-lockfile` so the install layer stays cached across source changes:

```dockerfile
COPY package.json bun.lock turbo.json ./
COPY apps/openfit/package.json ./apps/openfit/package.json
COPY apps/docs/package.json ./apps/docs/package.json
COPY apps/mobile-app/package.json ./apps/mobile-app/package.json
RUN bun install --frozen-lockfile
```

Bun runs `postinstall` during that install, but `apps/openfit/scripts/patch-tanstack-imports.ts` hasn't been copied into the image yet, so the script crashes and `bun install` exits 1.

## Scope

**In scope**

- Restore the Docker publish workflow on `main`.

**Out of scope**

- Renovate PR #39 CI failures (`@tanstack/react-start-rsc@0.0.2` resolve error). Renovate rebuilds its own branches, so we ignore these and focus on failures from `main` pushes.
- Replacing the `patch-tanstack-imports.ts` postinstall workaround with a Vitest-config solution. Tracked as a separate follow-up spec (see below).

## Fix

Add one line to `apps/openfit/Dockerfile` before `RUN bun install --frozen-lockfile`:

```dockerfile
COPY apps/openfit/scripts/patch-tanstack-imports.ts ./apps/openfit/scripts/patch-tanstack-imports.ts
```

### Rationale for approach

Copying only the single script file (rather than the entire `apps/openfit/scripts/` directory) preserves the install layer's cache behavior: the layer only invalidates when the patch script itself changes, which is rare. Copying the whole `scripts/` directory would tie the install layer to every unrelated script edit (`dev-init.sh`, `docker-entrypoint.sh`, coverage scripts, etc.).

### Alternatives considered

**B. `bun install --frozen-lockfile --ignore-scripts`, then run the patch after `COPY . .`.**
More explicit about ordering but requires two commands and adds a second `bun` invocation to the image. Rejected for being heavier than needed.

**C. Move the patch from `postinstall` to `build`.**
Fixes Docker by removing the hazard entirely but changes behavior for every consumer (CI, local dev, editor setup). Rejected as too broad for a CI unblock.

## Verification

1. Build the image locally from repo root:
   ```bash
   docker build -f apps/openfit/Dockerfile .
   ```
2. Confirm the builder stage completes past `RUN bun install --frozen-lockfile` with the patch script output present.
3. Push the fix to a branch, open a PR, and confirm the `Build and Publish Docker Image` workflow succeeds on the PR.

No unit or integration tests are needed — this is a Dockerfile-only change.

## Follow-up (separate spec)

Create `docs/superpowers/specs/YYYY-MM-DD-replace-tanstack-patch-script-design.md` to eliminate the `patch-tanstack-imports.ts` workaround entirely. Approach:

1. **First try** configuring Vitest to skip pre-bundling `@tanstack/start-server-core` via `deps.optimizer.exclude` (or `server.deps.inline` / noExternal). If the TanStack Start Vite plugin resolves the virtual imports during tests, the patch becomes unnecessary.
2. **If pre-bundling is still required,** add a custom `resolveId` plugin in `vitest.config.ts` that intercepts `#tanstack-router-entry` and `#tanstack-start-entry` and returns the stub path. Config-level, no `node_modules` mutation.
3. **File an upstream issue** with TanStack Start documenting the Vitest browser mode friction, so a proper fix lands in the package.

Once the replacement is proven, delete `apps/openfit/scripts/patch-tanstack-imports.ts`, remove the `postinstall` entry from `apps/openfit/package.json`, and revert the Dockerfile `COPY` line added by this spec.

This follow-up is independent and can land any time after the Docker fix ships.
