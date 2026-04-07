import {
	useAdminCreateExercise,
	useAdminDeleteExercise,
	useAdminUpdateExercise,
	useCreateLookup,
	useDeleteLookup,
	useUpdateLookup,
	useUpdateUserRole,
	useUploadFile,
} from "./hooks/mutations/use-admin-mutations";
import {
	useCreateGym,
	useDeleteGym,
	useUpdateGym,
} from "./hooks/mutations/use-gym-mutations";
import {
	useCreateRoutineDay,
	useDeleteRoutineDay,
	useUpdateRoutineDay,
} from "./hooks/mutations/use-routine-day-mutations";
import {
	useCreateRoutine,
	useDeleteRoutine,
	useUpdateRoutine,
} from "./hooks/mutations/use-routine-mutations";
import {
	useCreateSession,
	useDeleteSession,
	useUpdateSession,
} from "./hooks/mutations/use-session-mutations";
import {
	useBulkEditSetGroup,
	useCreateSetGroup,
	useDeleteSetGroup,
	useReorderSetGroups,
	useReplaceExercise,
	useUpdateSetGroup,
} from "./hooks/mutations/use-set-group-mutations";
import {
	useCreateSet,
	useDeleteSet,
	useReorderSets,
	useUpdateSet,
} from "./hooks/mutations/use-set-mutations";
import {
	useSetDefaultGym,
	useUpdateUserProfile,
} from "./hooks/mutations/use-user-profile-mutations";
import type {
	AdminPaginationParams,
	ExerciseWithRelations,
	LookupItem,
	PaginatedResponse,
	UserWithProfile,
} from "./hooks/queries/use-admin";
import {
	useAdminCategories,
	useAdminEquipment,
	useAdminExercisesPaginated,
	useAdminLookupPaginated,
	useAdminMuscleGroups,
	useAdminRepetitionUnits,
	useAdminUsersPaginated,
	useAdminWeightUnits,
} from "./hooks/queries/use-admin";
import {
	useDashboardStats,
	useRecentSessions,
} from "./hooks/queries/use-dashboard";
import {
	useExercise,
	useExerciseSearch,
	useExercises,
	useSimilarExercises,
} from "./hooks/queries/use-exercises";
import { useGym, useGyms } from "./hooks/queries/use-gyms";
import {
	useCategories,
	useEquipment,
	useMuscleGroups,
	useUnits,
} from "./hooks/queries/use-lookups";
import {
	useRoutineDay,
	useRoutineDaySearch,
} from "./hooks/queries/use-routine-days";
import {
	useRoutine,
	useRoutineSearch,
	useRoutines,
} from "./hooks/queries/use-routines";
import {
	useCurrentSession,
	useSession,
	useSessions,
	useSessionsByDateRange,
} from "./hooks/queries/use-sessions";
import { useUserProfile } from "./hooks/queries/use-user-profile";
import type { CountdownTimer } from "./hooks/use-countdown-timer";
import { useCountdownTimer } from "./hooks/use-countdown-timer";
import { useInView } from "./hooks/use-in-view";

export type {
	AdminPaginationParams,
	CountdownTimer,
	ExerciseWithRelations,
	LookupItem,
	PaginatedResponse,
	UserWithProfile,
};
export {
	useAdminCategories,
	useAdminCreateExercise,
	useAdminDeleteExercise,
	useAdminEquipment,
	useAdminExercisesPaginated,
	useAdminLookupPaginated,
	useAdminMuscleGroups,
	useAdminRepetitionUnits,
	useAdminUpdateExercise,
	useAdminUsersPaginated,
	useAdminWeightUnits,
	useBulkEditSetGroup,
	useCategories,
	useCountdownTimer,
	useCreateGym,
	useCreateLookup,
	useCreateRoutine,
	useCreateRoutineDay,
	useCreateSession,
	useCreateSet,
	useCreateSetGroup,
	useCurrentSession,
	useDashboardStats,
	useDeleteGym,
	useDeleteLookup,
	useDeleteRoutine,
	useDeleteRoutineDay,
	useDeleteSession,
	useDeleteSet,
	useDeleteSetGroup,
	useEquipment,
	useExercise,
	useExerciseSearch,
	useExercises,
	useGym,
	useGyms,
	useInView,
	useMuscleGroups,
	useRecentSessions,
	useReorderSetGroups,
	useReorderSets,
	useReplaceExercise,
	useRoutine,
	useRoutineDay,
	useRoutineDaySearch,
	useRoutineSearch,
	useRoutines,
	useSession,
	useSessions,
	useSessionsByDateRange,
	useSetDefaultGym,
	useSimilarExercises,
	useUnits,
	useUpdateGym,
	useUpdateLookup,
	useUpdateRoutine,
	useUpdateRoutineDay,
	useUpdateSession,
	useUpdateSet,
	useUpdateSetGroup,
	useUpdateUserProfile,
	useUpdateUserRole,
	useUploadFile,
	useUserProfile,
};
