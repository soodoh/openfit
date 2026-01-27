"use client";

import { RoutineModal } from "@/components/routines/RoutineModal";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Calendar, Layers } from "lucide-react";
import { useState } from "react";
import type {
  RoutineWithDays,
  WorkoutSessionWithData,
} from "@/lib/convex-types";

dayjs.extend(relativeTime);

export function RoutineCard({
  routine,
  currentSession,
}: {
  routine: RoutineWithDays;
  currentSession: WorkoutSessionWithData | null | undefined;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dayCount = routine.routineDays.length;

  return (
    <>
      <Card
        onClick={() => setIsModalOpen(true)}
        className="group flex flex-col h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-xs shadow-xs hover:shadow-lg hover:border-border transition-all duration-300 cursor-pointer"
      >
        {/* Card Header with gradient accent */}
        <CardHeader className="relative pb-4">
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-foreground truncate">
                {routine.name}
              </CardTitle>
              {routine.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {routine.description}
                </p>
              )}
            </div>
          </div>

          {/* Meta info */}
          <div className="relative flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              <span>
                {dayCount} {dayCount === 1 ? "day" : "days"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>Updated {dayjs(routine.updatedAt).fromNow()}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      <RoutineModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        routine={routine}
        currentSession={currentSession}
      />
    </>
  );
}
