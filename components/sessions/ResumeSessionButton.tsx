import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Timer } from "lucide-react";
import Link from "next/link";
import type { WorkoutSessionWithData } from "@/lib/convex-types";

export const ResumeSessionButton = ({
  session,
}: {
  session: WorkoutSessionWithData;
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
    <Link
      href={`/logs/${session._id}`}
      className="group block w-full rounded-xl bg-linear-to-r from-primary to-primary/80 p-px shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center justify-between gap-4 rounded-[11px] bg-linear-to-r from-primary to-primary/90 px-5 py-4 text-primary-foreground">
        <div className="flex items-center gap-4">
          {/* Animated Play Icon */}
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-full bg-primary-foreground/20 animate-ping" />
            <div className="relative w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
            </div>
          </div>

          {/* Session Info */}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-primary-foreground/80">
              Workout in Progress
            </span>
            <span className="text-lg font-semibold">Resume Session</span>
            {totalSets > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <Timer className="h-3.5 w-3.5 text-primary-foreground/70" />
                <span className="text-xs text-primary-foreground/70">
                  {completedSets} of {totalSets} sets completed
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Arrow */}
        <Button
          variant="secondary"
          size="sm"
          className="gap-1.5 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
        >
          Continue
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </div>
    </Link>
  );
};
