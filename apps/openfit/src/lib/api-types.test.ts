import { describe, expectTypeOf, it } from "vitest";
import type {
	CursorPage,
	MutationIdResult,
	MutationSuccessResult,
	RoutineDayDto,
	RoutineDto,
} from "./api-types";

describe("api-types", () => {
	it("separates cursor pagination from admin pagination", () => {
		expectTypeOf<CursorPage<RoutineDto>>().toMatchTypeOf<{
			page: RoutineDto[];
			isDone: boolean;
			continueCursor: string | undefined;
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
