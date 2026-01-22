"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/convex/_generated/api";
import { type WorkoutSessionWithData } from "@/lib/convex-types";
import { useMutation } from "convex/react";
import { Loader2, Pencil } from "lucide-react";
import { useEffect, useState } from "react";

export const EditNamePopover = ({
  session,
}: {
  session: WorkoutSessionWithData;
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(session.name);
  const [isPending, setIsPending] = useState(false);
  const updateSession = useMutation(api.mutations.sessions.update);

  useEffect(() => {
    if (open) {
      setName(session.name);
    }
  }, [open, session.name]);

  const handleSave = async () => {
    setIsPending(true);
    try {
      await updateSession({ id: session._id, name });
      setOpen(false);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <Label htmlFor="edit-name">Session Name</Label>
          <Input
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Morning Workout"
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
