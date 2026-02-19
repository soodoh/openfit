
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CreateRoutineDayInput {
  routineId: string;
  description: string;
  weekdays?: number[];
}

interface UpdateRoutineDayInput {
  id: string;
  description?: string;
  weekdays?: number[];
}

// Create routine day
async function createRoutineDay(input: CreateRoutineDayInput) {
  const response = await fetch("/api/routine-days", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create routine day");
  }
  return response.json();
}

// Update routine day
async function updateRoutineDay({ id, ...input }: UpdateRoutineDayInput) {
  const response = await fetch(`/api/routine-days/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update routine day");
  }
  return response.json();
}

// Delete routine day
async function deleteRoutineDay(id: string) {
  const response = await fetch(`/api/routine-days/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete routine day");
  }
  return response.json();
}

export function useCreateRoutineDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRoutineDay,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routineDays.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.routines.detail(data.routineId),
      });
    },
  });
}

export function useUpdateRoutineDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRoutineDay,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.routineDays.detail(variables.id),
      });
      if (data.routineId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.routines.detail(data.routineId),
        });
      }
    },
  });
}

export function useDeleteRoutineDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRoutineDay,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routineDays.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.routines.all });
    },
  });
}
