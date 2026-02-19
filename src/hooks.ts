import { useAdminCreateExercise, useAdminDeleteExercise, useAdminUpdateExercise, useCreateLookup, useDeleteLookup, useUpdateLookup, useUpdateUserRole, useUploadFile } from "./hooks/mutations/use-admin-mutations";
import { useCreateExercise, useDeleteExercise, useUpdateExercise } from "./hooks/mutations/use-exercise-mutations";
import { useCreateGym, useDeleteGym, useUpdateGym } from "./hooks/mutations/use-gym-mutations";
import { useCreateRoutineDay, useDeleteRoutineDay, useUpdateRoutineDay } from "./hooks/mutations/use-routine-day-mutations";
import { useCreateRoutine, useDeleteRoutine, useUpdateRoutine } from "./hooks/mutations/use-routine-mutations";
import { useCreateSession, useDeleteSession, useUpdateSession } from "./hooks/mutations/use-session-mutations";
import { useBulkEditSetGroup, useCreateSetGroup, useDeleteSetGroup, useReorderSetGroups, useReplaceExercise, useUpdateSetGroup } from "./hooks/mutations/use-set-group-mutations";
import { useCreateSet, useDeleteSet, useReorderSets, useUpdateSet } from "./hooks/mutations/use-set-mutations";
import { useSetDefaultGym, useUpdateUserProfile } from "./hooks/mutations/use-user-profile-mutations";
import { useAdminCategories, useAdminEquipment, useAdminExercisesPaginated, useAdminLookupPaginated, useAdminMuscleGroups, useAdminRepetitionUnits, useAdminUsersPaginated, useAdminWeightUnits } from "./hooks/queries/use-admin";
import type { AdminPaginationParams, ExerciseWithRelations, LookupItem, PaginatedResponse, UserWithProfile } from "./hooks/queries/use-admin";
import { useDashboardStats, useRecentSessions } from "./hooks/queries/use-dashboard";
import { useExercise, useExercises, useExerciseSearch, useSimilarExercises } from "./hooks/queries/use-exercises";
import { useGym, useGyms } from "./hooks/queries/use-gyms";
import { useCategories, useEquipment, useMuscleGroups, useUnits } from "./hooks/queries/use-lookups";
import { useRoutineDay, useRoutineDaySearch } from "./hooks/queries/use-routine-days";
import { useRoutine, useRoutines, useRoutineSearch } from "./hooks/queries/use-routines";
import { useCurrentSession, useSession, useSessions, useSessionsByDateRange } from "./hooks/queries/use-sessions";
import { useUserProfile } from "./hooks/queries/use-user-profile";
import { useCountdownTimer } from "./hooks/use-countdown-timer";
import type { CountdownTimer } from "./hooks/use-countdown-timer";
import { useInView } from "./hooks/use-in-view";

export {
  useExercise,
  useExercises,
  useExerciseSearch,
  useSimilarExercises,
  useRoutine,
  useRoutines,
  useRoutineSearch,
  useRoutineDay,
  useRoutineDaySearch,
  useCurrentSession,
  useSession,
  useSessions,
  useSessionsByDateRange,
  useGym,
  useGyms,
  useCategories,
  useEquipment,
  useMuscleGroups,
  useUnits,
  useUserProfile,
  useDashboardStats,
  useRecentSessions,
  useAdminCategories,
  useAdminEquipment,
  useAdminExercisesPaginated,
  useAdminLookupPaginated,
  useAdminMuscleGroups,
  useAdminRepetitionUnits,
  useAdminUsersPaginated,
  useAdminWeightUnits,
  useInView,
  useCountdownTimer,
  useCreateExercise,
  useUpdateExercise,
  useDeleteExercise,
  useCreateRoutine,
  useUpdateRoutine,
  useDeleteRoutine,
  useCreateRoutineDay,
  useUpdateRoutineDay,
  useDeleteRoutineDay,
  useCreateSession,
  useUpdateSession,
  useDeleteSession,
  useCreateSetGroup,
  useUpdateSetGroup,
  useDeleteSetGroup,
  useReorderSetGroups,
  useReplaceExercise,
  useBulkEditSetGroup,
  useCreateSet,
  useUpdateSet,
  useDeleteSet,
  useReorderSets,
  useCreateGym,
  useUpdateGym,
  useDeleteGym,
  useUpdateUserProfile,
  useSetDefaultGym,
  useUpdateUserRole,
  useAdminCreateExercise,
  useAdminUpdateExercise,
  useAdminDeleteExercise,
  useCreateLookup,
  useUpdateLookup,
  useDeleteLookup,
  useUploadFile,
};

export type {
  CountdownTimer,
  UserWithProfile,
  ExerciseWithRelations,
  LookupItem,
  PaginatedResponse,
  AdminPaginationParams,
};
