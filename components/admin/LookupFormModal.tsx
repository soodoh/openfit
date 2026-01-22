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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";

interface LookupItem {
  _id: string;
  name: string;
}

interface LookupFormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  item: LookupItem | null;
  onCreate: (args: { name: string }) => Promise<unknown>;
  onUpdate: (args: { id: unknown; name: string }) => Promise<unknown>;
}

export function LookupFormModal({
  open,
  onClose,
  title,
  item,
  onCreate,
  onUpdate,
}: LookupFormModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const isEditMode = !!item;

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setName(item?.name ?? "");
      setError(null);
    }
  }, [open, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(`${title} name is required`);
      return;
    }

    setIsPending(true);

    try {
      if (isEditMode && item) {
        await onUpdate({ id: item._id, name: trimmedName });
      } else {
        await onCreate({ name: trimmedName });
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${isEditMode ? "update" : "create"} ${title.toLowerCase()}`,
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-foreground/10 flex items-center justify-center">
                <Plus className="h-5 w-5 text-primary dark:text-foreground" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {isEditMode ? `Edit ${title}` : `Add ${title}`}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {isEditMode
                    ? `Update the ${title.toLowerCase()} name`
                    : `Create a new ${title.toLowerCase()}`}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Name
              </Label>
              <Input
                id="name"
                placeholder={`Enter ${title.toLowerCase()} name`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-border/50">
            <Button type="button" variant="ghost" onClick={onClose}>
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
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
