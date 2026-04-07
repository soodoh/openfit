# Architecture Cleanup Design

## Goal

Systematically reduce architectural drift in the OpenFit app without destabilizing current behavior.

The cleanup targets four specific problems already identified in the codebase:

1. API transport shapes are mixed with DB-derived types.
2. Query and mutation hooks duplicate request and response contracts.
3. API routes repeat auth, ownership, fetch, and serialization logic.
4. A small number of UI components act as large stateful controllers instead of focused views.

This work is not a product feature. It is a boundary-cleanup effort intended to make future feature work safer, easier to review, and less likely to reintroduce type drift.

## Non-Goals

- No schema redesign.
- No behavior changes to existing user flows unless required to fix a concrete bug.
- No repo-wide rewrite of every route or component in one pass.
- No speculative abstractions for domains not currently showing drift.

## Design Principles

- Refactor in small vertical slices with a clean verification boundary after each slice.
- Separate DB entities from API DTOs instead of stretching one type across storage, transport, and UI.
- Prefer a small number of boring shared helpers over broad generic abstractions.
- Keep serialization logic close to the server boundary.
- Move large component state machines into focused hooks/helpers before splitting visual subcomponents.

## Proposed Approach

### Phase 1: Explicit API DTO Layer

Introduce explicit transport-facing DTOs for the first target domain instead of reusing DB-derived types with added optional fields.

Expected outcome:

- Shared API response types clearly model serialized data.
- Cursor-paginated list responses use a dedicated type separate from admin page-number pagination.
- Mutation result types become explicit instead of `unknown`.

Planned structure:

- Keep existing DB schema types as storage/domain types.
- Add dedicated API DTO types in `src/lib/types.ts` or a nearby focused `src/lib/api-types.ts`.
- Distinguish at least:
  - admin page pagination
  - cursor pagination
  - domain DTOs returned by routes
  - mutation result DTOs such as `{ success: true }` or `{ id: string }`

Recommendation:

- Prefer a new `api-types.ts` if `types.ts` becomes harder to scan.
- Keep `types.ts` only if the resulting boundaries remain obvious.

### Phase 2: First Vertical Slice Through Routines

Use the routines domain as the first end-to-end migration target because it touches list queries, detail queries, mutations, nested relations, and route serialization.

Scope:

- `src/routes/api/routines.ts`
- `src/routes/api/routines.$id.ts`
- `src/routes/api/routine-days.ts`
- `src/routes/api/routine-days.$id.ts`
- related query and mutation hooks
- shared types used by routines UI

Expected outcome:

- Routines and routine days stop returning ad hoc reshaped objects.
- Hooks consume shared DTOs rather than redefining local response types.
- Pagination and mutation responses are standardized for this slice.

Why routines first:

- It exercises the main patterns that are also repeated in gyms and sessions.
- It is large enough to prove the architecture, but bounded enough to keep review manageable.

### Phase 3: Server Resource Helpers

After the DTO pattern is proven in routines, extract small server-side helpers for repeated route behavior.

Target helper categories:

- auth-and-ownership lookup helpers
- server-side serializers
- repeated success response helpers where useful

Examples of what should move into helpers:

- load resource by id and verify `userId`
- serialize `routineDay.weekdays` from relation rows to plain numbers
- serialize `gym.equipment` relation rows to `equipmentIds`

Constraints:

- Helpers must stay domain-aware where that improves readability.
- Avoid a single generic “resource framework”.
- Prefer simple per-domain serializers and narrow ownership helpers.

### Phase 4: UI State Extraction

Refactor the two highest-complexity controller-style components after the contracts beneath them are stable.

Initial targets:

- `src/components/profile/profile-modal.tsx`
- `src/components/admin/exercise-form-modal.tsx`

Expected outcome:

- Submission logic, reset logic, and derived state move into focused hooks or form-model helpers.
- Modal components become mostly rendering and event wiring.
- Blob URL lifecycle in exercise image previews is cleaned up explicitly.

Recommended shape:

- `useProfileSettingsForm`
- `useGymFormState`
- `useExerciseFormState`
- `useExerciseImageQueue`

Exact naming can change, but each extracted unit should have one job.

## Alternatives Considered

### Alternative A: Server-First Consolidation

Create route helpers first, then fix types after.

Pros:

- Fastest cleanup on the backend.

Cons:

- Does not stop client-side drift.
- Risks building helpers around unstable transport contracts.

Decision:

- Rejected as the first step.

### Alternative B: UI-First Refactor

Split heavy components before contract cleanup.

Pros:

- Makes the largest files smaller quickly.

Cons:

- UI abstractions would still be built on unstable API shapes.
- Likely to require rework once DTOs are introduced.

Decision:

- Rejected as the first step.

## Execution Plan

This design will be implemented as separate commits:

1. Add shared DTO and pagination contracts.
2. Migrate routines and routine-days to those contracts end-to-end.
3. Extract narrow server helpers and apply them to routines, then gyms.
4. Replace remaining `fetchJson<unknown>` mutation contracts for affected domains.
5. Extract state logic from `profile-modal`.
6. Extract state logic from `exercise-form-modal` and fix blob URL cleanup.

Each step should leave the repo green on:

- `bunx tsc --noEmit -p apps/openfit/tsconfig.json`
- `bun run lint`
- `bun run test:run`
- `bun run build`

## Risks

### Risk: Contract Churn

Changing shared DTOs can ripple through many hooks and components.

Mitigation:

- Limit the first pass to one vertical slice.
- Keep DTO names explicit and stable.

### Risk: Over-Abstraction

Generic route helpers can hide domain behavior instead of clarifying it.

Mitigation:

- Use small, narrow helpers.
- Keep domain-specific serializers separate when their logic differs.

### Risk: Hidden UI Behavior Regressions

Controller-style components may encode subtle reset and modal-close behavior.

Mitigation:

- Extract logic without changing interaction flow in the same commit.
- Add or extend tests where the component currently has meaningful behavior.

## Testing Strategy

- Keep each phase independently verifiable.
- Add focused tests where shared serialization or state extraction introduces meaningful logic.
- Prefer regression tests for:
  - routine and routine-day serialization
  - mutation result contracts
  - exercise image preview cleanup if implemented through hook logic

## Success Criteria

The work is successful when:

- DB entity types and API DTOs are clearly separated in the refactored slice.
- Query and mutation hooks stop redefining local transport contracts for the refactored slice.
- Repeated route ownership and serialization logic is materially reduced.
- `profile-modal` and `exercise-form-modal` no longer contain multi-concern controller logic in one file.
- The repo remains green after every slice.
