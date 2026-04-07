import { describe, expectTypeOf, it } from "vitest";
import type {
	useAdminCreateExercise,
	useAdminDeleteExercise,
	useAdminUpdateExercise,
	useCreateLookup,
	useDeleteLookup,
	useUpdateLookup,
	useUpdateUserRole,
} from "@/hooks/mutations/use-admin-mutations";
import type {
	useCreateGym,
	useDeleteGym,
	useUpdateGym,
} from "@/hooks/mutations/use-gym-mutations";
import type {
	useCreateSession,
	useDeleteSession,
	useUpdateSession,
} from "@/hooks/mutations/use-session-mutations";
import type {
	useBulkEditSetGroup,
	useCreateSetGroup,
	useDeleteSetGroup,
	useReorderSetGroups,
	useReplaceExercise,
	useUpdateSetGroup,
} from "@/hooks/mutations/use-set-group-mutations";
import type {
	useCreateSet,
	useDeleteSet,
	useReorderSets,
	useUpdateSet,
} from "@/hooks/mutations/use-set-mutations";
import type {
	useSetDefaultGym,
	useUpdateUserProfile,
} from "@/hooks/mutations/use-user-profile-mutations";
import type {
	CursorPage,
	GymDto,
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
	SessionDto,
	SetDeleteResult,
	UserProfileBaseDto,
	UserProfileDto,
	WorkoutSetDto,
	WorkoutSetGroupDto,
	WorkoutSetGroupWithSetsDto,
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

	it("shares explicit mutation response contracts with the remaining hooks", () => {
		expectTypeOf<GymDto["equipmentIds"]>().toEqualTypeOf<string[]>();
		expectTypeOf<SessionDto["setGroups"]>().toEqualTypeOf<
			WorkoutSetGroupWithSetsDto[]
		>();
		expectTypeOf<WorkoutSetGroupDto["comment"]>().toEqualTypeOf<
			string | null
		>();
		expectTypeOf<WorkoutSetDto["createdAt"]>().toEqualTypeOf<string>();
		expectTypeOf<
			UserProfileDto["defaultGym"]
		>().toEqualTypeOf<LookupItemDto | null>();
		expectTypeOf<SetDeleteResult>().toMatchTypeOf<{
			success: true;
			setGroupDeleted: boolean;
		}>();

		expectTypeOf<ReturnType<typeof useUpdateUserRole>["data"]>().toEqualTypeOf<
			UserProfileBaseDto | undefined
		>();
		expectTypeOf<
			ReturnType<typeof useAdminCreateExercise>["data"]
		>().toEqualTypeOf<MutationIdResult | undefined>();
		expectTypeOf<
			ReturnType<typeof useAdminUpdateExercise>["data"]
		>().toEqualTypeOf<MutationSuccessResult | undefined>();
		expectTypeOf<
			ReturnType<typeof useAdminDeleteExercise>["data"]
		>().toEqualTypeOf<MutationSuccessResult | undefined>();
		expectTypeOf<ReturnType<typeof useCreateLookup>["data"]>().toEqualTypeOf<
			MutationIdResult | undefined
		>();
		expectTypeOf<ReturnType<typeof useUpdateLookup>["data"]>().toEqualTypeOf<
			MutationSuccessResult | undefined
		>();
		expectTypeOf<ReturnType<typeof useDeleteLookup>["data"]>().toEqualTypeOf<
			MutationSuccessResult | undefined
		>();
		expectTypeOf<ReturnType<typeof useCreateGym>["data"]>().toEqualTypeOf<
			GymDto | undefined
		>();
		expectTypeOf<ReturnType<typeof useUpdateGym>["data"]>().toEqualTypeOf<
			GymDto | undefined
		>();
		expectTypeOf<ReturnType<typeof useDeleteGym>["data"]>().toEqualTypeOf<
			MutationSuccessResult | undefined
		>();
		expectTypeOf<ReturnType<typeof useCreateSession>["data"]>().toEqualTypeOf<
			SessionDto | undefined
		>();
		expectTypeOf<ReturnType<typeof useUpdateSession>["data"]>().toEqualTypeOf<
			SessionDto | undefined
		>();
		expectTypeOf<ReturnType<typeof useDeleteSession>["data"]>().toEqualTypeOf<
			MutationSuccessResult | undefined
		>();
		expectTypeOf<ReturnType<typeof useCreateSetGroup>["data"]>().toEqualTypeOf<
			WorkoutSetGroupWithSetsDto | undefined
		>();
		expectTypeOf<ReturnType<typeof useUpdateSetGroup>["data"]>().toEqualTypeOf<
			WorkoutSetGroupDto | undefined
		>();
		expectTypeOf<ReturnType<typeof useDeleteSetGroup>["data"]>().toEqualTypeOf<
			MutationSuccessResult | undefined
		>();
		expectTypeOf<
			ReturnType<typeof useReorderSetGroups>["data"]
		>().toEqualTypeOf<MutationSuccessResult | undefined>();
		expectTypeOf<ReturnType<typeof useReplaceExercise>["data"]>().toEqualTypeOf<
			MutationSuccessResult | undefined
		>();
		expectTypeOf<
			ReturnType<typeof useBulkEditSetGroup>["data"]
		>().toEqualTypeOf<MutationSuccessResult | undefined>();
		expectTypeOf<ReturnType<typeof useCreateSet>["data"]>().toEqualTypeOf<
			WorkoutSetDto | undefined
		>();
		expectTypeOf<ReturnType<typeof useUpdateSet>["data"]>().toEqualTypeOf<
			WorkoutSetDto | undefined
		>();
		expectTypeOf<ReturnType<typeof useDeleteSet>["data"]>().toEqualTypeOf<
			SetDeleteResult | undefined
		>();
		expectTypeOf<ReturnType<typeof useReorderSets>["data"]>().toEqualTypeOf<
			MutationSuccessResult | undefined
		>();
		expectTypeOf<
			ReturnType<typeof useUpdateUserProfile>["data"]
		>().toEqualTypeOf<UserProfileDto | undefined>();
		expectTypeOf<ReturnType<typeof useSetDefaultGym>["data"]>().toEqualTypeOf<
			UserProfileDto | undefined
		>();
	});
});
