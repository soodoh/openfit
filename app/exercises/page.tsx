"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { ExerciseCard } from "@/components/exercises/ExerciseCard";
import { GymFilterDropdown } from "@/components/gyms/GymFilterDropdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { usePaginatedQuery, useQuery } from "convex/react";
import { Dumbbell, Loader2, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Filter options
const EQUIPMENT_OPTIONS = [
  { value: "body_only", label: "Body Only" },
  { value: "machine", label: "Machine" },
  { value: "cable", label: "Cable" },
  { value: "foam_roll", label: "Foam Roll" },
  { value: "dumbbell", label: "Dumbbell" },
  { value: "barbell", label: "Barbell" },
  { value: "ez_curl_bar", label: "EZ Curl Bar" },
  { value: "kettlebells", label: "Kettlebells" },
  { value: "medicine_ball", label: "Medicine Ball" },
  { value: "exercise_ball", label: "Exercise Ball" },
  { value: "bands", label: "Bands" },
  { value: "other", label: "Other" },
] as const;

const LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "expert", label: "Expert" },
] as const;

const CATEGORY_OPTIONS = [
  { value: "strength", label: "Strength" },
  { value: "cardio", label: "Cardio" },
  { value: "stretching", label: "Stretching" },
  { value: "plyometrics", label: "Plyometrics" },
  { value: "powerlifting", label: "Powerlifting" },
  { value: "strongman", label: "Strongman" },
  { value: "olympic_weightlifting", label: "Olympic Weightlifting" },
] as const;

const MUSCLE_OPTIONS = [
  { value: "abdominals", label: "Abdominals" },
  { value: "chest", label: "Chest" },
  { value: "quadriceps", label: "Quadriceps" },
  { value: "hamstrings", label: "Hamstrings" },
  { value: "glutes", label: "Glutes" },
  { value: "adductors", label: "Adductors" },
  { value: "abductors", label: "Abductors" },
  { value: "calves", label: "Calves" },
  { value: "forearms", label: "Forearms" },
  { value: "shoulders", label: "Shoulders" },
  { value: "biceps", label: "Biceps" },
  { value: "triceps", label: "Triceps" },
  { value: "traps", label: "Traps" },
  { value: "lats", label: "Lats" },
  { value: "middle_back", label: "Middle Back" },
  { value: "lower_back", label: "Lower Back" },
  { value: "neck", label: "Neck" },
] as const;

type Equipment = (typeof EQUIPMENT_OPTIONS)[number]["value"];
type Level = (typeof LEVEL_OPTIONS)[number]["value"];
type Category = (typeof CATEGORY_OPTIONS)[number]["value"];
type Muscle = (typeof MUSCLE_OPTIONS)[number]["value"];

const EXERCISES_PAGE_SIZE = 24;

export default function Exercises() {
  return (
    <AuthGuard>
      <ExercisesContent />
    </AuthGuard>
  );
}

function ExercisesContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [equipment, setEquipment] = useState<Equipment | undefined>(undefined);
  const [level, setLevel] = useState<Level | undefined>(undefined);
  const [category, setCategory] = useState<Category | undefined>(undefined);
  const [primaryMuscle, setPrimaryMuscle] = useState<Muscle | undefined>(
    undefined,
  );

  // Gym filter state
  const [selectedGymId, setSelectedGymId] = useState<Id<"gyms"> | null>(null);
  const [gymInitialized, setGymInitialized] = useState(false);

  // Fetch user profile for default gym
  const userProfile = useQuery(api.queries.userProfiles.getCurrent);

  // Initialize selected gym from user's default
  useEffect(() => {
    if (userProfile && !gymInitialized) {
      setSelectedGymId(userProfile.profile?.defaultGymId ?? null);
      setGymInitialized(true);
    }
  }, [userProfile, gymInitialized]);

  // Fetch user gyms for dropdown
  const userGyms = useQuery(api.queries.gyms.list);

  // Fetch selected gym's equipment
  const selectedGym = useQuery(
    api.queries.gyms.get,
    selectedGymId ? { id: selectedGymId } : "skip"
  );

  // Handle gym filter change
  const handleGymChange = (gymId: Id<"gyms"> | null) => {
    setSelectedGymId(gymId);
  };

  const hasFilters =
    equipment !== undefined ||
    level !== undefined ||
    category !== undefined ||
    primaryMuscle !== undefined;

  const clearFilters = () => {
    setEquipment(undefined);
    setLevel(undefined);
    setCategory(undefined);
    setPrimaryMuscle(undefined);
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isSearching = debouncedSearch.trim().length > 0;

  // Build filter args for queries (including gym equipment filter)
  const filterArgs = {
    equipment,
    level,
    category,
    primaryMuscle,
    equipmentIds: selectedGym?.equipmentIds,
  };

  // Get count of exercises with filters applied (for browse mode)
  const listCount = useQuery(api.queries.exercises.listCount, filterArgs);

  // Get count of search results with filters applied (for search mode)
  const searchCount = useQuery(
    api.queries.exercises.searchCount,
    isSearching ? { searchTerm: debouncedSearch, ...filterArgs } : "skip",
  );

  // Paginated list for browse mode
  const {
    results: exercises,
    status: browseStatus,
    loadMore: loadMoreBrowse,
  } = usePaginatedQuery(api.queries.exercises.list, filterArgs, {
    initialNumItems: EXERCISES_PAGE_SIZE,
  });

  // Paginated search results
  const {
    results: searchResults,
    status: searchStatus,
    loadMore: loadMoreSearch,
  } = usePaginatedQuery(
    api.queries.exercises.search,
    isSearching ? { searchTerm: debouncedSearch, ...filterArgs } : "skip",
    { initialNumItems: EXERCISES_PAGE_SIZE },
  );

  // Determine which data to use based on search state
  const displayExercises = isSearching ? searchResults : exercises;
  const status = isSearching ? searchStatus : browseStatus;
  const loadMore = isSearching ? loadMoreSearch : loadMoreBrowse;

  // Intersection observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && status === "CanLoadMore") {
          loadMore(EXERCISES_PAGE_SIZE);
        }
      },
      { threshold: 0.1 },
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [status, loadMore]);

  const isLoading = status === "LoadingFirstPage";
  const isLoadingMore = status === "LoadingMore";
  const canLoadMore = status === "CanLoadMore";

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header Section */}
      <div className="border-b border-border/50 bg-gradient-to-b from-accent/5 to-transparent">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-screen-xl py-8">
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

          {/* Gym Filter & Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <GymFilterDropdown
              selectedGymId={selectedGymId}
              userGyms={userGyms}
              onGymChange={handleGymChange}
              isLoading={!gymInitialized}
            />

            <div className="h-6 w-px bg-border" />

            <Select
              value={equipment ?? ""}
              onValueChange={(value) =>
                setEquipment(value === "" ? undefined : (value as Equipment))
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Equipment" />
              </SelectTrigger>
              <SelectContent>
                {EQUIPMENT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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
              value={category ?? ""}
              onValueChange={(value) =>
                setCategory(value === "" ? undefined : (value as Category))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={primaryMuscle ?? ""}
              onValueChange={(value) =>
                setPrimaryMuscle(value === "" ? undefined : (value as Muscle))
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Muscle" />
              </SelectTrigger>
              <SelectContent>
                {MUSCLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-screen-xl py-8">
        {/* Loading State */}
        {isLoading && <LoadingSkeleton />}

        {/* Empty State */}
        {!isLoading &&
          exercises &&
          exercises.length === 0 &&
          !isSearching &&
          !hasFilters && <EmptyState />}

        {/* No Results with Filters */}
        {!isLoading &&
          displayExercises &&
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
        {!isLoading &&
          searchResults &&
          searchResults.length === 0 &&
          isSearching && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground/60" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">
                No exercises found
              </h3>
              <p className="text-muted-foreground text-center text-sm">
                No exercises match &quot;{debouncedSearch}&quot;
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
        {displayExercises && displayExercises.length > 0 && (
          <p className="text-sm text-muted-foreground mb-6">
            {isSearching ? (
              <>
                {searchCount} {searchCount === 1 ? "exercise" : "exercises"}{" "}
                found
              </>
            ) : (
              <>
                {listCount} {listCount === 1 ? "exercise" : "exercises"}{" "}
                {hasFilters ? "found" : "total"}
              </>
            )}
          </p>
        )}

        {/* Exercises Grid */}
        {displayExercises && displayExercises.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayExercises.map((exercise) => (
              <ExerciseCard key={exercise._id} exercise={exercise} />
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel & loading indicator */}
        {canLoadMore && (
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {isLoadingMore && (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            )}
          </div>
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
          className="h-48 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 animate-pulse"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-accent/20 flex items-center justify-center mb-6">
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
