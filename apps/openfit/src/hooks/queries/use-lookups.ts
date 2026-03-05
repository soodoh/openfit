import { fetchJson } from "@/lib/request-helpers";
import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
type Equipment = {
  id: string;
  name: string;
  createdAt: Date;
};
type MuscleGroup = {
  id: string;
  name: string;
  createdAt: Date;
};
type Category = {
  id: string;
  name: string;
  createdAt: Date;
};
type RepetitionUnit = {
  id: string;
  name: string;
  createdAt: Date;
};
type WeightUnit = {
  id: string;
  name: string;
  createdAt: Date;
};
type Units = {
  repetitionUnits: RepetitionUnit[];
  weightUnits: WeightUnit[];
};
// Fetch equipment
async function fetchEquipment(): Promise<Equipment[]> {
  const response = await fetch("/api/lookups/equipment");
  return fetchJson<Equipment[]>(response, "Failed to fetch equipment");
}
// Fetch muscle groups
async function fetchMuscleGroups(): Promise<MuscleGroup[]> {
  const response = await fetch("/api/lookups/muscle-groups");
  return fetchJson<MuscleGroup[]>(response, "Failed to fetch muscle groups");
}
// Fetch categories
async function fetchCategories(): Promise<Category[]> {
  const response = await fetch("/api/lookups/categories");
  return fetchJson<Category[]>(response, "Failed to fetch categories");
}
// Fetch units
async function fetchUnits(): Promise<Units> {
  const response = await fetch("/api/lookups/units");
  return fetchJson<Units>(response, "Failed to fetch units");
}
// Hook for equipment
export function useEquipment(): UseQueryResult<Equipment[]> {
  return useQuery({
    queryKey: queryKeys.lookups.equipment(),
    queryFn: fetchEquipment,
    staleTime: Number.POSITIVE_INFINITY, // Lookup data rarely changes
  });
}
// Hook for muscle groups
export function useMuscleGroups(): UseQueryResult<MuscleGroup[]> {
  return useQuery({
    queryKey: queryKeys.lookups.muscleGroups(),
    queryFn: fetchMuscleGroups,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
// Hook for categories
export function useCategories(): UseQueryResult<Category[]> {
  return useQuery({
    queryKey: queryKeys.lookups.categories(),
    queryFn: fetchCategories,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
// Hook for units
export function useUnits(): UseQueryResult<Units> {
  return useQuery({
    queryKey: queryKeys.lookups.units(),
    queryFn: fetchUnits,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
