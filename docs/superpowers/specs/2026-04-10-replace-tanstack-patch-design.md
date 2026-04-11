# Replace `patch-tanstack-imports.ts` with a Vitest Resolver Plugin

**Date:** 2026-04-10
**Status:** Approved, ready for implementation plan

## Goal

Replace the `apps/openfit/scripts/patch-tanstack-imports.ts` postinstall workaround with a small Vite plugin defined inside `apps/openfit/vitest.config.ts` that resolves the unresolved TanStack Start virtual subpath imports during test runs. After this change, no part of the repository mutates `node_modules`, and no `postinstall` hook is required.

## Background

`@tanstack/start-server-core` (currently `1.166.0` in the lockfile, latest `1.167.11`) ships `dist/esm/createStartHandler.js` with two unresolved dynamic subpath imports:

```js
const routerEntry = await import("#tanstack-router-entry");
const startEntry  = await import("#tanstack-start-entry");
```

The package's `package.json#imports` field only declares one subpath import (`#tanstack-start-server-fn-resolver`), so Node.js subpath resolution rules cannot satisfy these two specifiers. They are intended to be replaced at build time by the TanStack Start Vite plugin (`@tanstack/react-start/plugin/vite`), which is loaded by `apps/openfit/vite.config.ts` for production builds.

In **Vitest browser mode** (`unit-browser` project), the dep optimizer (Rolldown) pre-bundles `@tanstack/start-server-core` as part of its scan phase, encounters these unresolved specifiers, and crashes:

```
error: Could not resolve "#tanstack-router-entry" from "node_modules/.../createStartHandler.js"
```

The current workaround in `apps/openfit/scripts/patch-tanstack-imports.ts` runs as a `postinstall` hook, walks `node_modules` for every hoisted copy of `@tanstack/start-server-core`, and rewrites each `package.json` to add stub `imports` entries pointing at an existing no-op file (`dist/esm/fake-start-server-fn-resolver.js`).

This works but has well-known downsides:

- Mutates `node_modules` (a generated artifact). Reinstalls re-mutate; lockfile changes can re-introduce the old state.
- Required adding `--ignore-scripts` to the Docker build to prevent it firing in an image where it has nothing to fix.
- The script is a moving part with its own complexity (recursive `.bun` directory walk, multi-version handling) that contributes nothing to production code.

The dynamic imports in question live inside the async `createStartHandler` function. The openfit test suite tests components, hooks, and lib utilities — it never invokes the server entry handler — so the unresolved imports never execute at runtime. **The failure is purely at Rolldown's pre-bundle scan phase, not at test execution.**

## Approach

Add a Vite plugin to `apps/openfit/vitest.config.ts` that intercepts the two virtual specifiers via `resolveId` and serves an inline stub module via `load`. Since the plugin lives in the Vitest config, it scopes itself to test runs only — production builds (which use the real TanStack Start Vite plugin via `vite.config.ts`) are entirely unaffected.

This is the same approach the patch script takes (point the virtual specifiers at a stub module), implemented at the Vite plugin layer instead of by mutating `node_modules`.

### The plugin

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
      if (VIRTUAL_IDS.has(id)) return STUB_ID;
    },
    load(id) {
      if (id === STUB_ID) return "export async function getServerFnById() {}";
    },
  };
};
```

Notes:

- **`\0` prefix on the resolved id** is the Vite/Rollup convention for "virtual module not backed by a file on disk". Vite skips its normal disk-resolution pipeline for any id starting with `\0`, which prevents the resolved id from leaking back into Rolldown's filesystem walker.
- **`enforce: "pre"`** runs this plugin's `resolveId` before Vite's built-in resolver tries (and fails) to match the `#`-prefixed specifier as a Node.js subpath import.
- **The exported `getServerFnById` shape** mirrors what `fake-start-server-fn-resolver.js` exports in upstream — a no-op async function. The patch script aliases the same upstream stub file under both names; we inline the equivalent in ~one line of source.
- **Defined inline in `vitest.config.ts`** rather than in a separate plugin file. The plugin is small enough that an extra file would obscure intent more than help. If it grows, splitting is trivial.

### Plugin placement

The plugin must be added to the **`plugins` array of each test project** (`unit-node` and `unit-browser`), not only the top-level `defineConfig` call.

`unit-browser` is the project that actually triggers the failure (Rolldown pre-bundling for browser tests). `unit-node` does not currently exercise the failing code path, but adding the plugin there too is free and prevents future surprises if a node-environment test ever pulls in something that imports `@tanstack/start-server-core`.

The top-level `plugins: [react()]` entry can stay; the new plugin is project-scoped.

## Files changed

| File | Change |
|---|---|
| `apps/openfit/vitest.config.ts` | Define `stubTanstackVirtualEntries` plugin; reference it in both test projects' `plugins` arrays; import `Plugin` type from `vitest/config`. |
| `apps/openfit/package.json` | Remove the `"postinstall": "bun scripts/patch-tanstack-imports.ts"` line from `scripts`. |
| `apps/openfit/scripts/patch-tanstack-imports.ts` | Delete the file. |

No changes to:

- `apps/openfit/vite.config.ts` — production builds load the real TanStack Start Vite plugin, which resolves these virtuals correctly.
- `apps/openfit/Dockerfile` — already uses `--ignore-scripts` for both `bun install` invocations, so removing the postinstall has no effect on Docker.
- The root `package.json`, `bun.lock`, or any test source file.

## Verification

1. **Apply the change** (delete script, remove postinstall, add plugin).
2. **Force a clean reinstall** so `node_modules` is unpatched:
   ```bash
   rm -rf node_modules apps/openfit/node_modules
   bun install --frozen-lockfile
   ```
   The previous `postinstall` is gone, so this leaves `@tanstack/start-server-core/package.json` in its pristine upstream state. Confirm by reading the file's `imports` field — it should contain only `#tanstack-start-server-fn-resolver`, not the two extra entries the patch script used to add.
3. **Run the affected test suites:**
   ```bash
   cd apps/openfit
   bun run test:run
   ```
   Both `unit-node` and `unit-browser` projects must pass with the same results as before. The `unit-browser` project is the load-bearing one — that is where Rolldown's pre-bundle would have crashed without the patch.
4. **Run lint** to make sure the new plugin code passes biome:
   ```bash
   bun run lint
   ```
5. **Push to a feature branch** and let CI confirm the unit/component test job stays green. This is a test-infrastructure change, so a CI run is the real proof.

A failed test at any of these gates indicates the plugin's resolver is not catching the specifiers (for example, the wrong `enforce` setting, or the plugin attached only at the top level instead of inside each project). Diagnose by adding a temporary `console.log` inside `resolveId` to confirm it sees the virtual ids.

## Out of scope

- The Dockerfile — already uses `--ignore-scripts` and is not affected by this change.
- The production `apps/openfit/vite.config.ts` — already loads the TanStack Start Vite plugin, which resolves these specifiers correctly during real builds.
- Filing an upstream issue with TanStack Start. The user has explicitly chosen not to file one as part of this work. If `@tanstack/start-server-core` later starts declaring these subpath imports in its own `package.json#imports`, this plugin becomes a no-op and can be deleted.
- Touching any test source file. This is purely config/script cleanup.
- Refactoring the existing two-project structure of `vitest.config.ts`.
