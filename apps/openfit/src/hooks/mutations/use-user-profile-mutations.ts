import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserProfileDto } from "@/lib/api-types";
import { queryKeys } from "@/lib/query-keys";
import { fetchJson } from "@/lib/request-helpers";

type UpdateUserProfileInput = {
	theme?: "light" | "dark" | "system";
	defaultRepetitionUnitId?: string;
	defaultWeightUnitId?: string;
	defaultGymId?: string | undefined;
};
// Update user profile
async function updateUserProfile(
	input: UpdateUserProfileInput,
): Promise<UserProfileDto> {
	const response = await fetch("/api/user-profile", {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return fetchJson<UserProfileDto>(response, "Failed to update profile");
}
export function useUpdateUserProfile(): UseMutationResult<
	UserProfileDto,
	Error,
	UpdateUserProfileInput
> {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: updateUserProfile,
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.userProfile.all,
			});
		},
	});
}
// Set default gym
async function setDefaultGym(gymId: string): Promise<UserProfileDto> {
	return updateUserProfile({ defaultGymId: gymId });
}
export function useSetDefaultGym(): UseMutationResult<
	UserProfileDto,
	Error,
	string
> {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: setDefaultGym,
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.userProfile.all,
			});
		},
	});
}
