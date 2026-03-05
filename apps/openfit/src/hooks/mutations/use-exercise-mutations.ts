import { fetchJson } from "@/lib/request-helpers";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
type CreateExerciseInput = {
  name: string;
  equipmentId?: string | undefined;
  force?: "push" | "pull" | "static" | undefined;
  level?: "beginner" | "intermediate" | "expert";
  mechanic?: "compound" | "isolation" | undefined;
  categoryId: string;
  primaryMuscleIds?: string[];
  secondaryMuscleIds?: string[];
  instructions?: string[];
};
type UpdateExerciseInput = {
  id: string;
} & Partial<CreateExerciseInput>;
// Create exercise
async function createExercise(input: CreateExerciseInput): Promise<unknown> {
  const response = await fetch("/api/exercises", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return fetchJson<unknown>(response, "Failed to create exercise");
}
// Update exercise
async function updateExercise({
  id,
  ...input
}: UpdateExerciseInput): Promise<unknown> {
  const response = await fetch(`/api/exercises/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return fetchJson<unknown>(response, "Failed to update exercise");
}
// Delete exercise
async function deleteExercise(id: string): Promise<unknown> {
  const response = await fetch(`/api/exercises/${id}`, {
    method: "DELETE",
  });
  return fetchJson<unknown>(response, "Failed to delete exercise");
}
export function useCreateExercise(): UseMutationResult<
  unknown,
  Error,
  CreateExerciseInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createExercise,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all });
    },
  });
}
export function useUpdateExercise(): UseMutationResult<
  unknown,
  Error,
  UpdateExerciseInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateExercise,
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.exercises.detail(variables.id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.exercises.lists(),
      });
    },
  });
}
export function useDeleteExercise(): UseMutationResult<unknown, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteExercise,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all });
    },
  });
}
