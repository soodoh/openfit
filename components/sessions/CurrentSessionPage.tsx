"use client";

import { Button } from "@/components/ui/button";
import { WorkoutList } from "@/components/workoutSet/WorkoutList";
import {
  ListView,
  type Units,
  type WorkoutSessionWithData,
} from "@/lib/convex-types";
import dayjs from "dayjs";
import { ArrowLeft, Calendar, Clock, MessageSquare, Play } from "lucide-react";
import Link from "next/link";
import { CurrentDuration } from "./CurrentDuration";
import { EditSessionMenu } from "./EditSessionMenu";

export const CurrentSessionPage = ({
  session,
  units,
}: {
  session: WorkoutSessionWithData;
  units: Units;
}) => {
  const completedSets = session.setGroups.reduce(
    (acc, group) => acc + group.sets.filter((set) => set.completed).length,
    0,
  );
  const totalSets = session.setGroups.reduce(
    (acc, group) => acc + group.sets.length,
    0,
  );

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header Section */}
      <div className="border-b border-border/50 bg-gradient-to-b from-accent/5 to-transparent">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-screen-lg py-6">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" asChild className="gap-2">
              <Link href="/logs">
                <ArrowLeft className="h-4 w-4" />
                Back to Logs
              </Link>
            </Button>
            <EditSessionMenu session={session} />
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-foreground/10 flex items-center justify-center flex-shrink-0">
              <Play
                className="h-6 w-6 text-primary dark:text-foreground"
                fill="currentColor"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{dayjs(session.startTime).format("MMMM D, YYYY")}</span>
                <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
                  In Progress
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight truncate">
                {session.name || "Workout Session"}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-screen-lg py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Duration Card */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
            <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-foreground/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary dark:text-foreground" />
            </div>
            <CurrentDuration startTime={session.startTime} />
          </div>

          {/* Progress Card */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <span className="text-sm font-bold text-accent-foreground">
                {totalSets > 0
                  ? Math.round((completedSets / totalSets) * 100)
                  : 0}
                %
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Progress</p>
              <p className="text-sm font-semibold">
                {completedSets} / {totalSets} sets
              </p>
            </div>
          </div>

          {/* Notes Card */}
          {session.notes && (
            <div className="col-span-2 sm:col-span-1 flex items-start gap-3 p-4 rounded-xl bg-card border">
              <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="text-sm line-clamp-2">{session.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Workout List */}
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-screen-lg">
        <WorkoutList
          view={ListView.CurrentSession}
          sessionOrDayId={session._id}
          setGroups={session.setGroups}
          units={units}
        />
      </div>
    </div>
  );
};
