import { Badge } from "@/components/ui/badge";
import dayjs from "dayjs";
import { ChevronRight, MoreVertical } from "lucide-react";
import Link from "next/link";
import { EditDayMenu } from "./EditDayMenu";
import type { RoutineDay, WorkoutSessionWithData } from "@/lib/convex-types";

export const RoutineDayItem = ({
  routineDay,
  currentSession,
  index,
}: {
  routineDay: RoutineDay;
  currentSession: WorkoutSessionWithData | null | undefined;
  index: number;
}) => {
  return (
    <div className="group/item flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors">
      {/* Day Number Indicator */}
      <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 dark:bg-foreground/10 flex items-center justify-center">
        <span className="text-sm font-semibold text-primary dark:text-foreground">
          {index + 1}
        </span>
      </div>

      {/* Main Content */}
      <Link href={`/day/${routineDay._id}`} className="flex-1 min-w-0">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-foreground truncate">
              {routineDay.description}
            </h4>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0" />
          </div>
          {routineDay.weekdays.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {routineDay.weekdays.map((weekday) => (
                <Badge
                  key={`${routineDay._id}-weekday-chip-${weekday}`}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-5 font-medium border-border/50 text-muted-foreground"
                >
                  {dayjs().day(weekday).format("ddd")}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* Actions Menu */}
      <EditDayMenu
        routineDay={routineDay}
        currentSession={currentSession}
        icon={<MoreVertical className="h-4 w-4" />}
      />
    </div>
  );
};
