import { describe, expectTypeOf, it } from "vitest";
import type {
	ExerciseResult,
	GymDto,
	GymResult,
	LookupResult,
	MutationIdResult,
	MutationSuccessResult,
	SessionResult,
	SetDeleteResult,
	UserProfileBaseResult,
	UserProfileResult,
	WorkoutSetGroupMutationResult,
	WorkoutSetGroupWithMutationSetsResult,
	WorkoutSetMutationResult,
	WorkoutSetResult,
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
	it("uses honest shared result types for raw mutation payloads", () => {
		expectTypeOf<GymDto["equipmentIds"]>().toEqualTypeOf<string[]>();
		expectTypeOf<SessionResult["createdAt"]>().toEqualTypeOf<Date>();
		expectTypeOf<
			SessionResult["setGroups"][number]["sets"][number]["exercise"]
		>().toEqualTypeOf<(ExerciseResult & { imageUrl: string | null }) | null>();
		expectTypeOf<
			SessionResult["setGroups"][number]["sets"][number]["repetitionUnit"]
		>().toEqualTypeOf<LookupResult | null>();
		expectTypeOf<
			WorkoutSetGroupMutationResult["createdAt"]
		>().toEqualTypeOf<Date>();
		expectTypeOf<WorkoutSetGroupMutationResult["comment"]>().toEqualTypeOf<
			string | null
		>();
		expectTypeOf<WorkoutSetMutationResult["createdAt"]>().toEqualTypeOf<Date>();
		expectTypeOf<
			WorkoutSetMutationResult["exercise"]
		>().toEqualTypeOf<ExerciseResult | null>();
		expectTypeOf<
			WorkoutSetMutationResult["weightUnit"]
		>().toEqualTypeOf<LookupResult | null>();
		expectTypeOf<
			UserProfileResult["defaultGym"]
		>().toEqualTypeOf<GymResult | null>();
		expectTypeOf<
			UserProfileResult["defaultRepetitionUnit"]
		>().toEqualTypeOf<LookupResult | null>();
		expectTypeOf<SetDeleteResult>().toMatchTypeOf<{
			success: true;
			setGroupDeleted: boolean;
		}>();

		expectTypeOf<ReturnType<typeof useUpdateUserRole>["data"]>().toEqualTypeOf<
			UserProfileBaseResult | undefined
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
			SessionResult | undefined
		>();
		expectTypeOf<ReturnType<typeof useUpdateSession>["data"]>().toEqualTypeOf<
			SessionResult | undefined
		>();
		expectTypeOf<ReturnType<typeof useDeleteSession>["data"]>().toEqualTypeOf<
			MutationSuccessResult | undefined
		>();
		expectTypeOf<ReturnType<typeof useCreateSetGroup>["data"]>().toEqualTypeOf<
			WorkoutSetGroupWithMutationSetsResult | undefined
		>();
		expectTypeOf<ReturnType<typeof useUpdateSetGroup>["data"]>().toEqualTypeOf<
			WorkoutSetGroupMutationResult | undefined
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
			WorkoutSetMutationResult | undefined
		>();
		expectTypeOf<ReturnType<typeof useUpdateSet>["data"]>().toEqualTypeOf<
			WorkoutSetMutationResult | undefined
		>();
		expectTypeOf<ReturnType<typeof useDeleteSet>["data"]>().toEqualTypeOf<
			SetDeleteResult | undefined
		>();
		expectTypeOf<ReturnType<typeof useReorderSets>["data"]>().toEqualTypeOf<
			MutationSuccessResult | undefined
		>();
		expectTypeOf<
			ReturnType<typeof useUpdateUserProfile>["data"]
		>().toEqualTypeOf<UserProfileResult | undefined>();
		expectTypeOf<ReturnType<typeof useSetDefaultGym>["data"]>().toEqualTypeOf<
			UserProfileResult | undefined
		>();
	});
});
