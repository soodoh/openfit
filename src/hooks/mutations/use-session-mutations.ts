import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
async function createSession(input: CreateSessionInput) {
    const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create session");
    }
    return response.json();
}
// Update session
async function updateSession({ id, ...input }: UpdateSessionInput) {
    const response = await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update session");
    }
    return response.json();
}
// Delete session
async function deleteSession(id: string) {
    const response = await fetch(`/api/sessions/${id}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete session");
    }
    return response.json();
}
export function useCreateSession(): any {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createSession,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
        },
    });
}
export function useUpdateSession(): any {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateSession,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.sessions.detail(variables.id),
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.sessions.current() });
            queryClient.invalidateQueries({ queryKey: queryKeys.sessions.lists() });
        },
    });
}
export function useDeleteSession(): any {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteSession,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
        },
    });
}
