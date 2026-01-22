"use client";

import { EditDayMenu } from "@/components/routines/EditDayMenu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkoutList } from "@/components/workoutSet/WorkoutList";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ListView } from "@/lib/convex-types";
import { useQuery } from "convex/react";
import dayjs from "dayjs";
import { ArrowLeft, Calendar, Dumbbell, ListChecks } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  return <DayPageContent />;
}

function DayPageContent() {
  const params = useParams();
  const router = useRouter();
  const dayId = params.day as Id<"routineDays">;

  const routineDay = useQuery(api.queries.routineDays.get, { id: dayId });
  const currentSession = useQuery(api.queries.sessions.getCurrent);
  const units = useQuery(api.queries.units.list);

  // Redirect if routine day not found
  useEffect(() => {
    if (routineDay === null) {
      router.push("/routines");
    }
  }, [routineDay, router]);

  if (routineDay === undefined || units === undefined) {
    return (
      <div className="min-h-[calc(100vh-4rem)]">
        <div className="border-b border-border/50 bg-linear-to-b from-accent/5 to-transparent">
          <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-lg) py-6">
            <div className="h-8 w-32 bg-muted/50 rounded animate-pulse mb-4" />
            <div className="h-10 w-64 bg-muted/50 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!routineDay) {
    return null;
  }

  const totalExercises = routineDay.setGroups.length;
  const totalSets = routineDay.setGroups.reduce(
    (acc, group) => acc + group.sets.length,
    0,
  );

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header Section */}
      <div className="border-b border-border/50 bg-linear-to-b from-accent/5 to-transparent">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-lg) py-6">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" asChild className="gap-2">
              <Link href="/routines">
                <ArrowLeft className="h-4 w-4" />
                Back to Routines
              </Link>
            </Button>
            <EditDayMenu
              currentSession={currentSession}
              routineDay={routineDay}
            />
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-foreground/10 flex items-center justify-center shrink-0">
              <Dumbbell className="h-6 w-6 text-primary dark:text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              {routineDay.routine && (
                <p className="text-sm text-muted-foreground mb-1">
                  {routineDay.routine.name}
                </p>
              )}
              <h1 className="text-2xl font-bold tracking-tight truncate">
                {routineDay.description}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-lg) py-6">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Schedule badges */}
          {routineDay.weekdays.length > 0 && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-wrap gap-1.5">
                {routineDay.weekdays.map((weekday) => (
                  <Badge
                    key={`day-${routineDay._id}-weekday-${weekday}`}
                    variant="secondary"
                    className="text-xs"
                  >
                    {dayjs().day(weekday).format("ddd")}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ListChecks className="h-4 w-4" />
              <span>
                {totalExercises}{" "}
                {totalExercises === 1 ? "exercise" : "exercises"}
              </span>
            </div>
            <span>•</span>
            <span>
              {totalSets} {totalSets === 1 ? "set" : "sets"}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-lg) p-0">
        <WorkoutList
          view={ListView.EditTemplate}
          sessionOrDayId={routineDay._id}
          setGroups={routineDay.setGroups}
          units={units}
        />
      </div>
    </div>
  );
}
