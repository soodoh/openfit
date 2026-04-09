import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchJson } from "@/lib/request-helpers";
import type { Gym } from "@/lib/types";

// Fetch gyms
async function fetchGyms(): Promise<Gym[]> {
	const response = await fetch("/api/gyms");
	return fetchJson<Gym[]>(response, "Failed to fetch gyms");
}
// Fetch single gym
async function fetchGym(id: string): Promise<Gym> {
	const response = await fetch(`/api/gyms/${id}`);
	if (response.status === 404) {
		throw new Error("Gym not found");
	}
	return fetchJson<Gym>(response, "Failed to fetch gym");
}
// Hook for all gyms
export function useGyms(): UseQueryResult<Gym[]> {
	return useQuery({
		queryKey: queryKeys.gyms.list(),
		queryFn: fetchGyms,
	});
}
// Hook for single gym
export function useGym(id: string | undefined): UseQueryResult<Gym> {
	return useQuery({
		queryKey: queryKeys.gyms.detail(id ?? ""),
		queryFn: async () => fetchGym(id!),
		enabled: Boolean(id),
	});
}
