import { describe, expectTypeOf, it } from "vitest";
import type {
	CursorPage,
	LookupItemDto,
	MutationIdResult,
	MutationSuccessResult,
	RoutineDayDetailDto,
	RoutineDayDetailResult,
	RoutineDayDto,
	RoutineDayResult,
	RoutineDaySearchDto,
	RoutineDaySearchResult,
	RoutineDaySetGroupDto,
	RoutineDto,
	RoutineQueryDto,
	RoutineQueryResult,
	RoutineRelationDto,
	RoutineRelationResult,
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
		expectTypeOf<RoutineDto["createdAt"]>().toEqualTypeOf<string>();
		expectTypeOf<RoutineDto["description"]>().toEqualTypeOf<string | null>();
		expectTypeOf<RoutineDto["routineDays"]>().toEqualTypeOf<RoutineDayDto[]>();
		expectTypeOf<RoutineQueryDto["createdAt"]>().toEqualTypeOf<string>();
		expectTypeOf<
			RoutineQueryDto["routineDays"][number]["updatedAt"]
		>().toEqualTypeOf<string>();
		expectTypeOf<RoutineQueryResult["createdAt"]>().toEqualTypeOf<Date>();
		expectTypeOf<
			RoutineQueryResult["routineDays"][number]["updatedAt"]
		>().toEqualTypeOf<Date>();
		expectTypeOf<RoutineRelationDto["description"]>().toEqualTypeOf<
			string | null
		>();
		expectTypeOf<RoutineRelationResult["createdAt"]>().toEqualTypeOf<Date>();
	});

	it("models routine days as explicit transport DTOs", () => {
		expectTypeOf<RoutineDayDto["description"]>().toEqualTypeOf<string>();
		expectTypeOf<RoutineDayDto["createdAt"]>().toEqualTypeOf<string>();
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
		expectTypeOf<RoutineDaySearchDto["createdAt"]>().toEqualTypeOf<string>();
		expectTypeOf<RoutineDaySearchDto["routine"]>().toEqualTypeOf<
			RoutineRelationDto | null | undefined
		>();
		expectTypeOf<RoutineDaySearchResult["createdAt"]>().toEqualTypeOf<Date>();
		expectTypeOf<RoutineDayResult["updatedAt"]>().toEqualTypeOf<Date>();
		expectTypeOf<RoutineDayDetailDto["setGroups"]>().toEqualTypeOf<
			RoutineDayDetailDto["setGroups"]
		>();
		expectTypeOf<
			RoutineDayDetailResult["setGroups"][number]["createdAt"]
		>().toEqualTypeOf<Date>();
		expectTypeOf<
			RoutineDayDetailDto["setGroups"][number]["sets"][number]["exercise"]
		>().toEqualTypeOf<
			| {
					id: string;
					name: string;
					imageUrl: string | null | undefined;
			  }
			| null
			| undefined
		>();
	});
});
