"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/convex/_generated/api";
import { type WorkoutSessionWithData } from "@/lib/convex-types";
import { useMutation } from "convex/react";
import { Loader2, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";

export const EditNotesPopover = ({
  session,
}: {
  session: WorkoutSessionWithData;
}) => {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(session.notes ?? "");
  const [isPending, setIsPending] = useState(false);
  const updateSession = useMutation(api.mutations.sessions.update);

  useEffect(() => {
    if (open) {
      setNotes(session.notes ?? "");
    }
  }, [open, session.notes]);

  const handleSave = async () => {
    setIsPending(true);
    try {
      await updateSession({ id: session._id, notes });
      setOpen(false);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-3 p-3 rounded-xl bg-card border hover:bg-accent/50 transition-colors text-left w-full h-full">
          <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground leading-none mb-1">
              Notes
            </p>
            {session.notes ? (
              <p className="text-sm leading-tight line-clamp-2">
                {session.notes}
              </p>
            ) : (
              <p className="text-sm font-semibold leading-none">—</p>
            )}
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <Label htmlFor="edit-notes">Notes</Label>
          <textarea
            id="edit-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did the workout go?"
            rows={4}
            className="flex w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          />
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
