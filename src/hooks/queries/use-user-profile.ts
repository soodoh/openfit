/* eslint-disable eslint-plugin-import(prefer-default-export), typescript-eslint(explicit-module-boundary-types), typescript-eslint(no-restricted-types) */

import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";

type UserProfile = {
  id: string;
  userId: string;
  role: "USER" | "ADMIN";
  defaultRepetitionUnitId: string | null;
  defaultWeightUnitId: string | null;
  theme: "light" | "dark" | "system";
  defaultGymId: string | null;
  defaultRepetitionUnit: { id: string; name: string } | null;
  defaultWeightUnit: { id: string; name: string } | null;
  defaultGym: { id: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

// Fetch user profile
async function fetchUserProfile(): Promise<UserProfile | null> {
  const response = await fetch("/api/user-profile");
  if (!response.ok) {throw new Error("Failed to fetch user profile");}
  const data = await response.json();
  return data;
}

// Hook for user profile
export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.userProfile.current(),
    queryFn: fetchUserProfile,
  });
}
