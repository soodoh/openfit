import { fetchJson } from "@/lib/request-helpers";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
type CreateRoutineDayInput = {
  routineId: string;
  description: string;
  weekdays?: number[];
};
type UpdateRoutineDayInput = {
  id: string;
  description?: string;
  weekdays?: number[];
};
// Create routine day
async function createRoutineDay(
  input: CreateRoutineDayInput,
): Promise<unknown> {
  const response = await fetch("/api/routine-days", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return fetchJson<unknown>(response, "Failed to create routine day");
}
// Update routine day
async function updateRoutineDay({
  id,
  ...input
}: UpdateRoutineDayInput): Promise<unknown> {
  const response = await fetch(`/api/routine-days/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return fetchJson<unknown>(response, "Failed to update routine day");
}
// Delete routine day
async function deleteRoutineDay(id: string): Promise<unknown> {
  const response = await fetch(`/api/routine-days/${id}`, {
    method: "DELETE",
  });
  return fetchJson<unknown>(response, "Failed to delete routine day");
}
export function useCreateRoutineDay(): UseMutationResult<
  unknown,
  Error,
  CreateRoutineDayInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRoutineDay,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.routineDays.all,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.routines.detail(
          (data as { routineId: string }).routineId,
        ),
      });
    },
  });
}
export function useUpdateRoutineDay(): UseMutationResult<
  unknown,
  Error,
  UpdateRoutineDayInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRoutineDay,
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.routineDays.detail(variables.id),
      });
      if ((data as { routineId?: string }).routineId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.routines.detail(
            (data as { routineId: string }).routineId,
          ),
        });
      }
    },
  });
}
export function useDeleteRoutineDay(): UseMutationResult<
  unknown,
  Error,
  string
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRoutineDay,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.routineDays.all,
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.routines.all });
    },
  });
}
