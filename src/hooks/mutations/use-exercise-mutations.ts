/* eslint-disable typescript-eslint(explicit-module-boundary-types), typescript-eslint(no-restricted-types) */

import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type CreateExerciseInput = {
  name: string;
  equipmentId?: string | null;
  force?: "push" | "pull" | "static" | null;
  level?: "beginner" | "intermediate" | "expert";
  mechanic?: "compound" | "isolation" | null;
  categoryId: string;
  primaryMuscleIds?: string[];
  secondaryMuscleIds?: string[];
  instructions?: string[];
}

type UpdateExerciseInput = {
  id: string;
} & Partial<CreateExerciseInput>

// Create exercise
async function createExercise(input: CreateExerciseInput) {
  const response = await fetch("/api/exercises", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create exercise");
  }
  return response.json();
}

// Update exercise
async function updateExercise({ id, ...input }: UpdateExerciseInput) {
  const response = await fetch(`/api/exercises/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update exercise");
  }
  return response.json();
}

// Delete exercise
async function deleteExercise(id: string) {
  const response = await fetch(`/api/exercises/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete exercise");
  }
  return response.json();
}

export function useCreateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all });
    },
  });
}

export function useUpdateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateExercise,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.exercises.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.exercises.lists() });
    },
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all });
    },
  });
}
