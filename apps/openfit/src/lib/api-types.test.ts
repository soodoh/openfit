import { describe, expectTypeOf, it } from "vitest";
import type {
	CursorPage,
	MutationIdResult,
	MutationSuccessResult,
	RoutineDayDto,
	RoutineDaySetGroupDto,
	RoutineDto,
	RoutineRelationDto,
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
		expectTypeOf<RoutineDto>().toMatchObjectType<{
			id: string;
			userId: string;
			name: string;
			description: string | null | undefined;
			createdAt: Date | string;
			updatedAt: Date | string;
			routineDays: RoutineDayDto[];
		}>();
	});

	it("models routine days as explicit transport DTOs", () => {
		expectTypeOf<RoutineDayDto>().toMatchObjectType<{
			id: string;
			routineId: string;
			userId: string;
			description: string;
			createdAt: Date | string;
			updatedAt: Date | string;
			weekdays: number[];
		}>();
		expectTypeOf<RoutineDayDto["routine"]>().toEqualTypeOf<
			RoutineRelationDto | null | undefined
		>();
		expectTypeOf<RoutineDayDto["setGroups"]>().toEqualTypeOf<
			RoutineDaySetGroupDto[] | undefined
		>();
	});
});
