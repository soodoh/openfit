import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteGym } from "@/hooks";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import type { Gym } from "@/lib/types";
type DeleteGymModalProps = {
  gym: Gym | undefined;
  isLastGym?: boolean;
  onClose: () => void;
};
export function DeleteGymModal({
  gym,
  isLastGym = false,
  onClose,
}: DeleteGymModalProps): any {
  const open = gym !== null;
  const deleteGymMutation = useDeleteGym();
  const [error, setError] = useState<string | undefined>(null);
  const [isPending, setIsPending] = useState(false);
  const handleDelete = async () => {
    if (!gym) {
      return;
    }
    setError(null);
    setIsPending(true);
    try {
      await deleteGymMutation.mutateAsync(gym.id);
      onClose();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to delete gym";
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
  let bodyContent: ReactNode;
  if (error) {
    bodyContent = (
      <div className="flex items-start gap-3 p-3 rounded-lg bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
        <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
        <p className="text-sm">{error}</p>
      </div>
    );
  } else if (isLastGym) {
    bodyContent = (
      <div className="flex items-start gap-3 p-3 rounded-lg bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
        <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
        <p className="text-sm">
          You cannot delete your only gym. Create another gym first.
        </p>
      </div>
    );
  } else {
    bodyContent = (
      <p className="text-sm text-muted-foreground">
        Are you sure you want to delete{" "}
        <span className="font-medium text-foreground">
          &quot;{gym?.name}&quot;
        </span>
        ? This will permanently remove the gym and its equipment configuration.
      </p>
    );
  }
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-xl">Delete Gym</DialogTitle>
              <DialogDescription className="text-sm">
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">{bodyContent}</div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={handleClose}>
            {error || isLastGym ? "Close" : "Cancel"}
          </Button>
          {!error && !isLastGym && (
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
export default DeleteGymModal;
