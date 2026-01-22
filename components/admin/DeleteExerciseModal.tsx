"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";

interface Exercise {
  _id: string;
  name: string;
}

interface DeleteExerciseModalProps {
  exercise: Exercise | null;
  onClose: () => void;
  onDelete: (args: { id: Id<"exercises"> }) => Promise<unknown>;
}

export function DeleteExerciseModal({
  exercise,
  onClose,
  onDelete,
}: DeleteExerciseModalProps) {
  const open = exercise !== null;
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleDelete = async () => {
    if (!exercise) return;
    setError(null);
    setIsPending(true);

    try {
      await onDelete({ id: exercise._id as Id<"exercises"> });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete exercise",
      );
    } finally {
      setIsPending(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-xl">Delete Exercise</DialogTitle>
              <DialogDescription className="text-sm">
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {error ? (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
              <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                &quot;{exercise?.name}&quot;
              </span>
              ? This will permanently remove the exercise from the system.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={handleClose}>
            {error ? "Close" : "Cancel"}
          </Button>
          {!error && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
              className="min-w-[100px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
