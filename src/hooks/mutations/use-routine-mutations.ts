/* eslint-disable typescript-eslint(explicit-module-boundary-types) */

import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type CreateRoutineInput = {
  name: string;
  description?: string;
}

type UpdateRoutineInput = {
  id: string;
  name?: string;
  description?: string;
}

// Create routine
async function createRoutine(input: CreateRoutineInput) {
  const response = await fetch("/api/routines", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create routine");
  }
  return response.json();
}

// Update routine
async function updateRoutine({ id, ...input }: UpdateRoutineInput) {
  const response = await fetch(`/api/routines/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update routine");
  }
  return response.json();
}

// Delete routine
async function deleteRoutine(id: string) {
  const response = await fetch(`/api/routines/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete routine");
  }
  return response.json();
}

export function useCreateRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRoutine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routines.all });
    },
  });
}

export function useUpdateRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRoutine,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.routines.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.routines.lists() });
    },
  });
}

export function useDeleteRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRoutine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routines.all });
    },
  });
}
