"use client";

import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UpdateUserProfileInput {
  theme?: "light" | "dark" | "system";
  defaultRepetitionUnitId?: string;
  defaultWeightUnitId?: string;
  defaultGymId?: string | null;
}

// Update user profile
async function updateUserProfile(input: UpdateUserProfileInput) {
  const response = await fetch("/api/user-profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update profile");
  }
  return response.json();
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile.all });
    },
  });
}

// Set default gym
async function setDefaultGym(gymId: string) {
  return updateUserProfile({ defaultGymId: gymId });
}

export function useSetDefaultGym() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setDefaultGym,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile.all });
    },
  });
}
