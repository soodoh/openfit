import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchJson } from "@/lib/request-helpers";
import type { UserProfileWithDefaults } from "@/lib/types";

// Fetch user profile
async function fetchUserProfile(): Promise<
	UserProfileWithDefaults | undefined
> {
	const response = await fetch("/api/user-profile");
	return fetchJson<UserProfileWithDefaults | undefined>(
		response,
		"Failed to fetch user profile",
	);
}
// Hook for user profile
export function useUserProfile(): UseQueryResult<
	UserProfileWithDefaults | undefined
> {
	return useQuery({
		queryKey: queryKeys.userProfile.current(),
		queryFn: fetchUserProfile,
	});
}

export default useUserProfile;
