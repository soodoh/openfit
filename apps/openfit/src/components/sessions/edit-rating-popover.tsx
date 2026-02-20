import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUpdateSession } from "@/hooks";
import type { WorkoutSessionWithData } from "@/lib/types";
import { Loader2, Star, X } from "lucide-react";
import { useEffect, useState } from "react";
export const EditRatingPopover = ({
  session,
}: {
  session: WorkoutSessionWithData;
}): any => {
  const [open, setOpen] = useState(false);
  const [impression, setImpression] = useState<number | undefined>(
    session.impression ?? undefined,
  );
  const [hoveredStar, setHoveredStar] = useState<number | undefined>(undefined);
  const [isPending, setIsPending] = useState(false);
  const updateSessionMutation = useUpdateSession();
  useEffect(() => {
    if (open) {
      setImpression(session.impression ?? undefined);
      setHoveredStar(undefined);
    }
  }, [open, session.impression]);
  const handleSave = async () => {
    setIsPending(true);
    try {
      await updateSessionMutation.mutateAsync({
        id: session.id,
        impression: impression ?? undefined,
      });
      setOpen(false);
    } finally {
      setIsPending(false);
    }
  };
  const activeRating = hoveredStar ?? impression ?? 0;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-3 p-3 rounded-xl bg-card border hover:bg-accent/50 transition-colors text-left w-full h-full"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <Star
              className={`h-4 w-4 ${session.impression ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`}
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground leading-none mb-1">
              Rating
            </p>
            {session.impression ? (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={`session-rating-${session.id}-${i + 1}`}
                    className={`h-3 w-3 ${
                      i < session.impression!
                        ? "text-amber-400 fill-amber-400"
                        : "text-muted/40"
                    }`}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm font-semibold leading-none">—</p>
            )}
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto" align="center">
        <div className="space-y-3">
          <Label>How did it feel?</Label>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }, (_, i) => {
              const starValue = i + 1;
              const isFilled = starValue <= activeRating;
              return (
                <button
                  key={`rating-input-${session.id}-${starValue}`}
                  type="button"
                  onClick={() => setImpression(starValue)}
                  onMouseEnter={() => setHoveredStar(starValue)}
                  onMouseLeave={() => setHoveredStar(undefined)}
                  className="p-1 rounded-md transition-all duration-150 hover:scale-110"
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${
                      isFilled
                        ? "text-amber-400 fill-amber-400"
                        : "text-muted/40 hover:text-amber-300"
                    }`}
                  />
                </button>
              );
            })}
            {impression && (
              <button
                type="button"
                onClick={() => setImpression(undefined)}
                className="ml-2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
export default EditRatingPopover;
