import { fetchJson } from "@/lib/request-helpers";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
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
async function updateUserRole({
  id,
  role,
}: UpdateUserRoleInput): Promise<unknown> {
  const response = await fetch(`/api/admin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  return fetchJson<unknown>(response, "Failed to update user role");
}
// Create exercise
async function createExercise(input: CreateExerciseInput): Promise<unknown> {
  const response = await fetch("/api/admin/exercises", {
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
  const response = await fetch(`/api/admin/exercises/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return fetchJson<unknown>(response, "Failed to update exercise");
}
// Delete exercise
async function deleteExercise(id: string): Promise<unknown> {
  const response = await fetch(`/api/admin/exercises/${id}`, {
    method: "DELETE",
  });
  return fetchJson<unknown>(response, "Failed to delete exercise");
}
// Create lookup
async function createLookup({
  type,
  name,
}: CreateLookupInput): Promise<unknown> {
  const response = await fetch("/api/admin/lookups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, name }),
  });
  return fetchJson<unknown>(response, "Failed to create lookup");
}
// Update lookup
async function updateLookup({
  id,
  type,
  name,
}: UpdateLookupInput): Promise<unknown> {
  const response = await fetch(`/api/admin/lookups/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, name }),
  });
  return fetchJson<unknown>(response, "Failed to update lookup");
}
// Delete lookup
async function deleteLookup({ id, type }: DeleteLookupInput): Promise<unknown> {
  const response = await fetch(`/api/admin/lookups/${id}?type=${type}`, {
    method: "DELETE",
  });
  return fetchJson<unknown>(response, "Failed to delete lookup");
}
// Upload file
async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
  const result = await fetchJson<{ path: string }>(
    response,
    "Failed to upload file",
  );
  return result.path;
}
export function useUpdateUserRole(): UseMutationResult<
  unknown,
  Error,
  UpdateUserRoleInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserRole,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
    },
  });
}
export function useAdminCreateExercise(): UseMutationResult<
  unknown,
  Error,
  CreateExerciseInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createExercise,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.exercises(),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all });
    },
  });
}
export function useAdminUpdateExercise(): UseMutationResult<
  unknown,
  Error,
  UpdateExerciseInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateExercise,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.exercises(),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all });
    },
  });
}
export function useAdminDeleteExercise(): UseMutationResult<
  unknown,
  Error,
  string
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteExercise,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.exercises(),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all });
    },
  });
}
export function useCreateLookup(): UseMutationResult<
  unknown,
  Error,
  CreateLookupInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLookup,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.lookups.all });
    },
  });
}
export function useUpdateLookup(): UseMutationResult<
  unknown,
  Error,
  UpdateLookupInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateLookup,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.lookups.all });
    },
  });
}
export function useDeleteLookup(): UseMutationResult<
  unknown,
  Error,
  DeleteLookupInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLookup,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.lookups.all });
    },
  });
}
export function useUploadFile(): UseMutationResult<string, Error, File> {
  return useMutation({
    mutationFn: uploadFile,
  });
}
