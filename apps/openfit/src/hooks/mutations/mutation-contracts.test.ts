import { describe, expectTypeOf, it } from "vitest";
import type {
	ExerciseRelationDto,
	GymDto,
	GymRelationDto,
	LookupRowDto,
	MutationIdResult,
	MutationSuccessResult,
	SessionDto,
	SessionExerciseRelationDto,
	SetDeleteResult,
	UserProfileBaseDto,
	UserProfileDto,
	WorkoutSetDto,
	WorkoutSetGroupDto,
	WorkoutSetGroupWithSetsDto,
} from "@/lib/api-types";
import type {
	useAdminCreateExercise,
	useAdminDeleteExercise,
	useAdminUpdateExercise,
	useCreateLookup,
	useDeleteLookup,
	useUpdateLookup,
	useUpdateUserRole,
} from "./use-admin-mutations";
import type {
	useCreateGym,
	useDeleteGym,
	useUpdateGym,
} from "./use-gym-mutations";
import type {
	useCreateSession,
	useDeleteSession,
	useUpdateSession,
} from "./use-session-mutations";
import type {
	useBulkEditSetGroup,
	useCreateSetGroup,
	useDeleteSetGroup,
	useReorderSetGroups,
	useReplaceExercise,
	useUpdateSetGroup,
} from "./use-set-group-mutations";
import type {
	useCreateSet,
	useDeleteSet,
	useReorderSets,
	useUpdateSet,
} from "./use-set-mutations";
import type {
	useSetDefaultGym,
	useUpdateUserProfile,
} from "./use-user-profile-mutations";

describe("mutation contracts", () => {
	it("keeps the remaining mutation response contracts explicit", () => {
		expectTypeOf<GymDto["equipmentIds"]>().toEqualTypeOf<string[]>();
		expectTypeOf<SessionDto["setGroups"]>().toEqualTypeOf<
			SessionDto["setGroups"]
		>();
		expectTypeOf<
			SessionDto["setGroups"][number]["sets"][number]["exercise"]
		>().toEqualTypeOf<SessionExerciseRelationDto | null>();
		expectTypeOf<
			SessionDto["setGroups"][number]["sets"][number]["repetitionUnit"]
		>().toEqualTypeOf<LookupRowDto | null>();
		expectTypeOf<WorkoutSetGroupDto["comment"]>().toEqualTypeOf<
			string | null
		>();
		expectTypeOf<WorkoutSetDto["createdAt"]>().toEqualTypeOf<string>();
		expectTypeOf<
			WorkoutSetDto["exercise"]
		>().toEqualTypeOf<ExerciseRelationDto | null>();
		expectTypeOf<
			WorkoutSetDto["weightUnit"]
		>().toEqualTypeOf<LookupRowDto | null>();
		expectTypeOf<
			UserProfileDto["defaultGym"]
		>().toEqualTypeOf<GymRelationDto | null>();
		expectTypeOf<
			UserProfileDto["defaultRepetitionUnit"]
		>().toEqualTypeOf<LookupRowDto | null>();
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
