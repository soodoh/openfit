import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselDots, CarouselItem, CarouselNext, CarouselPrevious, } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { useExercise } from "@/hooks";
import type { Exercise, ExerciseWithImageUrl } from "@/lib/types";
import { useExerciseLookups } from "@/lib/use-exercise-lookups";
import { Image } from "@unpic/react";
import { Dumbbell, Flame, Gauge, Settings2, Target } from "lucide-react";

type MinimalExercise = {
  id: string;
  name: string;
  imageUrl?: string | undefined;
};

function formatDisplayName(value: string): string {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getFirstImageUrl(
  imageUrls: string[],
  exerciseImageUrl: string | undefined,
  fallbackImageUrl: string | undefined,
): string | undefined {
  return imageUrls[0] ?? exerciseImageUrl ?? fallbackImageUrl;
}

function getFallbackImageUrl(
  exercise: Exercise | ExerciseWithImageUrl | MinimalExercise,
): string | undefined {
  if ("imageUrl" in exercise) {
    return exercise.imageUrl;
  }
  return undefined;
}

function ExerciseHeader({
  firstImageUrl,
  displayName,
  categoryName,
}: {
  firstImageUrl: string | undefined;
  displayName: string;
  categoryName: string;
}): React.JSX.Element {
  return (
    <DialogHeader className="px-6 pt-6 pb-4 bg-linear-to-br from-accent/10 via-transparent to-primary/5 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl shrink-0 overflow-hidden bg-primary/10 dark:bg-foreground/10 flex items-center justify-center">
          {firstImageUrl ? (
            <Image
              src={firstImageUrl}
              alt={displayName}
              width={48}
              height={48}
              layout="fixed"
              className="object-cover"
            />
          ) : (
            <Dumbbell className="h-6 w-6 text-primary dark:text-foreground" />
          )}
        </div>
        <div className="min-w-0">
          <DialogTitle className="text-xl leading-tight">{displayName}</DialogTitle>
          <DialogDescription className="text-sm">
            {formatDisplayName(categoryName)}
          </DialogDescription>
        </div>
      </div>
    </DialogHeader>
  );
}

function ExerciseGallery({
  imageUrls,
  displayName,
}: {
  imageUrls: string[];
  displayName: string;
}): React.JSX.Element | undefined {
  if (imageUrls.length === 0) {
    return undefined;
  }
  const hasMultipleImages = imageUrls.length > 1;
  return (
    <Carousel className="w-full">
      <div className="relative">
        <CarouselContent className="ml-0">
          {imageUrls.map((url, index) => (
            <CarouselItem key={url} className="pl-0">
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <Image
                  src={url}
                  alt={`${displayName} - image ${index + 1}`}
                  layout="fullWidth"
                  aspectRatio={16 / 9}
                  className="object-contain"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {hasMultipleImages && (
          <>
            <CarouselPrevious className="left-2 bg-background/80 hover:bg-background border-0 shadow-md" />
            <CarouselNext className="right-2 bg-background/80 hover:bg-background border-0 shadow-md" />
          </>
        )}
      </div>
      {hasMultipleImages && <CarouselDots className="mt-3" />}
    </Carousel>
  );
}

function ExerciseQuickInfo({
  level,
  equipmentName,
  force,
  mechanic,
}: {
  level: string | undefined;
  equipmentName: string | undefined;
  force: string | undefined;
  mechanic: string | undefined;
}): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-3">
      {level && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <Gauge className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Level</p>
            <p className="text-sm font-medium">{formatDisplayName(level)}</p>
          </div>
        </div>
      )}
      {equipmentName && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Equipment</p>
            <p className="text-sm font-medium">{formatDisplayName(equipmentName)}</p>
          </div>
        </div>
      )}
      {force && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <Flame className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Force</p>
            <p className="text-sm font-medium">{formatDisplayName(force)}</p>
          </div>
        </div>
      )}
      {mechanic && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <Target className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Mechanic</p>
            <p className="text-sm font-medium">{formatDisplayName(mechanic)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ExerciseMuscles({
  primaryMuscleNames,
  secondaryMuscleNames,
}: {
  primaryMuscleNames: string[];
  secondaryMuscleNames: string[];
}): React.JSX.Element | undefined {
  if (primaryMuscleNames.length === 0 && secondaryMuscleNames.length === 0) {
    return undefined;
  }
  return (
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
  );
}

function ExerciseInstructions({
  instructions,
}: {
  instructions: string[];
}): React.JSX.Element | undefined {
  if (instructions.length === 0) {
    return undefined;
  }
  return (
    <div>
      <h4 className="text-sm font-medium mb-3">Instructions</h4>
      <ol className="space-y-2">
        {instructions.map((instruction, index) => (
          <li key={instruction} className="flex gap-3 text-sm">
            <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 dark:bg-foreground/10 text-primary dark:text-foreground text-xs font-medium flex items-center justify-center">
              {index + 1}
            </span>
            <span className="text-muted-foreground pt-0.5">{instruction}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export const ExerciseDetailModal = ({
  exercise: exerciseProp,
  open,
  onClose,
}: {
  exercise: Exercise | ExerciseWithImageUrl | MinimalExercise;
  open: boolean;
  onClose: () => void;
}): any => {
  const { data: exerciseWithImages } = useExercise(open ? exerciseProp.id : undefined);
  const exercise = exerciseWithImages ?? undefined;
  const displayName = exercise?.name ?? exerciseProp.name;
  const imageUrls = (exercise?.imageUrls ?? []).filter((url): url is string => url !== undefined);
  const fallbackImageUrl = getFallbackImageUrl(exerciseProp);
  const firstImageUrl = getFirstImageUrl(imageUrls, exercise?.imageUrl, fallbackImageUrl);

  const { getEquipmentName, getMuscleGroupNames, getCategoryName } = useExerciseLookups();
  const categoryName = getCategoryName(exercise?.categoryId ?? "");
  const equipmentName = getEquipmentName(exercise?.equipmentId);
  const primaryMuscleNames = getMuscleGroupNames(exercise?.primaryMuscleIds);
  const secondaryMuscleNames = getMuscleGroupNames(exercise?.secondaryMuscleIds);
  const instructions = exercise?.instructions ?? [];

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <ExerciseHeader
          firstImageUrl={firstImageUrl}
          displayName={displayName}
          categoryName={categoryName}
        />
        <div className="px-6 py-5 space-y-6 overflow-y-auto flex-1">
          <ExerciseGallery imageUrls={imageUrls} displayName={displayName} />
          <ExerciseQuickInfo
            level={exercise?.level}
            equipmentName={equipmentName}
            force={exercise?.force ?? undefined}
            mechanic={exercise?.mechanic ?? undefined}
          />
          <ExerciseMuscles
            primaryMuscleNames={primaryMuscleNames}
            secondaryMuscleNames={secondaryMuscleNames}
          />
          <ExerciseInstructions instructions={instructions} />
        </div>
        <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border/50 shrink-0">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseDetailModal;
