import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { AlertCircle, Dumbbell, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Routine } from "@/lib/convex-types";

export const EditRoutineModal = ({
  open,
  onClose,
  routine,
}: {
  routine?: Routine;
  open: boolean;
  onClose: () => void;
}) => {
  const [name, setName] = useState(routine?.name ?? "");
  const [description, setDescription] = useState(routine?.description ?? "");
  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; description?: string }>(
    {},
  );

  // Reset form when modal opens/closes or routine changes
  useEffect(() => {
    if (open) {
      setName(routine?.name ?? "");
      setDescription(routine?.description ?? "");
      setErrors({});
    }
  }, [open, routine]);

  const createRoutine = useMutation(api.mutations.routines.create);
  const updateRoutine = useMutation(api.mutations.routines.update);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsPending(true);
    setErrors({});

    try {
      if (routine) {
        await updateRoutine({
          id: routine._id,
          name,
          description: description || undefined,
        });
      } else {
        await createRoutine({
          name,
          description: description || undefined,
        });
      }
      onClose();
    } catch {
      setErrors({ name: "Failed to save routine" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
        <form onSubmit={handleSubmit}>
          {/* Header with gradient */}
          <DialogHeader className="px-6 pt-6 pb-4 bg-linear-to-br from-accent/10 via-transparent to-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-foreground/10 flex items-center justify-center">
                <Dumbbell className="h-5 w-5 text-primary dark:text-foreground" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {routine ? "Edit Routine" : "Create Routine"}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {routine
                    ? "Update your workout routine details"
                    : "Set up a new workout routine to organize your training"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Form Content */}
          <div className="px-6 py-5 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="routine-name" className="text-sm font-medium">
                Routine Name
              </Label>
              <Input
                id="routine-name"
                name="name"
                placeholder="e.g., Push Pull Legs, Full Body, Upper/Lower"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`h-11 ${errors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {errors.name && (
                <p className="text-sm text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="routine-description"
                className="text-sm font-medium"
              >
                Description{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <textarea
                id="routine-description"
                name="description"
                placeholder="Add notes about this routine, goals, or schedule..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none ${
                  errors.description
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }`}
              />
              {errors.description && (
                <p className="text-sm text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.description}
                </p>
              )}
            </div>
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
              type="submit"
              disabled={isPending}
              className="min-w-[100px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : routine ? (
                "Save Changes"
              ) : (
                "Create Routine"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
