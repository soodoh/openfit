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
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Gym } from "@/lib/convex-types";

interface DeleteGymModalProps {
  open: boolean;
  onClose: () => void;
  gym: Gym;
}

export function DeleteGymModal({ open, onClose, gym }: DeleteGymModalProps) {
  const removeGym = useMutation(api.mutations.gyms.remove);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleDelete = async () => {
    setError(null);
    setIsPending(true);

    try {
      await removeGym({ id: gym._id });
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete gym";
      if (message.includes("last gym")) {
        setError("You cannot delete your only gym. Create another gym first.");
      } else {
        setError("Failed to delete gym. Please try again.");
      }
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
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-xl">Delete Gym</DialogTitle>
              <DialogDescription className="text-sm">
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {error ? (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">"{gym.name}"</span>?
              This will permanently remove the gym and its equipment
              configuration.
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
                "Delete Gym"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
