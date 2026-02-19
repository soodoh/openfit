import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
async function createSetGroup(input: CreateSetGroupInput) {
  const response = await fetch("/api/set-groups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create set group");
  }
  return response.json();
}
// Update set group
async function updateSetGroup({ id, ...input }: UpdateSetGroupInput) {
  const response = await fetch(`/api/set-groups/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update set group");
  }
  return response.json();
}
// Delete set group
async function deleteSetGroup(id: string) {
  const response = await fetch(`/api/set-groups/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete set group");
  }
  return response.json();
}
// Reorder set groups
async function reorderSetGroups(input: ReorderSetGroupsInput) {
  const response = await fetch("/api/set-groups/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to reorder set groups");
  }
  return response.json();
}
// Replace exercise in set group
async function replaceExercise({ id, exerciseId }: ReplaceExerciseInput) {
  const response = await fetch(`/api/set-groups/${id}/replace-exercise`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ exerciseId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to replace exercise");
  }
  return response.json();
}
// Bulk edit sets in set group
async function bulkEditSetGroup({ id, ...input }: BulkEditInput) {
  const response = await fetch(`/api/set-groups/${id}/bulk-edit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to bulk edit");
  }
  return response.json();
}
export function useCreateSetGroup(): any {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSetGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.routineDays.all });
    },
  });
}
export function useUpdateSetGroup(): any {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSetGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.routineDays.all });
    },
  });
}
export function useDeleteSetGroup(): any {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSetGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.routineDays.all });
    },
  });
}
export function useReorderSetGroups(): any {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderSetGroups,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.routineDays.all });
    },
  });
}
export function useReplaceExercise(): any {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: replaceExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.routineDays.all });
    },
  });
}
export function useBulkEditSetGroup(): any {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkEditSetGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.routineDays.all });
    },
  });
}
