"use client";

import { Button } from "@/components/ui/button";
import { WorkoutList } from "@/components/workoutSet/WorkoutList";
import {
  ListView,
  type Units,
  type WorkoutSessionWithData,
} from "@/lib/convex-types";
import dayjs from "dayjs";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  Star,
} from "lucide-react";
import Link from "next/link";
import { EditSessionMenu } from "./EditSessionMenu";

export const SessionPage = ({
  session,
  units,
}: {
  session: WorkoutSessionWithData;
  units: Units;
}) => {
  const durationDate =
    session.startTime && session.endTime
      ? dayjs.duration(dayjs(session.endTime).diff(dayjs(session.startTime)))
      : null;

  const formatDuration = () => {
    if (!durationDate) return "—";
    const hours = durationDate.hours();
    const mins = durationDate.minutes();
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins} min`;
  };

  const totalSets = session.setGroups.reduce(
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
              <Link href="/logs">
                <ArrowLeft className="h-4 w-4" />
                Back to Logs
              </Link>
            </Button>
            <EditSessionMenu session={session} />
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-foreground/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-6 w-6 text-primary dark:text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{dayjs(session.startTime).format("MMMM D, YYYY")}</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight truncate">
                {session.name || "Workout Session"}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-lg) py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Duration Card */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
            <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-foreground/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary dark:text-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="text-sm font-semibold">{formatDuration()}</p>
            </div>
          </div>

          {/* Sets Card */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Sets</p>
              <p className="text-sm font-semibold">{totalSets}</p>
            </div>
          </div>

          {/* Rating Card */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Star
                className={`h-5 w-5 ${session.impression ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rating</p>
              {session.impression ? (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < session.impression!
                          ? "text-amber-400 fill-amber-400"
                          : "text-muted/40"
                      }`}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm font-semibold">—</p>
              )}
            </div>
          </div>

          {/* Notes Card */}
          {session.notes ? (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-card border">
              <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="text-sm line-clamp-2">{session.notes}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
              <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="text-sm font-semibold">—</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Workout List */}
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-lg)">
        <WorkoutList
          view={ListView.ViewSession}
          sessionOrDayId={session._id}
          setGroups={session.setGroups}
          units={units}
        />
      </div>
    </div>
  );
};
