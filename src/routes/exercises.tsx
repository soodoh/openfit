import { ExerciseCard } from "@/components/exercises/exercise-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCategories,
  useEquipment,
  useExercises,
  useExerciseSearch,
  useInView,
  useMuscleGroups,
} from "@/hooks";
import type { ExerciseWithImageUrl } from "@/lib/types";
import { createFileRoute } from "@tanstack/react-router";
import { Dumbbell, Loader2, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "expert", label: "Expert" },
] as const;

type Level = (typeof LEVEL_OPTIONS)[number]["value"];

type FiltersProps = {
  equipmentId: string | undefined;
  level: Level | undefined;
  categoryId: string | undefined;
  primaryMuscleId: string | undefined;
  equipmentOptions: Array<{ id: string; name: string }>;
  categoryOptions: Array<{ id: string; name: string }>;
  muscleOptions: Array<{ id: string; name: string }>;
  hasFilters: boolean;
  onEquipmentChange: (value: string | undefined) => void;
  onLevelChange: (value: Level | undefined) => void;
  onCategoryChange: (value: string | undefined) => void;
  onPrimaryMuscleChange: (value: string | undefined) => void;
  onClearFilters: () => void;
};

function LoadingSkeleton(): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div
          key={i}
          className="h-48 rounded-xl bg-linear-to-br from-muted/50 to-muted/30 animate-pulse"
        />
      ))}
    </div>
  );
}

function EmptyState(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-linear-to-br from-primary/10 to-accent/20 flex items-center justify-center mb-6">
        <Dumbbell className="w-10 h-10 text-primary/60" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        No exercises available
      </h3>
      <p className="text-muted-foreground text-center max-w-md">
        Exercise library is empty. Contact your administrator to seed the
        exercise database.
      </p>
    </div>
  );
}

function NoResults({
  title,
  description,
  showClear,
  onClear,
}: {
  title: string;
  description: React.ReactNode;
  showClear: boolean;
  onClear: () => void;
}): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <Search className="w-8 h-8 text-muted-foreground/60" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
      <p className="text-muted-foreground text-center text-sm">{description}</p>
      {showClear && (
        <Button variant="outline" size="sm" onClick={onClear} className="mt-4">
          Clear filters
        </Button>
      )}
    </div>
  );
}

function ExercisesFilters({
  equipmentId,
  level,
  categoryId,
  primaryMuscleId,
  equipmentOptions,
  categoryOptions,
  muscleOptions,
  hasFilters,
  onEquipmentChange,
  onLevelChange,
  onCategoryChange,
  onPrimaryMuscleChange,
  onClearFilters,
}: FiltersProps): React.JSX.Element {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <Select
        value={equipmentId ?? ""}
        onValueChange={(value) =>
          onEquipmentChange(value === "" ? undefined : value)
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Equipment" />
        </SelectTrigger>
        <SelectContent>
          {equipmentOptions.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={level ?? ""}
        onValueChange={(value) =>
          onLevelChange(value === "" ? undefined : (value as Level))
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Level" />
        </SelectTrigger>
        <SelectContent>
          {LEVEL_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={categoryId ?? ""}
        onValueChange={(value) =>
          onCategoryChange(value === "" ? undefined : value)
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {categoryOptions.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={primaryMuscleId ?? ""}
        onValueChange={(value) =>
          onPrimaryMuscleChange(value === "" ? undefined : value)
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Muscle" />
        </SelectTrigger>
        <SelectContent>
          {muscleOptions.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-10 px-3 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Clear filters
        </Button>
      )}
    </div>
  );
}

function getResultsSuffix(isSearching: boolean, hasFilters: boolean): string {
  if (isSearching || hasFilters) {
    return "found";
  }
  return "total";
}

function ExercisesBody({
  isLoading,
  exercises,
  searchResults,
  displayExercises,
  isSearching,
  hasFilters,
  searchQuery,
  hasNextPage,
  isFetchingNextPage,
  sentinelRef,
  onClearFilters,
}: {
  isLoading: boolean;
  exercises: ExerciseWithImageUrl[];
  searchResults: ExerciseWithImageUrl[];
  displayExercises: ExerciseWithImageUrl[];
  isSearching: boolean;
  hasFilters: boolean;
  searchQuery: string;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  sentinelRef: React.RefCallback<HTMLElement>;
  onClearFilters: () => void;
}): React.JSX.Element {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!isSearching && !hasFilters && exercises.length === 0) {
    return <EmptyState />;
  }

  if (!isSearching && hasFilters && displayExercises.length === 0) {
    return (
      <NoResults
        title="No exercises found"
        description="No exercises match your selected filters"
        showClear
        onClear={onClearFilters}
      />
    );
  }

  if (isSearching && searchResults.length === 0) {
    return (
      <NoResults
        title="No exercises found"
        description={
          <>
            No exercises match &quot;{searchQuery}&quot;
            {hasFilters && " with the selected filters"}
          </>
        }
        showClear={hasFilters}
        onClear={onClearFilters}
      />
    );
  }

  const listCount = displayExercises.length;
  const suffix = getResultsSuffix(isSearching, hasFilters);

  return (
    <>
      {listCount > 0 && (
        <p className="text-sm text-muted-foreground mb-6">
          {listCount} {listCount === 1 ? "exercise" : "exercises"} {suffix}
        </p>
      )}

      {listCount > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayExercises.map((exercise) => (
              <ExerciseCard key={exercise.id} exercise={exercise} />
            ))}
          </div>

          {!isSearching && hasNextPage && (
            <div ref={sentinelRef} className="flex justify-center mt-8">
              {isFetchingNextPage && (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}

function ExercisesContent(): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState("");
  const [equipmentId, setEquipmentId] = useState<string | undefined>(undefined);
  const [level, setLevel] = useState<Level | undefined>(undefined);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [primaryMuscleId, setPrimaryMuscleId] = useState<string | undefined>(
    undefined,
  );

  const { data: equipmentOptions = [] } = useEquipment();
  const { data: categoryOptions = [] } = useCategories();
  const { data: muscleOptions = [] } = useMuscleGroups();

  const hasFilters =
    equipmentId !== undefined ||
    level !== undefined ||
    categoryId !== undefined ||
    primaryMuscleId !== undefined;
  const isSearching = searchQuery.trim().length > 0;

  const filterArgs = useMemo(
    () => ({
      search: isSearching ? searchQuery : undefined,
      equipmentId,
      level,
      categoryId,
      primaryMuscleId,
    }),
    [categoryId, equipmentId, isSearching, level, primaryMuscleId, searchQuery],
  );

  const {
    data: exercisesData,
    isLoading: exercisesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useExercises(filterArgs);

  const exercises = useMemo(() => {
    if (!exercisesData?.pages) {
      return [];
    }
    return exercisesData.pages.flatMap((page) => page.page);
  }, [exercisesData]);

  const { data: searchResults = [], isLoading: searchLoading } =
    useExerciseSearch(isSearching ? searchQuery : "", undefined, 50);

  const displayExercises = isSearching ? searchResults : exercises;
  const isLoading = isSearching ? searchLoading : exercisesLoading;
  const { ref: sentinelRef, inView } = useInView();

  const clearFilters = () => {
    setEquipmentId(undefined);
    setLevel(undefined);
    setCategoryId(undefined);
    setPrimaryMuscleId(undefined);
  };

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !isSearching) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, inView, isFetchingNextPage, isSearching]);

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="border-b border-border/50 bg-linear-to-b from-accent/5 to-transparent">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-xl) py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Exercises
              </h1>
              <p className="text-muted-foreground mt-1">
                Browse and discover exercises for your workouts
              </p>
            </div>
          </div>

          <div className="relative mt-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search exercises by name..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-10"
            />
          </div>

          <ExercisesFilters
            equipmentId={equipmentId}
            level={level}
            categoryId={categoryId}
            primaryMuscleId={primaryMuscleId}
            equipmentOptions={equipmentOptions}
            categoryOptions={categoryOptions}
            muscleOptions={muscleOptions}
            hasFilters={hasFilters}
            onEquipmentChange={setEquipmentId}
            onLevelChange={setLevel}
            onCategoryChange={setCategoryId}
            onPrimaryMuscleChange={setPrimaryMuscleId}
            onClearFilters={clearFilters}
          />
        </div>
      </div>

      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-xl) py-8">
        <ExercisesBody
          isLoading={isLoading}
          exercises={exercises}
          searchResults={searchResults}
          displayExercises={displayExercises}
          isSearching={isSearching}
          hasFilters={hasFilters}
          searchQuery={searchQuery}
          hasNextPage={Boolean(hasNextPage)}
          isFetchingNextPage={isFetchingNextPage}
          sentinelRef={sentinelRef}
          onClearFilters={clearFilters}
        />
      </div>
    </div>
  );
}

function ExercisesPage(): React.JSX.Element {
  return <ExercisesContent />;
}

export const Route = createFileRoute("/exercises")({
  component: ExercisesPage,
});

export default Route;
