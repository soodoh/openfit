"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ExerciseWithImageUrl } from "@/lib/convex-types";
import { useExerciseLookups } from "@/lib/use-exercise-lookups";
import { Dumbbell } from "lucide-react";
import { useState } from "react";
import { ExerciseDetailModal } from "./ExerciseDetailModal";

// Helper to format display names (capitalize words)
function formatDisplayName(value: string): string {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const ExerciseCard = ({
  exercise,
}: {
  exercise: ExerciseWithImageUrl;
}) => {
  const [showDetail, setShowDetail] = useState(false);
  const { getEquipmentName, getMuscleGroupNames, getCategoryName } =
    useExerciseLookups();

  const categoryName = getCategoryName(exercise.categoryId);
  const equipmentName = getEquipmentName(exercise.equipmentId);
  const primaryMuscleNames = getMuscleGroupNames(exercise.primaryMuscleIds);

  return (
    <>
      <ExerciseDetailModal
        exercise={exercise}
        open={showDetail}
        onClose={() => setShowDetail(false)}
      />

      <button
        onClick={() => setShowDetail(true)}
        className="group text-left w-full"
      >
        <div className="relative h-full rounded-xl border bg-card p-4 transition-all duration-200 hover:shadow-lg hover:border-foreground/20 hover:-translate-y-0.5">
          {/* Header with image and name */}
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="h-12 w-12 rounded-lg shrink-0">
              {exercise.imageUrl ? (
                <AvatarImage
                  src={exercise.imageUrl}
                  alt={exercise.name}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="rounded-lg bg-primary/10">
                <Dumbbell className="h-5 w-5 text-primary/60" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary dark:group-hover:text-white transition-colors">
                {exercise.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDisplayName(categoryName)}
              </p>
            </div>
          </div>

          {/* Primary muscles */}
          {primaryMuscleNames.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {primaryMuscleNames.slice(0, 3).map((muscle) => (
                <Badge
                  key={muscle}
                  variant="secondary"
                  className="text-xs px-2 py-0.5"
                >
                  {formatDisplayName(muscle)}
                </Badge>
              ))}
              {primaryMuscleNames.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  +{primaryMuscleNames.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Footer info */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {equipmentName && <span>{formatDisplayName(equipmentName)}</span>}
            {exercise.level && (
              <>
                {equipmentName && <span>•</span>}
                <span>{formatDisplayName(exercise.level)}</span>
              </>
            )}
          </div>
        </div>
      </button>
    </>
  );
};
