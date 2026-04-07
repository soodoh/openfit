import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { GymDto, MutationSuccessResult } from "@/lib/api-types";
import { queryKeys } from "@/lib/query-keys";
import { fetchJson } from "@/lib/request-helpers";

type CreateGymInput = {
	name: string;
	equipmentIds?: string[];
};
type UpdateGymInput = {
	id: string;
	name?: string;
	equipmentIds?: string[];
};
// Create gym
async function createGym(input: CreateGymInput): Promise<GymDto> {
	const response = await fetch("/api/gyms", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return fetchJson<GymDto>(response, "Failed to create gym");
}
// Update gym
async function updateGym({ id, ...input }: UpdateGymInput): Promise<GymDto> {
	const response = await fetch(`/api/gyms/${id}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return fetchJson<GymDto>(response, "Failed to update gym");
}
// Delete gym
async function deleteGym(id: string): Promise<MutationSuccessResult> {
	const response = await fetch(`/api/gyms/${id}`, {
		method: "DELETE",
	});
	return fetchJson<MutationSuccessResult>(response, "Failed to delete gym");
}
export function useCreateGym(): UseMutationResult<
	GymDto,
	Error,
	CreateGymInput
> {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: createGym,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.gyms.all });
		},
	});
}
export function useUpdateGym(): UseMutationResult<
	GymDto,
	Error,
	UpdateGymInput
> {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: updateGym,
		onSuccess: (_data, variables) => {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.gyms.detail(variables.id),
			});
			void queryClient.invalidateQueries({ queryKey: queryKeys.gyms.list() });
		},
	});
}
export function useDeleteGym(): UseMutationResult<
	MutationSuccessResult,
	Error,
	string
> {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: deleteGym,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.gyms.all });
		},
	});
}
