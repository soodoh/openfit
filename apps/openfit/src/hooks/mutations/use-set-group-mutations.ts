import { fetchJson } from "@/lib/request-helpers";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
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
async function createSetGroup(input: CreateSetGroupInput): Promise<unknown> {
  const response = await fetch("/api/set-groups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return fetchJson<unknown>(response, "Failed to create set group");
}
// Update set group
async function updateSetGroup({
  id,
  ...input
}: UpdateSetGroupInput): Promise<unknown> {
  const response = await fetch(`/api/set-groups/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return fetchJson<unknown>(response, "Failed to update set group");
}
// Delete set group
async function deleteSetGroup(id: string): Promise<unknown> {
  const response = await fetch(`/api/set-groups/${id}`, {
    method: "DELETE",
  });
  return fetchJson<unknown>(response, "Failed to delete set group");
}
// Reorder set groups
async function reorderSetGroups(
  input: ReorderSetGroupsInput,
): Promise<unknown> {
  const response = await fetch("/api/set-groups/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return fetchJson<unknown>(response, "Failed to reorder set groups");
}
// Replace exercise in set group
async function replaceExercise({
  id,
  exerciseId,
}: ReplaceExerciseInput): Promise<unknown> {
  const response = await fetch(`/api/set-groups/${id}/replace-exercise`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ exerciseId }),
  });
  return fetchJson<unknown>(response, "Failed to replace exercise");
}
// Bulk edit sets in set group
async function bulkEditSetGroup({
  id,
  ...input
}: BulkEditInput): Promise<unknown> {
  const response = await fetch(`/api/set-groups/${id}/bulk-edit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return fetchJson<unknown>(response, "Failed to bulk edit");
}
export function useCreateSetGroup(): UseMutationResult<
  unknown,
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
  unknown,
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
export function useDeleteSetGroup(): UseMutationResult<unknown, Error, string> {
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
  unknown,
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
  unknown,
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
  unknown,
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
