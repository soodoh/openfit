import { fetchJson } from "@/lib/request-helpers";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
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
async function createGym(input: CreateGymInput): Promise<unknown> {
  const response = await fetch("/api/gyms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return fetchJson<unknown>(response, "Failed to create gym");
}
// Update gym
async function updateGym({ id, ...input }: UpdateGymInput): Promise<unknown> {
  const response = await fetch(`/api/gyms/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return fetchJson<unknown>(response, "Failed to update gym");
}
// Delete gym
async function deleteGym(id: string): Promise<unknown> {
  const response = await fetch(`/api/gyms/${id}`, {
    method: "DELETE",
  });
  return fetchJson<unknown>(response, "Failed to delete gym");
}
export function useCreateGym(): UseMutationResult<
  unknown,
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
  unknown,
  Error,
  UpdateGymInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateGym,
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.gyms.detail(variables.id),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.gyms.list() });
    },
  });
}
export function useDeleteGym(): UseMutationResult<unknown, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteGym,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.gyms.all });
    },
  });
}
