"use client";

import { CreateSessionButton } from "@/components/sessions/CreateSession";
import { MonthlyCalendar } from "@/components/sessions/MonthlyCalendar";
import { ResumeSessionButton } from "@/components/sessions/ResumeSessionButton";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import dayjs from "dayjs";
import { CalendarDays, Loader2 } from "lucide-react";
import { useState } from "react";

export default function Sessions() {
  return <SessionsContent />;
}

function SessionsContent() {
  const [currentMonth, setCurrentMonth] = useState(() => dayjs());

  // Calculate start and end of the calendar view (includes days from prev/next months)
  const startOfCalendar = currentMonth.startOf("month").startOf("week");
  const endOfCalendar = currentMonth.endOf("month").endOf("week");

  // Fetch sessions for the current month view
  const sessions = useQuery(api.queries.sessions.listByDateRange, {
    startDate: startOfCalendar.valueOf(),
    endDate: endOfCalendar.valueOf(),
  });

  const currentSession = useQuery(api.queries.sessions.getCurrent);
  const units = useQuery(api.queries.units.list);

  const isLoading = sessions === undefined || units === undefined;

  // Count sessions in the actual month (not the calendar padding)
  const sessionsThisMonth =
    sessions?.filter((session) =>
      dayjs(session.startTime).isSame(currentMonth, "month"),
    ).length ?? 0;

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header Section */}
      <div className="border-b border-border/50 bg-linear-to-b from-accent/5 to-transparent">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-xl) py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Workout Logs
              </h1>
              <p className="text-muted-foreground mt-1">
                Track your progress and review past sessions
              </p>
            </div>
            {sessions && sessions.length > 0 && <CreateSessionButton />}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-xl) py-8">
        {/* Resume Session Banner */}
        {currentSession && (
          <div className="mb-8">
            <ResumeSessionButton session={currentSession} />
          </div>
        )}

        {/* Loading State */}
        {isLoading && <LoadingSkeleton />}

        {/* Empty State (no sessions ever) */}
        {!isLoading &&
          sessions &&
          sessions.length === 0 &&
          sessionsThisMonth === 0 &&
          currentMonth.isSame(dayjs(), "month") && <EmptyState />}

        {/* Calendar View */}
        {!isLoading && sessions && units && (
          <>
            {/* Sessions Count */}
            <p className="text-sm text-muted-foreground mb-4">
              {sessionsThisMonth}{" "}
              {sessionsThisMonth === 1 ? "session" : "sessions"} in{" "}
              {currentMonth.format("MMMM YYYY")}
            </p>

            <MonthlyCalendar
              currentMonth={currentMonth}
              sessions={sessions}
              currentSessionId={currentSession?._id}
              units={units}
              onMonthChange={setCurrentMonth}
            />
          </>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
      <p className="text-muted-foreground">Loading sessions...</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-linear-to-br from-primary/10 to-accent/20 flex items-center justify-center mb-6">
        <CalendarDays className="w-10 h-10 text-primary/60" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        No workout logs yet
      </h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Start your first workout session to begin tracking your fitness journey.
        Log your exercises, track progress, and build consistent habits.
      </p>
      <CreateSessionButton />
    </div>
  );
}
