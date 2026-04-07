import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
	MutationSuccessResult,
	WorkoutSetGroupMutationResult,
	WorkoutSetGroupWithMutationSetsResult,
} from "@/lib/api-types";
import { queryKeys } from "@/lib/query-keys";
import { fetchJson } from "@/lib/request-helpers";

type CreateSetGroupInput = {
	sessionId?: string;
	routineDayId?: string;
	type?: "NORMAL" | "SUPERSET";
	exerciseId: string;
	numSets?: number;
};
type UpdateSetGroupInput = {
	id: string;
	type?: "NORMAL" | "SUPERSET";
	comment?: string;
};
type ReorderSetGroupsInput = {
	setGroupIds: string[];
};
type ReplaceExerciseInput = {
	id: string;
	exerciseId: string;
};
type BulkEditInput = {
	id: string;
	reps?: number;
	weight?: number;
	repetitionUnitId?: string;
	weightUnitId?: string;
	restTime?: number;
};
// Create set group
async function createSetGroup(
	input: CreateSetGroupInput,
): Promise<WorkoutSetGroupWithMutationSetsResult> {
	const response = await fetch("/api/set-groups", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return fetchJson<WorkoutSetGroupWithMutationSetsResult>(
		response,
		"Failed to create set group",
	);
}
// Update set group
async function updateSetGroup({
	id,
	...input
}: UpdateSetGroupInput): Promise<WorkoutSetGroupMutationResult> {
	const response = await fetch(`/api/set-groups/${id}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return fetchJson<WorkoutSetGroupMutationResult>(
		response,
		"Failed to update set group",
	);
}
// Delete set group
async function deleteSetGroup(id: string): Promise<MutationSuccessResult> {
	const response = await fetch(`/api/set-groups/${id}`, {
		method: "DELETE",
	});
	return fetchJson<MutationSuccessResult>(
		response,
		"Failed to delete set group",
	);
}
// Reorder set groups
async function reorderSetGroups(
	input: ReorderSetGroupsInput,
): Promise<MutationSuccessResult> {
	const response = await fetch("/api/set-groups/reorder", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return fetchJson<MutationSuccessResult>(
		response,
		"Failed to reorder set groups",
	);
}
// Replace exercise in set group
async function replaceExercise({
	id,
	exerciseId,
}: ReplaceExerciseInput): Promise<MutationSuccessResult> {
	const response = await fetch(`/api/set-groups/${id}/replace-exercise`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ exerciseId }),
	});
	return fetchJson<MutationSuccessResult>(
		response,
		"Failed to replace exercise",
	);
}
// Bulk edit sets in set group
async function bulkEditSetGroup({
	id,
	...input
}: BulkEditInput): Promise<MutationSuccessResult> {
	const response = await fetch(`/api/set-groups/${id}/bulk-edit`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return fetchJson<MutationSuccessResult>(response, "Failed to bulk edit");
}
export function useCreateSetGroup(): UseMutationResult<
	WorkoutSetGroupWithMutationSetsResult,
	Error,
	CreateSetGroupInput
> {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: createSetGroup,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
			void queryClient.invalidateQueries({
				queryKey: queryKeys.routineDays.all,
			});
		},
	});
}
export function useUpdateSetGroup(): UseMutationResult<
	WorkoutSetGroupMutationResult,
	Error,
	UpdateSetGroupInput
> {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: updateSetGroup,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
			void queryClient.invalidateQueries({
				queryKey: queryKeys.routineDays.all,
			});
		},
	});
}
export function useDeleteSetGroup(): UseMutationResult<
	MutationSuccessResult,
	Error,
	string
> {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: deleteSetGroup,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
			void queryClient.invalidateQueries({
				queryKey: queryKeys.routineDays.all,
			});
		},
	});
}
export function useReorderSetGroups(): UseMutationResult<
	MutationSuccessResult,
	Error,
	ReorderSetGroupsInput
> {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: reorderSetGroups,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
			void queryClient.invalidateQueries({
				queryKey: queryKeys.routineDays.all,
			});
		},
	});
}
export function useReplaceExercise(): UseMutationResult<
	MutationSuccessResult,
	Error,
	ReplaceExerciseInput
> {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: replaceExercise,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
			void queryClient.invalidateQueries({
				queryKey: queryKeys.routineDays.all,
			});
		},
	});
}
export function useBulkEditSetGroup(): UseMutationResult<
	MutationSuccessResult,
	Error,
	BulkEditInput
> {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: bulkEditSetGroup,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
			void queryClient.invalidateQueries({
				queryKey: queryKeys.routineDays.all,
			});
		},
	});
}
