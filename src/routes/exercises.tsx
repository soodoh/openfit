/* eslint-disable eslint(complexity), eslint(no-nested-ternary), eslint-plugin-import(prefer-default-export), typescript-eslint(no-use-before-define) */
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
import { Dumbbell, Loader2, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

const LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "expert", label: "Expert" },
] as const;

type Level = (typeof LEVEL_OPTIONS)[number]["value"];

export const Route = createFileRoute("/exercises")({
  component: ExercisesPage,
});

function ExercisesPage() {
  return <ExercisesContent />;
}

function ExercisesContent() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: equipmentOptions = [] } = useEquipment();
  const { data: categoryOptions = [] } = useCategories();
  const { data: muscleOptions = [] } = useMuscleGroups();

  // Filter state
  const [equipmentId, setEquipmentId] = useState<string | undefined>(undefined);
  const [level, setLevel] = useState<Level | undefined>(undefined);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [primaryMuscleId, setPrimaryMuscleId] = useState<string | undefined>(
    undefined,
  );

  const hasFilters =
    equipmentId !== undefined ||
    level !== undefined ||
    categoryId !== undefined ||
    primaryMuscleId !== undefined;

  const clearFilters = () => {
    setEquipmentId(undefined);
    setLevel(undefined);
    setCategoryId(undefined);
    setPrimaryMuscleId(undefined);
  };

  const isSearching = searchQuery.trim().length > 0;

  // Build filter args for infinite query - map filter names to hook expectations
  const filterArgs = useMemo(
    () => ({
      search: isSearching ? searchQuery : undefined,
      equipmentId,
      level: level,
      categoryId,
      primaryMuscleId,
    }),
    [isSearching, searchQuery, equipmentId, level, categoryId, primaryMuscleId],
  );

  // Fetch exercises with infinite query
  const {
    data: exercisesData,
    isLoading: exercisesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useExercises(filterArgs);

  // Flatten infinite query pages into a single array
  const exercises = useMemo(() => {
    if (!exercisesData?.pages) {return [];}
    return exercisesData.pages.flatMap((page) => page.page);
  }, [exercisesData]);

  // Search exercises (when searching) - uses simple query, not infinite
  const { data: searchResults = [], isLoading: searchLoading } =
    useExerciseSearch(isSearching ? searchQuery : "", undefined, 50);

  // Determine which data to use based on search state
  const displayExercises = isSearching ? searchResults : exercises;
  const isLoading = isSearching ? searchLoading : exercisesLoading;
  const listCount = displayExercises.length;

  // Auto-load next page when sentinel is in view
  const { ref: sentinelRef, inView } = useInView();
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !isSearching) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, isSearching, fetchNextPage]);

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header Section */}
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

          {/* Search Bar */}
          <div className="relative mt-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search exercises by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Select
              value={equipmentId ?? ""}
              onValueChange={(value) =>
                setEquipmentId(value === "" ? undefined : value)
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
                setLevel(value === "" ? undefined : (value as Level))
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
                setCategoryId(value === "" ? undefined : value)
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
                setPrimaryMuscleId(value === "" ? undefined : value)
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
                onClick={clearFilters}
                className="h-10 px-3 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-xl) py-8">
        {/* Loading State */}
        {isLoading && <LoadingSkeleton />}

        {/* Empty State */}
        {!isLoading &&
          exercises.length === 0 &&
          !isSearching &&
          !hasFilters && <EmptyState />}

        {/* No Results with Filters */}
        {!isLoading &&
          displayExercises.length === 0 &&
          hasFilters &&
          !isSearching && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground/60" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">
                No exercises found
              </h3>
              <p className="text-muted-foreground text-center text-sm mb-4">
                No exercises match your selected filters
              </p>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          )}

        {/* No Search Results */}
        {!isLoading && searchResults.length === 0 && isSearching && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground/60" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">
              No exercises found
            </h3>
            <p className="text-muted-foreground text-center text-sm">
              No exercises match &quot;{searchQuery}&quot;
              {hasFilters && " with the selected filters"}
            </p>
            {hasFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="mt-4"
              >
                Clear filters
              </Button>
            )}
          </div>
        )}

        {/* Results Count */}
        {displayExercises.length > 0 && (
          <p className="text-sm text-muted-foreground mb-6">
            {listCount} {listCount === 1 ? "exercise" : "exercises"}{" "}
            {isSearching ? "found" : (hasFilters ? "found" : "total")}
          </p>
        )}

        {/* Exercises Grid */}
        {displayExercises.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayExercises.map((exercise) => (
                <ExerciseCard key={exercise.id} exercise={exercise} />
              ))}
            </div>

            {/* Auto-load sentinel */}
            {!isSearching && hasNextPage && (
              <div ref={sentinelRef} className="flex justify-center mt-8">
                {isFetchingNextPage && (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
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

function EmptyState() {
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
