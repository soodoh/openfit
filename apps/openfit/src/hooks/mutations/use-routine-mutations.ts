import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { MutationSuccessResult, RoutineDto } from "@/lib/api-types";
import { queryKeys } from "@/lib/query-keys";
import { fetchJson } from "@/lib/request-helpers";

type CreateRoutineInput = {
	name: string;
	description?: string;
};
type UpdateRoutineInput = {
	id: string;
	name?: string;
	description?: string;
};
// Create routine
async function createRoutine(input: CreateRoutineInput): Promise<RoutineDto> {
	const response = await fetch("/api/routines", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return fetchJson<RoutineDto>(response, "Failed to create routine");
}
// Update routine
async function updateRoutine({
	id,
	...input
}: UpdateRoutineInput): Promise<RoutineDto> {
	const response = await fetch(`/api/routines/${id}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return fetchJson<RoutineDto>(response, "Failed to update routine");
}
// Delete routine
async function deleteRoutine(id: string): Promise<MutationSuccessResult> {
	const response = await fetch(`/api/routines/${id}`, {
		method: "DELETE",
	});
	return fetchJson<MutationSuccessResult>(response, "Failed to delete routine");
}
export function useCreateRoutine(): UseMutationResult<
	RoutineDto,
	Error,
	CreateRoutineInput
> {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: createRoutine,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.routines.all });
		},
	});
}
export function useUpdateRoutine(): UseMutationResult<
	RoutineDto,
	Error,
	UpdateRoutineInput
> {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: updateRoutine,
		onSuccess: (_data, variables) => {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.routines.detail(variables.id),
			});
			void queryClient.invalidateQueries({
				queryKey: queryKeys.routines.lists(),
			});
		},
	});
}
export function useDeleteRoutine(): UseMutationResult<
	MutationSuccessResult,
	Error,
	string
> {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: deleteRoutine,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.routines.all });
		},
	});
}
