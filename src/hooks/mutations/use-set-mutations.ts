/* eslint-disable typescript-eslint(explicit-module-boundary-types) */

import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type CreateSetInput = {
  setGroupId: string;
  exerciseId: string;
  type?: "NORMAL" | "WARMUP" | "DROPSET" | "FAILURE";
  reps?: number;
  repetitionUnitId?: string;
  weight?: number;
  weightUnitId?: string;
  restTime?: number;
}

type UpdateSetInput = {
  id: string;
  type?: "NORMAL" | "WARMUP" | "DROPSET" | "FAILURE";
  reps?: number;
  repetitionUnitId?: string;
  weight?: number;
  weightUnitId?: string;
  restTime?: number;
  completed?: boolean;
}

type ReorderSetsInput = {
  setGroupId: string;
  setIds: string[];
}

// Create set
async function createSet(input: CreateSetInput) {
  const response = await fetch("/api/sets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create set");
  }
  return response.json();
}

// Update set
async function updateSet({ id, ...input }: UpdateSetInput) {
  const response = await fetch(`/api/sets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update set");
  }
  return response.json();
}

// Delete set
async function deleteSet(id: string) {
  const response = await fetch(`/api/sets/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete set");
  }
  return response.json();
}

// Reorder sets
async function reorderSets(input: ReorderSetsInput) {
  const response = await fetch("/api/sets/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to reorder sets");
  }
  return response.json();
}

export function useCreateSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.routineDays.all });
    },
  });
}

export function useUpdateSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.routineDays.all });
    },
  });
}

export function useDeleteSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.routineDays.all });
    },
  });
}

export function useReorderSets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderSets,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.routineDays.all });
    },
  });
}
