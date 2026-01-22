"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { AlertCircle, Dumbbell, Loader2, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";

interface ExerciseWithRelations {
  _id: string;
  name: string;
  level: "beginner" | "intermediate" | "expert";
  force?: "push" | "pull" | "static" | null;
  mechanic?: "compound" | "isolation" | null;
  equipmentId?: string;
  categoryId: string;
  primaryMuscleIds: string[];
  secondaryMuscleIds: string[];
  instructions: string[];
  images: string[];
}

interface ExerciseFormModalProps {
  open: boolean;
  onClose: () => void;
  exercise: ExerciseWithRelations | null;
}

export function ExerciseFormModal({
  open,
  onClose,
  exercise,
}: ExerciseFormModalProps) {
  const createExercise = useMutation(api.mutations.admin.createExercise);
  const updateExercise = useMutation(api.mutations.admin.updateExercise);

  const equipment = useQuery(api.queries.admin.listEquipment);
  const categories = useQuery(api.queries.admin.listCategories);
  const muscleGroups = useQuery(api.queries.admin.listMuscleGroups);

  const [name, setName] = useState("");
  const [equipmentId, setEquipmentId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "expert">(
    "beginner",
  );
  const [force, setForce] = useState<"push" | "pull" | "static" | "">("");
  const [mechanic, setMechanic] = useState<"compound" | "isolation" | "">("");
  const [primaryMuscleIds, setPrimaryMuscleIds] = useState<string[]>([]);
  const [secondaryMuscleIds, setSecondaryMuscleIds] = useState<string[]>([]);
  const [instructions, setInstructions] = useState<string[]>([""]);
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const isEditMode = !!exercise;

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      if (exercise) {
        setName(exercise.name);
        setEquipmentId(exercise.equipmentId ?? "");
        setCategoryId(exercise.categoryId);
        setLevel(exercise.level);
        setForce(exercise.force ?? "");
        setMechanic(exercise.mechanic ?? "");
        setPrimaryMuscleIds(exercise.primaryMuscleIds);
        setSecondaryMuscleIds(exercise.secondaryMuscleIds);
        setInstructions(
          exercise.instructions.length > 0 ? exercise.instructions : [""],
        );
        setImages(exercise.images);
      } else {
        setName("");
        setEquipmentId("");
        setCategoryId("");
        setLevel("beginner");
        setForce("");
        setMechanic("");
        setPrimaryMuscleIds([]);
        setSecondaryMuscleIds([]);
        setInstructions([""]);
        setImages([]);
      }
      setNewImageUrl("");
      setError(null);
    }
  }, [open, exercise]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Exercise name is required");
      return;
    }

    if (!categoryId) {
      setError("Category is required");
      return;
    }

    if (primaryMuscleIds.length === 0) {
      setError("At least one primary muscle is required");
      return;
    }

    setIsPending(true);

    const cleanedInstructions = instructions.filter((i) => i.trim());

    try {
      const args = {
        name: name.trim(),
        equipmentId: equipmentId ? (equipmentId as Id<"equipment">) : undefined,
        categoryId: categoryId as Id<"categories">,
        level,
        force: force || undefined,
        mechanic: mechanic || undefined,
        primaryMuscleIds: primaryMuscleIds as Id<"muscleGroups">[],
        secondaryMuscleIds: secondaryMuscleIds as Id<"muscleGroups">[],
        instructions: cleanedInstructions,
        images,
      };

      if (exercise) {
        await updateExercise({
          id: exercise._id as Id<"exercises">,
          ...args,
        });
      } else {
        await createExercise(args);
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${isEditMode ? "update" : "create"} exercise`,
      );
    } finally {
      setIsPending(false);
    }
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  const addInstruction = () => {
    setInstructions([...instructions, ""]);
  };

  const removeInstruction = (index: number) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== index));
    }
  };

  const addImage = () => {
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl("");
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const toggleMuscle = (
    muscleId: string,
    isPrimary: boolean,
    checked: boolean,
  ) => {
    if (isPrimary) {
      if (checked) {
        setPrimaryMuscleIds([...primaryMuscleIds, muscleId]);
        // Remove from secondary if present
        setSecondaryMuscleIds(
          secondaryMuscleIds.filter((id) => id !== muscleId),
        );
      } else {
        setPrimaryMuscleIds(primaryMuscleIds.filter((id) => id !== muscleId));
      }
    } else {
      if (checked) {
        setSecondaryMuscleIds([...secondaryMuscleIds, muscleId]);
        // Remove from primary if present
        setPrimaryMuscleIds(primaryMuscleIds.filter((id) => id !== muscleId));
      } else {
        setSecondaryMuscleIds(
          secondaryMuscleIds.filter((id) => id !== muscleId),
        );
      }
    }
  };

  const isLoading = !equipment || !categories || !muscleGroups;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <DialogHeader className="pb-4 bg-linear-to-br from-accent/10 via-transparent to-primary/5 -mx-6 -mt-6 px-6 pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-foreground/10 flex items-center justify-center">
                <Dumbbell className="h-5 w-5 text-primary dark:text-foreground" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {isEditMode ? "Edit Exercise" : "Add Exercise"}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {isEditMode
                    ? "Update exercise details"
                    : "Create a new exercise"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Exercise name"
                  autoFocus
                />
              </div>

              {/* Category and Equipment */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Equipment</Label>
                  <Select value={equipmentId} onValueChange={setEquipmentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {equipment?.map((eq) => (
                        <SelectItem key={eq._id} value={eq._id}>
                          {eq.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Level, Force, Mechanic */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Level *</Label>
                  <Select
                    value={level}
                    onValueChange={(v) =>
                      setLevel(v as "beginner" | "intermediate" | "expert")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Force</Label>
                  <Select
                    value={force}
                    onValueChange={(v) =>
                      setForce(v as "push" | "pull" | "static" | "")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="push">Push</SelectItem>
                      <SelectItem value="pull">Pull</SelectItem>
                      <SelectItem value="static">Static</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mechanic</Label>
                  <Select
                    value={mechanic}
                    onValueChange={(v) =>
                      setMechanic(v as "compound" | "isolation" | "")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="compound">Compound</SelectItem>
                      <SelectItem value="isolation">Isolation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Muscles */}
              <div className="space-y-2">
                <Label>Muscles *</Label>
                <p className="text-xs text-muted-foreground">
                  Check primary muscles (left) or secondary muscles (right)
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                  {muscleGroups?.map((muscle) => (
                    <div
                      key={muscle._id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        id={`primary-${muscle._id}`}
                        checked={primaryMuscleIds.includes(muscle._id)}
                        onCheckedChange={(checked) =>
                          toggleMuscle(muscle._id, true, !!checked)
                        }
                      />
                      <span className="flex-1 truncate">{muscle.name}</span>
                      <Checkbox
                        id={`secondary-${muscle._id}`}
                        checked={secondaryMuscleIds.includes(muscle._id)}
                        onCheckedChange={(checked) =>
                          toggleMuscle(muscle._id, false, !!checked)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Instructions</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addInstruction}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Step
                  </Button>
                </div>
                <div className="space-y-2">
                  {instructions.map((instruction, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-sm text-muted-foreground mt-2 w-6">
                        {index + 1}.
                      </span>
                      <Textarea
                        value={instruction}
                        onChange={(e) =>
                          handleInstructionChange(index, e.target.value)
                        }
                        placeholder="Enter instruction step"
                        className="flex-1 min-h-[60px]"
                      />
                      {instructions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeInstruction(index)}
                          className="shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div className="space-y-2">
                <Label>Images</Label>
                <div className="flex gap-2">
                  <Input
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Enter image URL"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addImage}
                    disabled={!newImageUrl.trim()}
                  >
                    Add
                  </Button>
                </div>
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {images.map((url, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 bg-muted rounded px-2 py-1 text-sm"
                      >
                        <span className="truncate max-w-[200px]">{url}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <p className="text-sm text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {error}
                </p>
              )}
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-border/50">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || isLoading}
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
