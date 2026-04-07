import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { MutationSuccessResult, RoutineDayDto } from "@/lib/api-types";
import { queryKeys } from "@/lib/query-keys";
import { fetchJson } from "@/lib/request-helpers";

type CreateRoutineDayInput = {
	routineId: string;
	description: string;
	weekdays?: number[];
};
type UpdateRoutineDayInput = {
	id: string;
	description?: string;
	weekdays?: number[];
};
// Create routine day
async function createRoutineDay(
	input: CreateRoutineDayInput,
): Promise<RoutineDayDto> {
	const response = await fetch("/api/routine-days", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return fetchJson<RoutineDayDto>(response, "Failed to create routine day");
}
// Update routine day
async function updateRoutineDay({
	id,
	...input
}: UpdateRoutineDayInput): Promise<RoutineDayDto> {
	const response = await fetch(`/api/routine-days/${id}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return fetchJson<RoutineDayDto>(response, "Failed to update routine day");
}
// Delete routine day
async function deleteRoutineDay(id: string): Promise<MutationSuccessResult> {
	const response = await fetch(`/api/routine-days/${id}`, {
		method: "DELETE",
	});
	return fetchJson<MutationSuccessResult>(
		response,
		"Failed to delete routine day",
	);
}
export function useCreateRoutineDay(): UseMutationResult<
	RoutineDayDto,
	Error,
	CreateRoutineDayInput
> {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: createRoutineDay,
		onSuccess: (data) => {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.routineDays.all,
			});
			void queryClient.invalidateQueries({
				queryKey: queryKeys.routines.detail(data.routineId),
			});
		},
	});
}
export function useUpdateRoutineDay(): UseMutationResult<
	RoutineDayDto,
	Error,
	UpdateRoutineDayInput
> {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: updateRoutineDay,
		onSuccess: (data, variables) => {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.routineDays.detail(variables.id),
			});
			if (data.routineId) {
				void queryClient.invalidateQueries({
					queryKey: queryKeys.routines.detail(data.routineId),
				});
			}
		},
	});
}
export function useDeleteRoutineDay(): UseMutationResult<
	MutationSuccessResult,
	Error,
	string
> {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: deleteRoutineDay,
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.routineDays.all,
			});
			void queryClient.invalidateQueries({ queryKey: queryKeys.routines.all });
		},
	});
}
