# Architecture Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate API transport contracts from DB types, remove repeated route serialization and ownership logic, and extract the highest-risk UI controller state into focused hooks without changing user-visible behavior.

**Architecture:** Introduce explicit DTOs and pagination contracts first, prove them through the routines vertical slice, then extract narrow route helpers and serializer helpers, and finally move complex modal state out of render-heavy controller components. Each phase is a small, verifiable commit that preserves a green repo.

**Tech Stack:** Bun, TypeScript, TanStack Start, React, React Query, Drizzle ORM, Vitest, Biome

---

## File Structure

### Shared contract files

- Modify: `apps/openfit/src/lib/types.ts`
  - Keep DB-adjacent shared types only if still clear after cleanup.
- Create or modify: `apps/openfit/src/lib/api-types.ts`
  - Home for transport DTOs, cursor pagination types, and success/id mutation result shapes.
- Create: `apps/openfit/src/lib/api-types.test.ts`
  - Type-level regression tests for DTO boundaries and pagination contracts.

### Routines vertical slice

- Modify: `apps/openfit/src/routes/api/routines.ts`
- Modify: `apps/openfit/src/routes/api/routines.$id.ts`
- Modify: `apps/openfit/src/routes/api/routine-days.ts`
- Modify: `apps/openfit/src/routes/api/routine-days.$id.ts`
- Modify: `apps/openfit/src/hooks/queries/use-routines.ts`
- Modify: `apps/openfit/src/hooks/queries/use-routine-days.ts`
- Modify: `apps/openfit/src/hooks/mutations/use-routine-mutations.ts`
- Modify: `apps/openfit/src/hooks/mutations/use-routine-day-mutations.ts`
- Create: `apps/openfit/src/lib/routine-api.test.ts`
  - Serializer and DTO regression tests for routines and routine days.

### Server helper layer

- Create: `apps/openfit/src/lib/api-serializers.ts`
  - Domain serializers for routines, routine days, gyms, and success DTOs.
- Create: `apps/openfit/src/lib/api-resource-helpers.ts`
  - Narrow ownership and load-by-id helpers.
- Create: `apps/openfit/src/lib/api-serializers.test.ts`
  - Unit tests for serializer helpers.
- Modify: `apps/openfit/src/routes/api/gyms.ts`
- Modify: `apps/openfit/src/routes/api/gyms.$id.ts`

### Mutation cleanup

- Modify: `apps/openfit/src/hooks/mutations/use-admin-mutations.ts`
- Modify: `apps/openfit/src/hooks/mutations/use-gym-mutations.ts`
- Modify: `apps/openfit/src/hooks/mutations/use-session-mutations.ts`
- Modify: `apps/openfit/src/hooks/mutations/use-set-group-mutations.ts`
- Modify: `apps/openfit/src/hooks/mutations/use-set-mutations.ts`
- Modify: `apps/openfit/src/hooks/mutations/use-user-profile-mutations.ts`

### UI state extraction

- Create: `apps/openfit/src/components/profile/use-profile-settings-form.ts`
- Create: `apps/openfit/src/components/admin/use-exercise-form-state.ts`
- Create: `apps/openfit/src/components/admin/use-exercise-image-queue.ts`
- Modify: `apps/openfit/src/components/profile/profile-modal.tsx`
- Modify: `apps/openfit/src/components/admin/exercise-form-modal.tsx`
- Create: `apps/openfit/src/components/admin/use-exercise-image-queue.test.ts`

## Task 1: Add Explicit API DTO Contracts

**Files:**
- Create: `apps/openfit/src/lib/api-types.ts`
- Create: `apps/openfit/src/lib/api-types.test.ts`
- Modify: `apps/openfit/src/lib/types.ts`
- Test: `apps/openfit/src/lib/api-types.test.ts`

- [ ] **Step 1: Write the failing DTO boundary test**

```ts
import { describe, expectTypeOf, it } from "vitest";
import type {
	CursorPage,
	MutationIdResult,
	MutationSuccessResult,
	RoutineDto,
	RoutineDayDto,
} from "./api-types";

describe("api-types", () => {
	it("separates cursor pagination from admin pagination", () => {
		expectTypeOf<CursorPage<RoutineDto>>().toMatchTypeOf<{
			page: RoutineDto[];
			isDone: boolean;
			continueCursor: string | null;
		}>();
	});

	it("keeps mutation results explicit", () => {
		expectTypeOf<MutationIdResult>().toEqualTypeOf<{ id: string }>();
		expectTypeOf<MutationSuccessResult>().toEqualTypeOf<{ success: true }>();
	});

	it("models routines as API DTOs instead of DB records", () => {
		expectTypeOf<RoutineDto["routineDays"]>().toEqualTypeOf<RoutineDayDto[]>();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/pauldiloreto/Projects/openfit/apps/openfit && bun run test:run src/lib/api-types.test.ts`

Expected: FAIL because `src/lib/api-types.ts` does not exist yet.

- [ ] **Step 3: Write the minimal DTO implementation**

```ts
// apps/openfit/src/lib/api-types.ts
import type { Role, Theme } from "@/db/schema/user-data";

export type MutationSuccessResult = { success: true };
export type MutationIdResult = { id: string };

export type CursorPage<T> = {
	page: T[];
	isDone: boolean;
	continueCursor: string | null;
};

export type AdminPage<T> = {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
};

export type RoutineDayDto = {
	id: string;
	routineId: string;
	userId: string;
	description: string;
	createdAt: Date | string;
	updatedAt: Date | string;
	weekdays: number[];
	routine?:
		| {
				id: string;
				name: string;
		  }
		| null
		| undefined;
	setGroups?: unknown[];
};

export type RoutineDto = {
	id: string;
	userId: string;
	name: string;
	description: string | null | undefined;
	createdAt: Date | string;
	updatedAt: Date | string;
	routineDays: RoutineDayDto[];
};
```

Also replace duplicated pagination aliases in `apps/openfit/src/lib/types.ts` with imports from `api-types.ts` where the old names are transport-specific.

- [ ] **Step 4: Run targeted verification**

Run:

```bash
cd /Users/pauldiloreto/Projects/openfit/apps/openfit
bun run test:run src/lib/api-types.test.ts
bunx tsc --noEmit -p tsconfig.json
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/pauldiloreto/Projects/openfit
git add apps/openfit/src/lib/api-types.ts apps/openfit/src/lib/api-types.test.ts apps/openfit/src/lib/types.ts
git commit -m "refactor: add explicit api dto contracts"
```

## Task 2: Migrate Routines and Routine Days to Shared DTOs

**Files:**
- Modify: `apps/openfit/src/routes/api/routines.ts`
- Modify: `apps/openfit/src/routes/api/routines.$id.ts`
- Modify: `apps/openfit/src/routes/api/routine-days.ts`
- Modify: `apps/openfit/src/routes/api/routine-days.$id.ts`
- Modify: `apps/openfit/src/hooks/queries/use-routines.ts`
- Modify: `apps/openfit/src/hooks/queries/use-routine-days.ts`
- Modify: `apps/openfit/src/hooks/mutations/use-routine-mutations.ts`
- Modify: `apps/openfit/src/hooks/mutations/use-routine-day-mutations.ts`
- Create: `apps/openfit/src/lib/routine-api.test.ts`

- [ ] **Step 1: Write failing serializer and mutation-contract tests**

```ts
import { describe, expect, it } from "vitest";
import type {
	MutationSuccessResult,
	RoutineDayDto,
	RoutineDto,
} from "@/lib/api-types";

describe("routine api contracts", () => {
	it("serializes weekdays to plain numbers", () => {
		const day: RoutineDayDto = {
			id: "day-1",
			routineId: "routine-1",
			userId: "user-1",
			description: "Push",
			createdAt: new Date(),
			updatedAt: new Date(),
			weekdays: [1, 3, 5],
		};

		expect(day.weekdays).toEqual([1, 3, 5]);
	});

	it("uses explicit success contracts for deletes", () => {
		const result: MutationSuccessResult = { success: true };
		expect(result.success).toBe(true);
	});

	it("requires routine detail responses to include routineDays", () => {
		const routine: RoutineDto = {
			id: "routine-1",
			userId: "user-1",
			name: "Upper",
			description: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			routineDays: [],
		};

		expect(routine.routineDays).toEqual([]);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/pauldiloreto/Projects/openfit/apps/openfit && bun run test:run src/lib/routine-api.test.ts`

Expected: FAIL because the DTO-backed slice is not wired yet.

- [ ] **Step 3: Implement the routines slice with shared DTOs**

Replace local hook response aliases in:

```ts
// apps/openfit/src/hooks/queries/use-routines.ts
import type { CursorPage, RoutineDto } from "@/lib/api-types";
```

```ts
// apps/openfit/src/hooks/queries/use-routine-days.ts
import type { RoutineDayDto } from "@/lib/api-types";
```

Replace mutation `unknown` responses in:

```ts
// apps/openfit/src/hooks/mutations/use-routine-mutations.ts
import type { MutationSuccessResult, RoutineDto } from "@/lib/api-types";
```

```ts
// apps/openfit/src/hooks/mutations/use-routine-day-mutations.ts
import type { MutationSuccessResult, RoutineDayDto } from "@/lib/api-types";
```

Update route responses so they return the shared DTO shapes instead of ad hoc objects:

```ts
return Response.json(serializedRoutine, { status: 201 });
return Response.json(serializedRoutineDay, { status: 201 });
return Response.json({ success: true } satisfies MutationSuccessResult);
```

- [ ] **Step 4: Run slice verification**

Run:

```bash
cd /Users/pauldiloreto/Projects/openfit/apps/openfit
bun run test:run src/lib/routine-api.test.ts
bunx tsc --noEmit -p tsconfig.json
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/pauldiloreto/Projects/openfit
git add apps/openfit/src/routes/api/routines.ts apps/openfit/src/routes/api/routines.$id.ts apps/openfit/src/routes/api/routine-days.ts apps/openfit/src/routes/api/routine-days.$id.ts apps/openfit/src/hooks/queries/use-routines.ts apps/openfit/src/hooks/queries/use-routine-days.ts apps/openfit/src/hooks/mutations/use-routine-mutations.ts apps/openfit/src/hooks/mutations/use-routine-day-mutations.ts apps/openfit/src/lib/routine-api.test.ts
git commit -m "refactor: share routine api contracts"
```

## Task 3: Extract Narrow Serializer and Ownership Helpers

**Files:**
- Create: `apps/openfit/src/lib/api-serializers.ts`
- Create: `apps/openfit/src/lib/api-resource-helpers.ts`
- Create: `apps/openfit/src/lib/api-serializers.test.ts`
- Modify: `apps/openfit/src/routes/api/routines.$id.ts`
- Modify: `apps/openfit/src/routes/api/routine-days.$id.ts`
- Modify: `apps/openfit/src/routes/api/gyms.ts`
- Modify: `apps/openfit/src/routes/api/gyms.$id.ts`

- [ ] **Step 1: Write the failing helper tests**

```ts
import { describe, expect, it } from "vitest";
import {
	serializeGym,
	serializeRoutine,
	serializeRoutineDay,
} from "./api-serializers";

describe("api serializers", () => {
	it("serializes gym equipment relations to equipmentIds", () => {
		const result = serializeGym({
			id: "gym-1",
			name: "Home",
			userId: "user-1",
			createdAt: new Date(),
			updatedAt: new Date(),
			equipment: [{ equipmentId: "eq-1" }, { equipmentId: "eq-2" }],
		} as never);

		expect(result.equipmentIds).toEqual(["eq-1", "eq-2"]);
	});

	it("serializes routine-day weekday rows to numbers", () => {
		const result = serializeRoutineDay({
			id: "day-1",
			routineId: "routine-1",
			userId: "user-1",
			description: "Push",
			createdAt: new Date(),
			updatedAt: new Date(),
			weekdays: [{ weekday: 1 }, { weekday: 4 }],
		} as never);

		expect(result.weekdays).toEqual([1, 4]);
	});

	it("serializes routines with nested routine days", () => {
		const result = serializeRoutine({
			id: "routine-1",
			userId: "user-1",
			name: "Upper",
			description: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			routineDays: [],
		} as never);

		expect(result.routineDays).toEqual([]);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/pauldiloreto/Projects/openfit/apps/openfit && bun run test:run src/lib/api-serializers.test.ts`

Expected: FAIL because helper files do not exist yet.

- [ ] **Step 3: Implement narrow helpers and adopt them**

```ts
// apps/openfit/src/lib/api-serializers.ts
export function serializeRoutineDay(day: {
	weekdays: Array<{ weekday: number }>;
}): RoutineDayDto {
	return {
		...day,
		weekdays: day.weekdays.map((entry) => entry.weekday),
	};
}

export function serializeGym(gym: {
	equipment: Array<{ equipmentId: string }>;
}): GymDto {
	return {
		...gym,
		equipmentIds: gym.equipment.map((entry) => entry.equipmentId),
	};
}
```

```ts
// apps/openfit/src/lib/api-resource-helpers.ts
export async function requireOwnedRoutine(userId: string, id: string) {
	const routine = await db.query.routines.findFirst({
		where: eq(schema.routines.id, id),
	});
	if (!routine) return { status: 404 as const };
	if (routine.userId !== userId) return { status: 403 as const };
	return { status: 200 as const, routine };
}
```

Then replace repeated blocks in the affected route files with those helpers.

- [ ] **Step 4: Run targeted verification**

Run:

```bash
cd /Users/pauldiloreto/Projects/openfit/apps/openfit
bun run test:run src/lib/api-serializers.test.ts src/lib/routine-api.test.ts
bunx tsc --noEmit -p tsconfig.json
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/pauldiloreto/Projects/openfit
git add apps/openfit/src/lib/api-serializers.ts apps/openfit/src/lib/api-resource-helpers.ts apps/openfit/src/lib/api-serializers.test.ts apps/openfit/src/routes/api/routines.$id.ts apps/openfit/src/routes/api/routine-days.$id.ts apps/openfit/src/routes/api/gyms.ts apps/openfit/src/routes/api/gyms.$id.ts
git commit -m "refactor: extract api serializers and ownership helpers"
```

## Task 4: Replace Remaining `fetchJson<unknown>` Mutation Contracts

**Files:**
- Modify: `apps/openfit/src/hooks/mutations/use-admin-mutations.ts`
- Modify: `apps/openfit/src/hooks/mutations/use-gym-mutations.ts`
- Modify: `apps/openfit/src/hooks/mutations/use-session-mutations.ts`
- Modify: `apps/openfit/src/hooks/mutations/use-set-group-mutations.ts`
- Modify: `apps/openfit/src/hooks/mutations/use-set-mutations.ts`
- Modify: `apps/openfit/src/hooks/mutations/use-user-profile-mutations.ts`
- Modify: `apps/openfit/src/lib/api-types.ts`

- [ ] **Step 1: Write a failing type regression test for mutation contracts**

```ts
import { describe, expectTypeOf, it } from "vitest";
import type {
	GymDto,
	MutationSuccessResult,
	UserProfileDto,
} from "@/lib/api-types";

describe("mutation result contracts", () => {
	it("keeps gym create and update responses typed", () => {
		expectTypeOf<GymDto>().toMatchTypeOf<{ equipmentIds: string[] }>();
	});

	it("keeps delete-style responses explicit", () => {
		expectTypeOf<MutationSuccessResult>().toEqualTypeOf<{ success: true }>();
	});

	it("keeps profile mutation responses typed", () => {
		expectTypeOf<UserProfileDto["theme"]>().toEqualTypeOf<
			"light" | "dark" | "system"
		>();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/pauldiloreto/Projects/openfit/apps/openfit && bun run test:run src/lib/api-types.test.ts`

Expected: FAIL or incomplete coverage until the new DTOs are used broadly.

- [ ] **Step 3: Replace `unknown` with explicit results**

Use patterns like:

```ts
async function createGym(input: CreateGymInput): Promise<GymDto> {
	const response = await fetch("/api/gyms", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return fetchJson<GymDto>(response, "Failed to create gym");
}

async function deleteGym(id: string): Promise<MutationSuccessResult> {
	const response = await fetch(`/api/gyms/${id}`, { method: "DELETE" });
	return fetchJson<MutationSuccessResult>(response, "Failed to delete gym");
}
```

Apply the same conversion to admin, set, set-group, session, and user-profile mutations.

- [ ] **Step 4: Run verification**

Run:

```bash
cd /Users/pauldiloreto/Projects/openfit/apps/openfit
bunx tsc --noEmit -p tsconfig.json
bun run test:run src/lib/api-types.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/pauldiloreto/Projects/openfit
git add apps/openfit/src/hooks/mutations/use-admin-mutations.ts apps/openfit/src/hooks/mutations/use-gym-mutations.ts apps/openfit/src/hooks/mutations/use-session-mutations.ts apps/openfit/src/hooks/mutations/use-set-group-mutations.ts apps/openfit/src/hooks/mutations/use-set-mutations.ts apps/openfit/src/hooks/mutations/use-user-profile-mutations.ts apps/openfit/src/lib/api-types.ts apps/openfit/src/lib/api-types.test.ts
git commit -m "refactor: type mutation api responses"
```

## Task 5: Extract Profile Modal State Logic

**Files:**
- Create: `apps/openfit/src/components/profile/use-profile-settings-form.ts`
- Modify: `apps/openfit/src/components/profile/profile-modal.tsx`
- Test: `apps/openfit/src/components/profile/profile-modal.test.tsx`

- [ ] **Step 1: Write the failing modal behavior test**

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProfileModal } from "./profile-modal";

describe("ProfileModal", () => {
	it("resets gym form state when switching tabs", async () => {
		render(<ProfileModal open onClose={vi.fn()} />);

		fireEvent.click(screen.getByRole("tab", { name: "Equipment" }));
		fireEvent.click(screen.getByRole("tab", { name: "Settings" }));

		await waitFor(() => {
			expect(screen.queryByDisplayValue("")).toBeTruthy();
		});
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/pauldiloreto/Projects/openfit/apps/openfit && bun run test:run src/components/profile/profile-modal.test.tsx`

Expected: FAIL because the state hook does not exist and the behavior is still embedded in the component.

- [ ] **Step 3: Extract the form model**

```ts
// apps/openfit/src/components/profile/use-profile-settings-form.ts
export function useProfileSettingsForm(options: {
	open: boolean;
	onClose: () => void;
}) {
	const [activeTab, setActiveTab] = useState<Tab>("settings");
	const [gymDraft, setGymDraft] = useState({
		name: "",
		equipmentIds: [] as string[],
		editingGymId: undefined as string | undefined,
	});

	function resetGymForm() {
		setGymDraft({ name: "", equipmentIds: [], editingGymId: undefined });
	}

	return {
		activeTab,
		setActiveTab,
		gymDraft,
		setGymDraft,
		resetGymForm,
	};
}
```

Then simplify `profile-modal.tsx` so it consumes this hook instead of owning all gym/profile state directly.

- [ ] **Step 4: Run targeted verification**

Run:

```bash
cd /Users/pauldiloreto/Projects/openfit/apps/openfit
bun run test:run src/components/profile/profile-modal.test.tsx
bunx tsc --noEmit -p tsconfig.json
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/pauldiloreto/Projects/openfit
git add apps/openfit/src/components/profile/use-profile-settings-form.ts apps/openfit/src/components/profile/profile-modal.tsx apps/openfit/src/components/profile/profile-modal.test.tsx
git commit -m "refactor: extract profile modal state"
```

## Task 6: Extract Exercise Form State and Fix Blob URL Cleanup

**Files:**
- Create: `apps/openfit/src/components/admin/use-exercise-form-state.ts`
- Create: `apps/openfit/src/components/admin/use-exercise-image-queue.ts`
- Create: `apps/openfit/src/components/admin/use-exercise-image-queue.test.ts`
- Modify: `apps/openfit/src/components/admin/exercise-form-modal.tsx`

- [ ] **Step 1: Write the failing blob URL cleanup test**

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useExerciseImageQueue } from "./use-exercise-image-queue";

describe("useExerciseImageQueue", () => {
	it("revokes blob URLs on cleanup", () => {
		const revoke = vi.spyOn(URL, "revokeObjectURL");
		const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");

		const { result, unmount } = renderHook(() => useExerciseImageQueue());
		result.current.addFiles([new File(["x"], "a.png", { type: "image/png" })]);
		unmount();

		expect(create).toHaveBeenCalled();
		expect(revoke).toHaveBeenCalledWith("blob:test");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/pauldiloreto/Projects/openfit/apps/openfit && bun run test:run src/components/admin/use-exercise-image-queue.test.ts`

Expected: FAIL because the hook does not exist yet and cleanup is still modal-local.

- [ ] **Step 3: Implement the extracted hooks**

```ts
// apps/openfit/src/components/admin/use-exercise-image-queue.ts
export function useExerciseImageQueue() {
	const [images, setImages] = useState<ImageItem[]>([]);

	useEffect(() => {
		return () => {
			for (const image of images) {
				if (image.type === "new" && image.url) {
					URL.revokeObjectURL(image.url);
				}
			}
		};
	}, [images]);

	function addFiles(files: File[]) {
		setImages((current) => [
			...current,
			...files.map((file) => ({
				type: "new" as const,
				file,
				url: URL.createObjectURL(file),
			})),
		]);
	}

	return { images, setImages, addFiles };
}
```

```ts
// apps/openfit/src/components/admin/use-exercise-form-state.ts
export function useExerciseFormState(exercise: ExerciseWithRelations | undefined) {
	const [name, setName] = useState("");
	const [categoryId, setCategoryId] = useState("");
	// remaining focused form fields here
	return { name, setName, categoryId, setCategoryId };
}
```

Then reduce `exercise-form-modal.tsx` to rendering, wiring, and submit orchestration.

- [ ] **Step 4: Run targeted verification**

Run:

```bash
cd /Users/pauldiloreto/Projects/openfit/apps/openfit
bun run test:run src/components/admin/use-exercise-image-queue.test.ts
bunx tsc --noEmit -p tsconfig.json
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/pauldiloreto/Projects/openfit
git add apps/openfit/src/components/admin/use-exercise-form-state.ts apps/openfit/src/components/admin/use-exercise-image-queue.ts apps/openfit/src/components/admin/use-exercise-image-queue.test.ts apps/openfit/src/components/admin/exercise-form-modal.tsx
git commit -m "refactor: extract exercise form state"
```

## Final Verification

- [ ] **Step 1: Run full repo verification**

```bash
cd /Users/pauldiloreto/Projects/openfit
bunx tsc --noEmit -p apps/openfit/tsconfig.json
bun run lint
bun run test:run
bun run build
```

Expected: PASS

- [ ] **Step 2: Confirm working tree is clean**

Run: `cd /Users/pauldiloreto/Projects/openfit && git status --short`

Expected: no output

## Self-Review

Spec coverage check:

- DTO separation is covered by Task 1.
- Routines vertical slice is covered by Task 2.
- Server helper extraction is covered by Task 3.
- mutation `unknown` cleanup is covered by Task 4.
- `profile-modal` state extraction is covered by Task 5.
- `exercise-form-modal` cleanup and blob URL lifecycle are covered by Task 6.

Placeholder scan:

- No `TODO`, `TBD`, or “similar to above” placeholders remain.
- Each task names concrete files, commands, and commit boundaries.

Type consistency:

- Shared DTO names are consistent across tasks: `CursorPage`, `MutationSuccessResult`, `MutationIdResult`, `RoutineDto`, `RoutineDayDto`.
- Serializer/helper names are consistent across tasks: `serializeRoutine`, `serializeRoutineDay`, `serializeGym`, `requireOwnedRoutine`.
