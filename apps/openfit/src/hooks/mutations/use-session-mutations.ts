import { fetchJson } from "@/lib/request-helpers";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
type CreateSessionInput = {
  name?: string;
  notes?: string;
  startTime?: number;
  endTime?: number;
  impression?: number;
  templateId?: string;
};
type UpdateSessionInput = {
  id: string;
  name?: string;
  notes?: string;
  impression?: number;
  startTime?: number;
  endTime?: number | undefined;
};
// Create session
async function createSession(input: CreateSessionInput): Promise<unknown> {
  const response = await fetch("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return fetchJson<unknown>(response, "Failed to create session");
}
// Update session
async function updateSession({
  id,
  ...input
}: UpdateSessionInput): Promise<unknown> {
  const response = await fetch(`/api/sessions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return fetchJson<unknown>(response, "Failed to update session");
}
// Delete session
async function deleteSession(id: string): Promise<unknown> {
  const response = await fetch(`/api/sessions/${id}`, {
    method: "DELETE",
  });
  return fetchJson<unknown>(response, "Failed to delete session");
}
export function useCreateSession(): UseMutationResult<
  unknown,
  Error,
  CreateSessionInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSession,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
    },
  });
}
export function useUpdateSession(): UseMutationResult<
  unknown,
  Error,
  UpdateSessionInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSession,
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(variables.id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.current(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.lists(),
      });
    },
  });
}
export function useDeleteSession(): UseMutationResult<unknown, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
    },
  });
}
