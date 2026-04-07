import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
	MutationIdResult,
	MutationSuccessResult,
	UserProfileBaseDto,
} from "@/lib/api-types";
import { queryKeys } from "@/lib/query-keys";
import { fetchJson } from "@/lib/request-helpers";

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
}: UpdateUserRoleInput): Promise<UserProfileBaseDto> {
	const response = await fetch(`/api/admin/users/${id}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ role }),
	});
	return fetchJson<UserProfileBaseDto>(response, "Failed to update user role");
}
// Create exercise
async function createExercise(
	input: CreateExerciseInput,
): Promise<MutationIdResult> {
	const response = await fetch("/api/admin/exercises", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return fetchJson<MutationIdResult>(response, "Failed to create exercise");
}
// Update exercise
async function updateExercise({
	id,
	...input
}: UpdateExerciseInput): Promise<MutationSuccessResult> {
	const response = await fetch(`/api/admin/exercises/${id}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return fetchJson<MutationSuccessResult>(
		response,
		"Failed to update exercise",
	);
}
// Delete exercise
async function deleteExercise(id: string): Promise<MutationSuccessResult> {
	const response = await fetch(`/api/admin/exercises/${id}`, {
		method: "DELETE",
	});
	return fetchJson<MutationSuccessResult>(
		response,
		"Failed to delete exercise",
	);
}
// Create lookup
async function createLookup({
	type,
	name,
}: CreateLookupInput): Promise<MutationIdResult> {
	const response = await fetch("/api/admin/lookups", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ type, name }),
	});
	return fetchJson<MutationIdResult>(response, "Failed to create lookup");
}
// Update lookup
async function updateLookup({
	id,
	type,
	name,
}: UpdateLookupInput): Promise<MutationSuccessResult> {
	const response = await fetch(`/api/admin/lookups/${id}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ type, name }),
	});
	return fetchJson<MutationSuccessResult>(response, "Failed to update lookup");
}
// Delete lookup
async function deleteLookup({
	id,
	type,
}: DeleteLookupInput): Promise<MutationSuccessResult> {
	const response = await fetch(`/api/admin/lookups/${id}?type=${type}`, {
		method: "DELETE",
	});
	return fetchJson<MutationSuccessResult>(response, "Failed to delete lookup");
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
	UserProfileBaseDto,
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
	MutationIdResult,
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
	MutationSuccessResult,
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
	MutationSuccessResult,
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
	MutationIdResult,
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
	MutationSuccessResult,
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
	MutationSuccessResult,
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
