import { fetchJson } from "@/lib/request-helpers";
import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
type Gym = {
  id: string;
  userId: string;
  name: string;
  equipmentIds: string[];
  createdAt: Date;
  updatedAt: Date;
};
// Fetch gyms
async function fetchGyms(): Promise<Gym[]> {
  const response = await fetch("/api/gyms");
  return fetchJson<Gym[]>(response, "Failed to fetch gyms");
}
// Fetch single gym
async function fetchGym(id: string): Promise<Gym | undefined> {
  const response = await fetch(`/api/gyms/${id}`);
  if (response.status === 404) {
    return undefined;
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
export function useGym(
  id: string | undefined,
): UseQueryResult<Gym | undefined> {
  return useQuery({
    queryKey: queryKeys.gyms.detail(id ?? ""),
    queryFn: async () => fetchGym(id!),
    enabled: Boolean(id),
  });
}
