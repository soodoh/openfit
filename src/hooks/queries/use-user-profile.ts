import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
type UserProfile = {
    id: string;
    userId: string;
    role: "USER" | "ADMIN";
    defaultRepetitionUnitId: string | undefined;
    defaultWeightUnitId: string | undefined;
    theme: "light" | "dark" | "system";
    defaultGymId: string | undefined;
    defaultRepetitionUnit: {
        id: string;
        name: string;
    } | undefined;
    defaultWeightUnit: {
        id: string;
        name: string;
    } | undefined;
    defaultGym: {
        id: string;
        name: string;
    } | undefined;
    createdAt: Date;
    updatedAt: Date;
};
// Fetch user profile
async function fetchUserProfile(): Promise<UserProfile | undefined> {
    const response = await fetch("/api/user-profile");
    if (!response.ok) {
        throw new Error("Failed to fetch user profile");
    }
    const data = await response.json();
    return data;
}
// Hook for user profile
export function useUserProfile(): any {
    return useQuery({
        queryKey: queryKeys.userProfile.current(),
        queryFn: fetchUserProfile,
    });
}

export default useUserProfile;
