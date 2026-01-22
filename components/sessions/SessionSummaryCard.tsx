import dayjs from "dayjs";
import {
  ArrowRight,
  Calendar,
  Clock,
  MessageSquare,
  Play,
  Star,
} from "lucide-react";
import Link from "next/link";
import { EditSessionMenu } from "./EditSessionMenu";
import type { WorkoutSessionWithData } from "@/lib/convex-types";

export const SessionSummaryCard = ({
  session,
  isActive = false,
}: {
  session: WorkoutSessionWithData;
  isActive?: boolean;
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
    return `${mins} min`;
  };

  const totalSets = session.setGroups.reduce(
    (acc, group) => acc + group.sets.length,
    0,
  );

  return (
    <Link href={`/logs/${session._id}`} className="group block">
      <div
        className={`relative h-full rounded-xl border bg-card p-5 transition-all duration-200 hover:shadow-lg hover:border-foreground/20 hover:-translate-y-0.5 ${isActive ? "ring-2 ring-primary/50 border-primary/30" : ""}`}
      >
        {/* Active Session Indicator */}
        {isActive && (
          <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full shadow-xs">
            <Play className="w-3 h-3 fill-current" />
            <span>In Progress</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-semibold text-base truncate group-hover:text-primary dark:group-hover:text-white transition-colors">
              {session.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1.5 text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span className="text-sm">
                {dayjs(session.startTime).format("MMM D, YYYY")}
              </span>
            </div>
          </div>
          {/* stopPropagation to prevent card link click */}
          <div onClick={(e) => e.stopPropagation()}>
            <EditSessionMenu session={session} />
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 mb-4">
          {formatDuration() && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDuration()}</span>
            </div>
          )}
          {totalSets > 0 && (
            <div className="text-sm text-muted-foreground">
              {totalSets} {totalSets === 1 ? "set" : "sets"}
            </div>
          )}
        </div>

        {/* Rating */}
        {session.impression && (
          <div className="flex items-center gap-1 mb-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < session.impression!
                    ? "text-amber-400 fill-amber-400"
                    : "text-muted/40"
                }`}
              />
            ))}
          </div>
        )}

        {/* Notes Preview */}
        {session.notes && (
          <div className="flex items-start gap-2 pt-3 border-t border-border/50">
            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground line-clamp-2">
              {session.notes}
            </p>
          </div>
        )}

        {/* Hover Arrow */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight className="w-4 h-4 text-primary dark:text-white" />
        </div>
      </div>
    </Link>
  );
};
