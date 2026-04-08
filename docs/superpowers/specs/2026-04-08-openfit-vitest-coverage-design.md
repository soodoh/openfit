# OpenFit Vitest Coverage Design

Date: 2026-04-08
Scope: `apps/openfit` only
Status: Approved design

## Goal

Raise Vitest coverage in `apps/openfit` so coverage is measured honestly and enforced at a high standard without relying on misleading partial reports.

## In Scope

- `apps/openfit` only
- Coverage configuration in `apps/openfit/vitest.config.ts`
- Runtime and unit tests needed to raise coverage across:
  - `src/routes/api/**`
  - `src/hooks/**`
  - `src/lib/**`
  - High-value UI flows in `src/components/**` and route screens
- Threshold enforcement through the existing `bun run test:coverage` flow

## Out of Scope

- `apps/docs`
- `apps/mobile-app`
- E2E coverage collection
- Broad refactors unrelated to improving coverage

## Coverage Policy

Coverage will use a hybrid policy.

Package-level thresholds:

- Statements: `>=95%`
- Branches: `>=95%`
- Functions: `>=95%`
- Lines: `>=95%`

File-level thresholds:

- Default floor for non-exempt files: `>=85%`
- Critical logic directories must reach `>=95%`:
  - `src/routes/api/**`
  - `src/hooks/**`
  - `src/lib/**`

The default rule is to test code rather than exclude it. Any exclusion beyond the agreed list requires explicit justification.

## Inclusion And Exclusion Rules

Coverage should count essentially all application code in `apps/openfit/src/**/*.{ts,tsx}`.

Initial exclusions:

- `db/schema/**`
- Generated files:
  - `src/routeTree.gen.ts`

All other application code remains in scope, including:

- route modules
- query and mutation hooks
- provider wrappers
- app bootstrapping files
- UI components

## Current Baseline

Measured on 2026-04-07 via `bun run test:coverage`:

- Statements: `62.97%`
- Branches: `51.5%`
- Functions: `51.53%`
- Lines: `63.72%`

Known measurement issue:

- Current Vitest coverage does not count the full source tree honestly because coverage is not configured to include all source files.
- Only a small subset of `src` currently appears in the coverage report.
- Hooks and many route/component files are effectively invisible to runtime coverage today.

## Architecture

The work is split into two layers.

### 1. Coverage Measurement

`apps/openfit/vitest.config.ts` becomes the source of truth for:

- which files are included in coverage
- which files are excluded
- package thresholds
- file-level thresholds where supported by the tooling setup

The measurement layer must be corrected first so every later test addition moves a trustworthy baseline.

### 2. Coverage Remediation

Once measurement is honest, test work proceeds in prioritized waves instead of an undifferentiated sweep.

Wave order:

1. `src/routes/api/**`
2. `src/hooks/**` and remaining `src/lib/**`
3. High-value UI flows in sessions, routines, workout-set, and related route screens
4. Remaining wrappers and utility UI needed to close the final gaps

## Test Strategy

### API Routes

Route tests should focus on decision paths, not only happy paths.

Each route suite should intentionally cover:

- success paths
- validation failures
- auth and authorization failures where applicable
- not-found behavior
- mutation side effects
- branch-specific response shapes

### Hooks

Hooks need runtime coverage, not just type-level assertions.

Query-hook tests should validate:

- query key selection
- enabled and disabled behavior
- argument shaping
- response mapping

Mutation-hook tests should validate:

- request payload formation
- cache invalidation or refresh behavior
- success handling
- error propagation

The existing type-contract tests remain useful, but they are supplemental and do not replace runtime tests.

### Library Code

`src/lib/**` should continue using focused unit tests, preferably table-driven where that improves branch coverage efficiently.

Priority goes to helpers that influence route behavior, request validation, loaders, serialization, and shared API behavior.

### UI Components

UI tests should target observable behavior and state transitions rather than implementation details.

Highest-value component areas:

- `components/sessions/**`
- `components/routines/**`
- `components/workoutSet/**`
- `components/admin/**` where forms and branching behavior are substantial

Thin wrappers should only receive direct tests when required to satisfy the file-level floor or to protect meaningful behavior.

## Execution Waves

### Wave 1: Honest Coverage Setup

- Enable full source coverage accounting
- Apply the agreed inclusion and exclusion list
- Add threshold enforcement
- Regenerate the baseline report

Deliverable:

- a trustworthy coverage report showing the real gap

### Wave 2: Critical Server Logic

- Expand coverage for `src/routes/api/**`
- Close remaining gaps in `src/lib/**`
- Add runtime hook coverage for query and mutation hooks

Deliverable:

- critical logic directories at or near the `95%` target

### Wave 3: High-Value UI Flows

- Sessions screens and supporting components
- Routines flows and supporting components
- Workout set editing and session interaction components

Deliverable:

- major user workflows heavily covered with behavior-focused tests

### Wave 4: Final Gap Closure

- Provider wrappers
- route screens not yet covered
- low-level UI components and remaining file-floor gaps

Deliverable:

- package and file-level thresholds satisfied

## Risk Management

The largest risk is that correcting coverage accounting exposes a much larger gap than the current report suggests. That is acceptable and expected.

Controls:

- run coverage after each wave
- update the gap list after each wave
- only add new exclusions by explicit decision
- prefer testing over exemptions when the file contains business logic or branching behavior

If an isolated low-value wrapper remains below the floor late in the effort, decide explicitly whether:

- a small focused test is justified, or
- a narrow exemption is warranted

The default choice remains to add the test.

## Completion Criteria

This effort is complete when all of the following are true:

- `apps/openfit` coverage counts the intended source tree honestly
- `db/schema/**` is excluded
- generated files are excluded, starting with `src/routeTree.gen.ts`
- package totals reach `>=95%` for statements, branches, functions, and lines
- non-exempt files meet the `>=85%` floor
- `src/routes/api/**`, `src/hooks/**`, and `src/lib/**` reach `>=95%`
- the result is reproducible through `bun run test:coverage`

## Recommended Implementation Order

1. Fix coverage accounting in `vitest.config.ts`
2. Re-run coverage and produce the new baseline
3. Cover API route handlers
4. Add runtime tests for hooks
5. Raise remaining `src/lib/**` gaps
6. Cover high-value session, routine, and workout-set UI
7. Close remaining file-floor gaps

## Notes

- This design intentionally avoids broad product refactors.
- The goal is trustworthy coverage and meaningful regression protection, not cosmetic percentage inflation.
