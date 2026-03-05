import { fetchJson } from "@/lib/request-helpers";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
type CreateSetInput = {
  setGroupId: string;
  exerciseId: string;
  type?: "NORMAL" | "WARMUP" | "DROPSET" | "FAILURE";
  reps?: number;
  repetitionUnitId?: string;
  weight?: number;
  weightUnitId?: string;
  restTime?: number;
};
type UpdateSetInput = {
  id: string;
  type?: "NORMAL" | "WARMUP" | "DROPSET" | "FAILURE";
  reps?: number;
  repetitionUnitId?: string;
  weight?: number;
  weightUnitId?: string;
  restTime?: number;
  completed?: boolean;
};
type ReorderSetsInput = {
  setGroupId: string;
  setIds: string[];
};
// Create set
async function createSet(input: CreateSetInput): Promise<unknown> {
  const response = await fetch("/api/sets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return fetchJson<unknown>(response, "Failed to create set");
}
// Update set
async function updateSet({ id, ...input }: UpdateSetInput): Promise<unknown> {
  const response = await fetch(`/api/sets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return fetchJson<unknown>(response, "Failed to update set");
}
// Delete set
async function deleteSet(id: string): Promise<unknown> {
  const response = await fetch(`/api/sets/${id}`, {
    method: "DELETE",
  });
  return fetchJson<unknown>(response, "Failed to delete set");
}
// Reorder sets
async function reorderSets(input: ReorderSetsInput): Promise<unknown> {
  const response = await fetch("/api/sets/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return fetchJson<unknown>(response, "Failed to reorder sets");
}
export function useCreateSet(): UseMutationResult<
  unknown,
  Error,
  CreateSetInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSet,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.routineDays.all,
      });
    },
  });
}
export function useUpdateSet(): UseMutationResult<
  unknown,
  Error,
  UpdateSetInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSet,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.routineDays.all,
      });
    },
  });
}
export function useDeleteSet(): UseMutationResult<unknown, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSet,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.routineDays.all,
      });
    },
  });
}
export function useReorderSets(): UseMutationResult<
  unknown,
  Error,
  ReorderSetsInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderSets,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.routineDays.all,
      });
    },
  });
}
