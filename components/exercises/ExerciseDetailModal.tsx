"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/convex/_generated/api";
import { Exercise, ExerciseWithImageUrl } from "@/lib/convex-types";
import { useExerciseLookups } from "@/lib/use-exercise-lookups";
import { useQuery } from "convex/react";
import { Dumbbell, Flame, Gauge, Settings2, Target } from "lucide-react";
import Image from "next/image";

// Helper to format display names (capitalize words)
function formatDisplayName(value: string): string {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const ExerciseDetailModal = ({
  exercise: exerciseProp,
  open,
  onClose,
}: {
  exercise: Exercise | ExerciseWithImageUrl;
  open: boolean;
  onClose: () => void;
}) => {
  // Fetch full exercise with image URLs when modal is open
  const exerciseWithImages = useQuery(
    api.queries.exercises.get,
    open ? { id: exerciseProp._id } : "skip",
  );

  // Use fetched data if available, otherwise use prop
  const exercise = exerciseWithImages || exerciseProp;

  // Get image URLs safely
  const imageUrls: (string | null)[] = exerciseWithImages?.imageUrls || [];
  const firstImageUrl: string | null =
    imageUrls[0] ||
    ("imageUrl" in exerciseProp
      ? (exerciseProp.imageUrl as string | null)
      : null);
  const { getEquipmentName, getMuscleGroupNames, getCategoryName } =
    useExerciseLookups();

  const categoryName = getCategoryName(exercise.categoryId);
  const equipmentName = getEquipmentName(exercise.equipmentId);
  const primaryMuscleNames = getMuscleGroupNames(exercise.primaryMuscleIds);
  const secondaryMuscleNames = getMuscleGroupNames(exercise.secondaryMuscleIds);

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header with gradient */}
        <DialogHeader className="px-6 pt-6 pb-4 bg-linear-to-br from-accent/10 via-transparent to-primary/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl shrink-0 overflow-hidden bg-primary/10 dark:bg-foreground/10 flex items-center justify-center">
              {firstImageUrl ? (
                <Image
                  src={firstImageUrl}
                  alt={exercise.name}
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                />
              ) : (
                <Dumbbell className="h-6 w-6 text-primary dark:text-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-xl leading-tight">
                {exercise.name}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {formatDisplayName(categoryName)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="px-6 py-5 space-y-6 overflow-y-auto flex-1">
          {/* Image Gallery */}
          {imageUrls.filter(Boolean).length > 0 && (
            <Carousel opts={{ loop: true }} className="w-full">
              <div className="relative">
                <CarouselContent className="ml-0">
                  {imageUrls
                    .filter((url): url is string => url !== null)
                    .map((url, index) => (
                      <CarouselItem key={index} className="pl-0">
                        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                          <Image
                            src={url}
                            alt={`${exercise.name} - image ${index + 1}`}
                            fill
                            className="object-contain"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                </CarouselContent>
                {imageUrls.filter(Boolean).length > 1 && (
                  <>
                    <CarouselPrevious className="left-2 bg-background/80 hover:bg-background border-0 shadow-md" />
                    <CarouselNext className="right-2 bg-background/80 hover:bg-background border-0 shadow-md" />
                  </>
                )}
              </div>
              {imageUrls.filter(Boolean).length > 1 && (
                <CarouselDots className="mt-3" />
              )}
            </Carousel>
          )}

          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-3">
            {exercise.level && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Level</p>
                  <p className="text-sm font-medium">
                    {formatDisplayName(exercise.level)}
                  </p>
                </div>
              </div>
            )}
            {equipmentName && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Equipment</p>
                  <p className="text-sm font-medium">
                    {formatDisplayName(equipmentName)}
                  </p>
                </div>
              </div>
            )}
            {exercise.force && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Flame className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Force</p>
                  <p className="text-sm font-medium">
                    {formatDisplayName(exercise.force)}
                  </p>
                </div>
              </div>
            )}
            {exercise.mechanic && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Target className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Mechanic</p>
                  <p className="text-sm font-medium">
                    {formatDisplayName(exercise.mechanic)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Muscles */}
          <div className="space-y-4">
            {primaryMuscleNames.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Primary Muscles</h4>
                <div className="flex flex-wrap gap-2">
                  {primaryMuscleNames.map((muscle) => (
                    <Badge key={muscle} variant="default" className="text-xs">
                      {formatDisplayName(muscle)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {secondaryMuscleNames.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Secondary Muscles</h4>
                <div className="flex flex-wrap gap-2">
                  {secondaryMuscleNames.map((muscle) => (
                    <Badge key={muscle} variant="secondary" className="text-xs">
                      {formatDisplayName(muscle)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          {exercise.instructions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Instructions</h4>
              <ol className="space-y-2">
                {exercise.instructions.map((instruction, index) => (
                  <li key={index} className="flex gap-3 text-sm">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 dark:bg-foreground/10 text-primary dark:text-foreground text-xs font-medium flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground pt-0.5">
                      {instruction}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border/50 shrink-0">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
