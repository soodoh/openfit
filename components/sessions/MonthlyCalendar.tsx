"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight, Clock, Play, Star } from "lucide-react";
import { useState } from "react";
import { SessionDetailModal } from "./SessionDetailModal";
import type { Units, WorkoutSessionWithData } from "@/lib/convex-types";

type DayData = {
  date: dayjs.Dayjs;
  isCurrentMonth: boolean;
  isToday: boolean;
  sessions: WorkoutSessionWithData[];
};

export const MonthlyCalendar = ({
  currentMonth,
  sessions,
  currentSessionId,
  units,
  onMonthChange,
}: {
  currentMonth: dayjs.Dayjs;
  sessions: WorkoutSessionWithData[];
  currentSessionId?: string;
  units: Units;
  onMonthChange: (month: dayjs.Dayjs) => void;
}) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );

  // Look up the selected session from fresh query data
  const selectedSession = selectedSessionId
    ? sessions.find((s) => s._id === selectedSessionId) ?? null
    : null;

  // Build calendar grid
  const startOfMonth = currentMonth.startOf("month");
  const endOfMonth = currentMonth.endOf("month");
  const startOfCalendar = startOfMonth.startOf("week");
  const endOfCalendar = endOfMonth.endOf("week");

  // Create day cells
  const days: DayData[] = [];
  let day = startOfCalendar;
  while (day.isBefore(endOfCalendar) || day.isSame(endOfCalendar, "day")) {
    const currentDay = day;
    const daySessions = sessions.filter((session) =>
      dayjs(session.startTime).isSame(currentDay, "day"),
    );

    days.push({
      date: currentDay,
      isCurrentMonth: currentDay.month() === currentMonth.month(),
      isToday: currentDay.isSame(dayjs(), "day"),
      sessions: daySessions,
    });
    day = day.add(1, "day");
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const goToPreviousMonth = () => {
    onMonthChange(currentMonth.subtract(1, "month"));
  };

  const goToNextMonth = () => {
    onMonthChange(currentMonth.add(1, "month"));
  };

  const goToToday = () => {
    onMonthChange(dayjs());
  };

  return (
    <>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            {currentMonth.format("MMMM YYYY")}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="hidden sm:flex"
          >
            Today
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousMonth}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextMonth}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-xl overflow-hidden">
        {/* Week day headers */}
        <div className="grid grid-cols-7 bg-muted/50 border-b">
          {weekDays.map((weekDay) => (
            <div
              key={weekDay}
              className="px-2 py-3 text-center text-sm font-medium text-muted-foreground"
            >
              <span className="hidden sm:inline">{weekDay}</span>
              <span className="sm:hidden">{weekDay.charAt(0)}</span>
            </div>
          ))}
        </div>

        {/* Calendar days grid */}
        <div className="grid grid-cols-7">
          {days.map((dayData, index) => (
            <CalendarDay
              key={dayData.date.format("YYYY-MM-DD")}
              dayData={dayData}
              currentSessionId={currentSessionId}
              onSessionClick={(session) => setSelectedSessionId(session._id)}
              isLastRow={index >= days.length - 7}
            />
          ))}
        </div>
      </div>

      {/* Session Detail Modal */}
      <SessionDetailModal
        session={selectedSession}
        units={units}
        open={!!selectedSession}
        onClose={() => setSelectedSessionId(null)}
        isActive={selectedSession?._id === currentSessionId}
      />
    </>
  );
};

const CalendarDay = ({
  dayData,
  currentSessionId,
  onSessionClick,
  isLastRow,
}: {
  dayData: DayData;
  currentSessionId?: string;
  onSessionClick: (session: WorkoutSessionWithData) => void;
  isLastRow: boolean;
}) => {
  const { date, isCurrentMonth, isToday, sessions } = dayData;

  return (
    <div
      className={cn(
        "min-h-[100px] sm:min-h-[120px] p-1.5 sm:p-2 border-r border-b last:border-r-0",
        isLastRow && "border-b-0",
        !isCurrentMonth && "bg-muted/20",
      )}
    >
      {/* Day number */}
      <div
        className={cn(
          "w-7 h-7 flex items-center justify-center text-sm rounded-full mb-1",
          isToday && "bg-primary text-primary-foreground font-semibold",
          !isCurrentMonth && !isToday && "text-muted-foreground",
          isCurrentMonth && !isToday && "font-medium",
        )}
      >
        {date.date()}
      </div>

      {/* Sessions */}
      <div className="space-y-1">
        {sessions.slice(0, 3).map((session) => (
          <SessionCard
            key={session._id}
            session={session}
            isActive={session._id === currentSessionId}
            onClick={() => onSessionClick(session)}
          />
        ))}
        {sessions.length > 3 && (
          <button
            onClick={() => onSessionClick(sessions[3])}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-left px-1"
          >
            +{sessions.length - 3} more
          </button>
        )}
      </div>
    </div>
  );
};

const SessionCard = ({
  session,
  isActive,
  onClick,
}: {
  session: WorkoutSessionWithData;
  isActive: boolean;
  onClick: () => void;
}) => {
  const durationDate =
    session.startTime && session.endTime
      ? dayjs.duration(dayjs(session.endTime).diff(dayjs(session.startTime)))
      : null;

  const formatDuration = () => {
    if (!durationDate) return null;
    const hours = durationDate.hours();
    const mins = durationDate.minutes();
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-2 py-1.5 rounded-lg text-xs transition-all",
        "hover:ring-2 hover:ring-primary/50 hover:shadow-sm",
        "focus:outline-none focus:ring-2 focus:ring-primary",
        isActive
          ? "bg-primary text-primary-foreground"
          : "bg-accent/50 hover:bg-accent",
      )}
    >
      <div className="flex items-center gap-1">
        {isActive && (
          <Play className="w-2.5 h-2.5 fill-current flex-shrink-0" />
        )}
        <span className="font-medium truncate">{session.name}</span>
      </div>
      <div
        className={cn(
          "flex items-center gap-2 mt-0.5",
          isActive ? "text-primary-foreground/80" : "text-muted-foreground",
        )}
      >
        {formatDuration() && (
          <span className="flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />
            {formatDuration()}
          </span>
        )}
        {session.impression && (
          <span className="flex items-center gap-0.5">
            <Star
              className={cn(
                "w-2.5 h-2.5",
                isActive ? "fill-current" : "fill-amber-400 text-amber-400",
              )}
            />
            {session.impression}
          </span>
        )}
      </div>
    </button>
  );
};
