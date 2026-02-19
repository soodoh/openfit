import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
type UpdateUserRoleInput = {
    id: string;
    role: "USER" | "ADMIN";
};
type CreateExerciseInput = {
    name: string;
    level: "beginner" | "intermediate" | "expert";
    force?: "push" | "pull" | "static" | undefined;
    mechanic?: "compound" | "isolation" | undefined;
    equipmentId?: string;
    categoryId: string;
    primaryMuscleIds: string[];
    secondaryMuscleIds: string[];
    instructions: string[];
    imageUrls: string[];
};
type UpdateExerciseInput = {
    id: string;
} & CreateExerciseInput;
type CreateLookupInput = {
    type: string;
    name: string;
};
type UpdateLookupInput = {
    id: string;
    type: string;
    name: string;
};
type DeleteLookupInput = {
    id: string;
    type: string;
};
// Update user role
async function updateUserRole({ id, role }: UpdateUserRoleInput) {
    const response = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user role");
    }
    return response.json();
}
// Create exercise
async function createExercise(input: CreateExerciseInput) {
    const response = await fetch("/api/admin/exercises", {
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
    const response = await fetch(`/api/admin/exercises/${id}`, {
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
    const response = await fetch(`/api/admin/exercises/${id}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete exercise");
    }
    return response.json();
}
// Create lookup
async function createLookup({ type, name }: CreateLookupInput) {
    const response = await fetch("/api/admin/lookups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, name }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create lookup");
    }
    return response.json();
}
// Update lookup
async function updateLookup({ id, type, name }: UpdateLookupInput) {
    const response = await fetch(`/api/admin/lookups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, name }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update lookup");
    }
    return response.json();
}
// Delete lookup
async function deleteLookup({ id, type }: DeleteLookupInput) {
    const response = await fetch(`/api/admin/lookups/${id}?type=${type}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete lookup");
    }
    return response.json();
}
// Upload file
async function uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload file");
    }
    const result = await response.json();
    return result.path;
}
export function useUpdateUserRole(): any {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateUserRole,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
        },
    });
}
export function useAdminCreateExercise(): any {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createExercise,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.exercises() });
            queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all });
        },
    });
}
export function useAdminUpdateExercise(): any {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateExercise,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.exercises() });
            queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all });
        },
    });
}
export function useAdminDeleteExercise(): any {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteExercise,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.exercises() });
            queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all });
        },
    });
}
export function useCreateLookup(): any {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createLookup,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.lookups.all });
        },
    });
}
export function useUpdateLookup(): any {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateLookup,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.lookups.all });
        },
    });
}
export function useDeleteLookup(): any {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteLookup,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.lookups.all });
        },
    });
}
export function useUploadFile(): any {
    return useMutation({
        mutationFn: uploadFile,
    });
}
