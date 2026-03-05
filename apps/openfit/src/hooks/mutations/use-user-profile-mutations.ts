import { fetchJson } from "@/lib/request-helpers";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
type UpdateUserProfileInput = {
  theme?: "light" | "dark" | "system";
  defaultRepetitionUnitId?: string;
  defaultWeightUnitId?: string;
  defaultGymId?: string | undefined;
};
// Update user profile
async function updateUserProfile(
  input: UpdateUserProfileInput,
): Promise<unknown> {
  const response = await fetch("/api/user-profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return fetchJson<unknown>(response, "Failed to update profile");
}
export function useUpdateUserProfile(): UseMutationResult<
  unknown,
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
async function setDefaultGym(gymId: string): Promise<unknown> {
  return updateUserProfile({ defaultGymId: gymId });
}
export function useSetDefaultGym(): UseMutationResult<unknown, Error, string> {
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
