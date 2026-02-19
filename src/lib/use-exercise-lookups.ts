import { useCategories, useEquipment, useMuscleGroups } from "@/hooks";
import { useMemo } from "react";
export function useExerciseLookups(): any {
    const { data: equipment } = useEquipment();
    const { data: muscleGroups } = useMuscleGroups();
    const { data: categories } = useCategories();
    const isLoading = !equipment || !muscleGroups || !categories;
    const equipmentMap = useMemo(() => {
        if (!equipment) {
            return new Map<string, string>();
        }
        return new Map(equipment.map((e) => [e.id, e.name] as const));
    }, [equipment]);
    const muscleGroupMap = useMemo(() => {
        if (!muscleGroups) {
            return new Map<string, string>();
        }
        return new Map(muscleGroups.map((m) => [m.id, m.name] as const));
    }, [muscleGroups]);
    const categoryMap = useMemo(() => {
        if (!categories) {
            return new Map<string, string>();
        }
        return new Map(categories.map((c) => [c.id, c.name] as const));
    }, [categories]);
    const getEquipmentName = (id: string | undefined | undefined): string | undefined => {
        if (!id) {
            return undefined;
        }
        return equipmentMap.get(id);
    };
    const getMuscleGroupName = (id: string): string => {
        return muscleGroupMap.get(id) ?? "";
    };
    const getMuscleGroupNames = (ids: string[] | undefined): string[] => {
        if (!ids) {
            return [];
        }
        return ids.map((id) => muscleGroupMap.get(id) ?? "").filter(Boolean);
    };
    const getCategoryName = (id: string): string => {
        return categoryMap.get(id) ?? "";
    };
    return {
        equipment,
        muscleGroups,
        categories,
        isLoading,
        getEquipmentName,
        getMuscleGroupName,
        getMuscleGroupNames,
        getCategoryName,
    };
}

export default useExerciseLookups;
