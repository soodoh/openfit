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
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import type { RoutineId } from "@/lib/convex-types";

export const DeleteRoutineModal = ({
  open,
  onClose,
  routineId,
}: {
  open: boolean;
  onClose: () => void;
  routineId: RoutineId;
}) => {
  const [isPending, setIsPending] = useState(false);
  const deleteRoutine = useMutation(api.mutations.routines.remove);

  const handleDelete = async () => {
    setIsPending(true);
    try {
      await deleteRoutine({ id: routineId });
      onClose();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden">
        {/* Header with warning styling */}
        <DialogHeader className="px-6 pt-6 pb-4 bg-linear-to-br from-destructive/10 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-xl">Delete Routine</DialogTitle>
              <DialogDescription className="text-sm">
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this routine? All workout days and
            associated data will be permanently removed.
          </p>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border/50">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="mr-2"
          >
            Cancel
          </Button>
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
              "Delete Routine"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
