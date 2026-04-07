import { describe, expectTypeOf, it } from "vitest";
import type {
	CursorPage,
	LookupItemDto,
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
		expectTypeOf<RoutineDto["description"]>().toEqualTypeOf<string | null>();
		expectTypeOf<RoutineDto["routineDays"]>().toEqualTypeOf<RoutineDayDto[]>();
		expectTypeOf<RoutineRelationDto["description"]>().toEqualTypeOf<
			string | null
		>();
	});

	it("models routine days as explicit transport DTOs", () => {
		expectTypeOf<RoutineDayDto["description"]>().toEqualTypeOf<string>();
		expectTypeOf<RoutineDayDto["routine"]>().toEqualTypeOf<
			RoutineRelationDto | null | undefined
		>();
		expectTypeOf<RoutineDayDto["setGroups"]>().toEqualTypeOf<
			RoutineDaySetGroupDto[] | undefined
		>();
		expectTypeOf<RoutineDaySetGroupDto["routineDayId"]>().toEqualTypeOf<
			string | null
		>();
		expectTypeOf<RoutineDaySetGroupDto["sessionId"]>().toEqualTypeOf<
			string | null
		>();
		expectTypeOf<RoutineDaySetGroupDto["comment"]>().toEqualTypeOf<
			string | null
		>();
		expectTypeOf<
			RoutineDaySetGroupDto["sets"][number]["exercise"]
		>().toEqualTypeOf<{
			id: string;
			name: string;
			imageUrl?: string | null;
		} | null>();
		expectTypeOf<
			RoutineDaySetGroupDto["sets"][number]["repetitionUnit"]
		>().toEqualTypeOf<LookupItemDto | null>();
		expectTypeOf<
			RoutineDaySetGroupDto["sets"][number]["weightUnit"]
		>().toEqualTypeOf<LookupItemDto | null>();
	});
});
