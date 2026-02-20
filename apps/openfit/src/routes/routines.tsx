import { CreateRoutine } from "@/components/routines/create-routine";
import { RoutineCard } from "@/components/routines/routine-card";
import { ResumeSessionButton } from "@/components/sessions/resume-session-button";
import { Input } from "@/components/ui/input";
import { useCurrentSession, useInView, useRoutines } from "@/hooks";
import { createFileRoute } from "@tanstack/react-router";
import { Dumbbell, Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
function RoutinesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-64 rounded-xl bg-linear-to-br from-muted/50 to-muted/30 animate-pulse"
        />
      ))}
    </div>
  );
}
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-linear-to-br from-primary/10 to-accent/20 dark:from-primary/20 dark:to-accent/30 flex items-center justify-center mb-6">
        <Dumbbell className="w-10 h-10 text-primary/70 dark:text-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        No routines yet
      </h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Create your first workout routine to start tracking your fitness
        journey. Organize your workouts by day and build consistent habits.
      </p>
      <CreateRoutine variant="empty-state" />
    </div>
  );
}
function RoutinesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const isSearching = searchQuery.trim().length > 0;
  const {
    data: routinesData,
    isLoading: routinesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useRoutines({ search: isSearching ? searchQuery : undefined });
  const routines = useMemo(() => {
    if (!routinesData?.pages) {
      return [];
    }
    return routinesData.pages.flatMap((page) => page.page);
  }, [routinesData]);
  const totalCount = routines.length;
  const { data: currentSession } = useCurrentSession();
  const { ref: sentinelRef, inView } = useInView();
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="border-b border-border/50 bg-linear-to-b from-accent/5 to-transparent">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-xl) py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Routines
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your workout routines and training schedules
              </p>
            </div>
            {routines.length > 0 && <CreateRoutine />}
          </div>

          {(routines.length > 0 || isSearching) && (
            <div className="relative mt-6 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search routines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-xl) py-8">
        {currentSession && (
          <div className="mb-8">
            <ResumeSessionButton session={currentSession} />
          </div>
        )}

        {routinesLoading && <RoutinesSkeleton />}

        {!routinesLoading && routines.length === 0 && !isSearching && (
          <EmptyState />
        )}

        {!routinesLoading && routines.length === 0 && isSearching && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground/60" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">
              No routines found
            </h3>
            <p className="text-muted-foreground text-center text-sm">
              No routines match &quot;{searchQuery}&quot;
            </p>
          </div>
        )}

        {routines.length > 0 && (
          <p className="text-sm text-muted-foreground mb-6">
            {totalCount} {totalCount === 1 ? "routine" : "routines"}{" "}
            {isSearching ? "found" : "total"}
          </p>
        )}

        {routines.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {routines.map((routine) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  currentSession={currentSession}
                />
              ))}
            </div>

            {hasNextPage && (
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
export const Route = createFileRoute("/routines")({
  component: RoutinesPage,
});
export default Route;
