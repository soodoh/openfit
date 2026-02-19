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
import { useState } from "react";
type LookupItem = {
  id: string;
  name: string;
};
type LookupFormModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  item: LookupItem | undefined;
  onSubmit: (name: string) => Promise<void>;
  isPending: boolean;
};
export function LookupFormModal({
  open,
  onClose,
  title,
  item,
  onSubmit,
  isPending,
}: LookupFormModalProps): any {
  const [name, setName] = useState(item?.name ?? "");
  const [error, setError] = useState<string | undefined>(null);
  const [prevOpen, setPrevOpen] = useState(open);
  // Reset form when modal opens (adjusting state during render)
  if (open && !prevOpen) {
    setName(item?.name ?? "");
    setError(null);
  }
  if (open !== prevOpen) {
    setPrevOpen(open);
  }
  const isEditMode = Boolean(item);
  const submitLabel = isEditMode ? "Save Changes" : "Create";
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(`${title} name is required`);
      return;
    }
    try {
      await onSubmit(trimmedName);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : `Failed to ${isEditMode ? "update" : "create"} ${title.toLowerCase()}`,
      );
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
              ) : (
                submitLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export default LookupFormModal;
