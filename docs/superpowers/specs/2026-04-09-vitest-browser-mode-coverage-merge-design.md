# Vitest Browser Mode Migration + Unified Coverage Merge

## Overview

Migrate all component/hook tests from React Testing Library (RTL) + jsdom to Vitest browser mode with Playwright, and unify coverage reporting across unit, component, and E2E tests using monocart-coverage-reports.

### Goals

1. **One rendering engine**: Replace jsdom + RTL with real Chromium via Vitest browser mode + Playwright provider
2. **Higher confidence**: Component tests run in a real browser, matching production behavior
3. **Unified coverage**: Merge coverage from unit tests, component tests, and Playwright E2E tests into a single report
4. **Dual thresholds**: Unit/component tests enforce a baseline independently; merged coverage enforces a stricter bar
5. **Flexible execution**: Fast local runs (unit/component only) and comprehensive CI runs (everything merged)

### Non-Goals

- Rewriting E2E tests or changing the Playwright page object model pattern
- Changing the test file organization or naming conventions
- Adding new test coverage for uncovered code (that's separate work)

---

## Architecture

### Vitest Project Structure

Replace the current single `vitest.config.ts` with a `vitest.config.ts` using the `projects` array to define two test projects:

**`unit-node` project** — pure logic tests (no DOM):
- Environment: `node` (default, fast)
- Include patterns: `src/lib/**/*.test.ts` (utils, serializers, pure functions)
- Exclude: any `.test.tsx` files (those need browser rendering)

**`unit-browser` project** — component and hook tests:
- Environment: `browser` with Playwright provider (Chromium)
- Include patterns: `src/components/**/*.test.{ts,tsx}`, `src/hooks/**/*.test.{ts,tsx}`, `src/routes/**/*.test.{ts,tsx}`, `src/*.test.{ts,tsx}`
- Uses `@vitejs/plugin-react` for JSX compilation
- Setup file: updated `vitest.setup.ts` (browser-compatible, no jest-dom import)

**Shared config**:
- `resolve.tsconfigPaths: true` (alias imports like `@/...`)
- Coverage exclusions: `src/**/*.test.{ts,tsx}`, `src/routeTree.gen.ts`, `src/hooks.ts`, `src/lib/api-types.ts`, `db/schema/**`

### Config Example

```typescript
// apps/openfit/vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    projects: [
      {
        test: {
          name: 'unit-node',
          environment: 'node',
          include: ['src/lib/**/*.test.ts'],
          exclude: ['node_modules', '.output', 'src/lib/**/*.test.tsx'],
        },
      },
      {
        test: {
          name: 'unit-browser',
          include: [
            'src/*.test.{ts,tsx}',
            'src/components/**/*.test.{ts,tsx}',
            'src/hooks/**/*.test.{ts,tsx}',
            'src/routes/**/*.test.{ts,tsx}',
          ],
          exclude: ['node_modules', '.output'],
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
```

Coverage is configured at the top-level `test` block and applies to both projects via `vitest-monocart-coverage`. Each project's raw output goes to a separate directory using monocart's `reportPath` option. See Coverage Pipeline section for details.

---

## Component Test Migration

### API Mapping

All 120+ component/hook test files must be updated. The key import and API changes:

| Current (RTL + jsdom) | New (Vitest Browser Mode) |
|---|---|
| `import { render, screen } from '@testing-library/react'` | `import { render } from 'vitest-browser-react'` |
| `import { fireEvent, waitFor } from '@testing-library/react'` | Interactions via locator methods (async) |
| `import userEvent from '@testing-library/user-event'` | `import { userEvent } from '@vitest/browser/context'` |
| `import { renderHook, act } from '@testing-library/react'` | `import { renderHook } from 'vitest-browser-react'` |
| `screen.getByTestId('x')` | `screen.getByTestId('x')` (from render return) |
| `screen.getByRole('button')` | `screen.getByRole('button')` (from render return) |
| `fireEvent.click(element)` | `await element.click()` or `await userEvent.click(element)` |
| `expect(el).toBeInTheDocument()` | `await expect.element(el).toBeInTheDocument()` |
| `expect(el).toHaveClass('foo')` | `await expect.element(el).toHaveClass('foo')` |
| `expect(el).toHaveStyle({...})` | `await expect.element(el).toHaveAttribute('style', ...)` |
| `expect(el).toHaveTextContent('x')` | `await expect.element(el).toHaveTextContent('x')` |
| `waitFor(() => expect(...))` | `await expect.element(...).toBeVisible()` (built-in retry) |
| `container.querySelector('.foo')` | `screen.getByRole(...)` or `page.getByX(...)` locators |

### Key Migration Notes

1. **All interactions are async**: Every `click`, `fill`, `type` must be `await`ed
2. **`expect.element()` for DOM assertions**: Provides built-in retry logic, replaces `waitFor` pattern
3. **No `screen` global**: Destructure from `render()` return or use `page` from `@vitest/browser/context`
4. **`container.querySelector` elimination**: Replace with Playwright-style locators wherever possible
5. **`renderHook` still available**: `vitest-browser-react` exports `renderHook` with similar API
6. **`act()` less needed**: Browser mode handles microtask flushing more naturally

### Test Utilities

- `src/test/query-client.tsx`: `createTestQueryWrapper` stays mostly the same. May need minor type adjustments for the new `renderHook` signature.
- `src/test/fetch.ts`: No changes needed — `vi.stubGlobal("fetch", ...)` works the same in browser mode.
- `vitest.setup.ts`: Remove `@testing-library/jest-dom/vitest` import. Remove the `coverage/.tmp` keepalive hack (monocart handles coverage directory management). The browser project may need its own setup file if browser-specific globals or polyfills are required; this will be determined when the first batch of tests is migrated.

### Pure Logic Tests (No Changes)

Tests in the `unit-node` project (e.g., `src/lib/utils.test.ts`) require zero changes. They don't import RTL and run in Node as before.

---

## Coverage Pipeline

### Three Sources, One Merged Report

```
Unit (Node)              Unit (Browser)           E2E (Playwright)
    |                        |                         |
    v                        v                         v
coverage/                coverage/                coverage/
  unit-node/raw            unit-browser/raw          e2e/raw
    |                        |                         |
    +------------------------+-------------------------+
                             |
                       monocart merge
                      (scripts/merge-coverage.ts)
                             |
                             v
                      coverage/merged/
                (html, text, json-summary)
```

### Vitest Coverage (Unit + Component)

Both Vitest projects use `vitest-monocart-coverage` as their coverage provider, replacing `@vitest/coverage-v8`:

- `unit-node` outputs raw V8 data to `coverage/unit-node/raw`
- `unit-browser` outputs raw V8 data to `coverage/unit-browser/raw`

### Playwright E2E Coverage

Add `monocart-reporter` to `playwright.config.ts` as an additional reporter:

- Collects V8 coverage via Chromium's CDP `page.coverage.startJSCoverage()` API
- Outputs raw V8 data to `coverage/e2e/raw`
- Only the Chromium project collects coverage (other browser projects run for correctness only)
- Coverage collection is gated by the `COLLECT_COVERAGE` environment variable. `monocart-reporter` is always present in `playwright.config.ts` but checks `process.env.COLLECT_COVERAGE` to decide whether to activate V8 coverage collection. Plain `test:e2e` runs skip coverage; `test:coverage` sets the env var.

### Merge Script

`apps/openfit/scripts/merge-coverage.ts`:

```typescript
import { CoverageReport } from 'monocart-coverage-reports'

const inputDir = [
  './coverage/unit-node/raw',
  './coverage/unit-browser/raw',
  './coverage/e2e/raw',
]

const coverageOptions = {
  name: 'OpenFit Merged Coverage',
  inputDir,
  outputDir: './coverage/merged',

  entryFilter: {
    '**/node_modules/**': false,
    '**/*': true,
  },
  sourceFilter: {
    '**/node_modules/**': false,
    '**/src/**': true,
  },

  sourcePath: (filePath: string, info: any) => {
    // Normalize paths between Vitest and Playwright environments.
    // Vitest sees source paths relative to the project root (e.g., src/lib/utils.ts).
    // Playwright sees bundled paths from the dev server (e.g., /src/lib/utils.ts or
    // /@fs/absolute/path/src/lib/utils.ts). This callback strips prefixes to unify
    // them. The exact transformations will be validated during implementation by
    // comparing raw coverage output from both sources.
    return filePath
  },

  reports: [
    ['v8'],
    ['console-details'],
    ['json-summary', { file: 'coverage-summary.json' }],
  ],
}

await new CoverageReport(coverageOptions).generate()
```

### Unit-Only Coverage Report

When running just unit/component tests with coverage, a separate merge of only `unit-node/raw` + `unit-browser/raw` outputs to `coverage/unit/` for threshold checking.

---

## Commands & Thresholds

### Package Scripts

```json
{
  "test:run": "vitest run",
  "test:coverage:unit": "vitest run --coverage && bun scripts/merge-coverage.ts --mode unit && bun scripts/check-coverage.ts --mode unit",
  "test:e2e": "playwright test",
  "test:coverage": "vitest run --coverage && COLLECT_COVERAGE=true playwright test --project=setup --project=chromium && bun scripts/merge-coverage.ts --mode merged && bun scripts/check-coverage.ts --mode merged"
}
```

The `COLLECT_COVERAGE=true` env var gates monocart-reporter's V8 coverage collection. Plain `test:e2e` runs without it, so coverage collection adds no overhead to regular E2E runs. The `--project=setup` flag ensures the auth setup project runs before Chromium tests (required for authenticated E2E flows).

### Threshold Tiers

**Unit-only** (`check-coverage.ts --mode unit`):
- All source files: 80% statements, branches, functions, lines
- High-risk files (`src/routes/api/**`, `src/hooks/**`, `src/lib/**`): 85%

**Merged** (`check-coverage.ts --mode merged`):
- All source files: 95% statements, branches, functions, lines
- Uniform — no per-tier distinction needed at the merged level

### Updated `check-coverage.ts`

The existing script is updated to accept a `--mode` flag:
- `--mode unit`: reads from `coverage/unit/coverage-summary.json`, enforces 80%/85% tiers
- `--mode merged`: reads from `coverage/merged/coverage-summary.json`, enforces 95% flat

### Workflows

**Local development**:
- `bun run test:run` — fast, no coverage, just pass/fail
- `bun run test:coverage:unit` — quick coverage gate before pushing

**CI pipeline**:
1. `bun run test:coverage:unit` — fast gate, fails early
2. `bun run test:e2e` with coverage — slower, can run in parallel with step 1 or after
3. Merge + `check-coverage.ts --mode merged` — final quality gate

---

## Dependency Changes

### Add

| Package | Purpose |
|---|---|
| `@vitest/browser` | Vitest browser mode core |
| `@vitest/browser-playwright` | Playwright provider for Vitest browser mode |
| `vitest-browser-react` | React component rendering in browser mode |
| `vitest-monocart-coverage` | Coverage provider replacing @vitest/coverage-v8 |
| `monocart-coverage-reports` | Merge engine + report generation |
| `monocart-reporter` | Playwright reporter for E2E coverage collection |

### Remove

| Package | Reason |
|---|---|
| `@testing-library/react` | Replaced by `vitest-browser-react` |
| `@testing-library/dom` | No longer needed |
| `@testing-library/jest-dom` | Assertions replaced by Playwright-compatible matchers |
| `@vitest/coverage-v8` | Replaced by `vitest-monocart-coverage` |
| `jsdom` | Replaced by real Chromium browser |

### Keep

- `vitest` (test runner)
- `@playwright/test` (E2E tests + browser provider)
- `@vitejs/plugin-react` (JSX compilation)
- All other existing dependencies

---

## Migration Strategy

The migration should proceed in phases to avoid a single massive PR:

1. **Infrastructure**: Set up Vitest project config with node + browser projects, install new deps (`@vitest/browser`, `vitest-browser-react`, `@vitest/browser-playwright`, monocart packages), update setup files. Keep old deps (RTL, jsdom) temporarily so existing tests still run.
2. **Coverage pipeline**: Configure `vitest-monocart-coverage` for both Vitest projects, add `monocart-reporter` to Playwright config, write `merge-coverage.ts`, update `check-coverage.ts` with `--mode` flag.
3. **Test migration**: Convert test files from RTL to Vitest browser mode APIs, batched by feature area (e.g., ui components first, then hooks, then routes). Each batch should be a separate commit or PR.
4. **Cleanup**: Remove `@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`, `@vitest/coverage-v8`, `jsdom`. Verify all tests pass. Verify both coverage threshold tiers.

### Risk Mitigation

- **Gradual migration**: Tests can coexist during migration. Convert one feature area at a time.
- **monocart single-maintainer risk**: monocart outputs standard Istanbul-format JSON. If the project becomes unmaintained, the merge step can be replaced with istanbul-lib-coverage without changing the rest of the pipeline.
- **Chromium-only coverage for E2E**: This is a non-issue — coverage is a metric, not a cross-browser concern. E2E tests still run on all configured browsers for correctness.

---

## Testing the Migration

- All existing tests pass in the new setup (different rendering engine, same assertions)
- Coverage numbers should be comparable or higher than current (real browser may cover slightly different paths than jsdom)
- `bun run test:run` still works fast for local dev
- `bun run test:coverage:unit` passes with 80%/85% thresholds
- `bun run test:coverage` passes with 95% merged threshold
- CI pipeline runs both tiers successfully
