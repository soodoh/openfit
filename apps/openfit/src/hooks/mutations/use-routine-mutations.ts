import { fetchJson } from "@/lib/request-helpers";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
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
async function createRoutine(input: CreateRoutineInput): Promise<unknown> {
  const response = await fetch("/api/routines", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return fetchJson<unknown>(response, "Failed to create routine");
}
// Update routine
async function updateRoutine({
  id,
  ...input
}: UpdateRoutineInput): Promise<unknown> {
  const response = await fetch(`/api/routines/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return fetchJson<unknown>(response, "Failed to update routine");
}
// Delete routine
async function deleteRoutine(id: string): Promise<unknown> {
  const response = await fetch(`/api/routines/${id}`, {
    method: "DELETE",
  });
  return fetchJson<unknown>(response, "Failed to delete routine");
}
export function useCreateRoutine(): UseMutationResult<
  unknown,
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
  unknown,
  Error,
  UpdateRoutineInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRoutine,
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.routines.detail(variables.id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.routines.lists(),
      });
    },
  });
}
export function useDeleteRoutine(): UseMutationResult<unknown, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRoutine,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.routines.all });
    },
  });
}
