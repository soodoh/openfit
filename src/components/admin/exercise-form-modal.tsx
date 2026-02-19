import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminCategories,
  useAdminCreateExercise,
  useAdminEquipment,
  useAdminMuscleGroups,
  useAdminUpdateExercise,
  useUploadFile,
} from "@/hooks";
import type { ExerciseWithRelations } from "@/hooks";
import { Image } from "@unpic/react";
import {
  AlertCircle,
  Check,
  ChevronsUpDown,
  Dumbbell,
  ImagePlus,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
type ImageItem = {
  type: "existing" | "new";
  url?: string; // URL for existing images or blob URL for new
  file?: File; // File object for new uploads
};
type ExerciseFormModalProps = {
  open: boolean;
  onClose: () => void;
  exercise: ExerciseWithRelations | undefined;
};
function getExerciseFormText(isEditMode: boolean): {
  title: string;
  description: string;
  submitLabel: string;
} {
  if (isEditMode) {
    return {
      title: "Edit Exercise",
      description: "Update exercise details",
      submitLabel: "Save Changes",
    };
  }
  return {
    title: "Add Exercise",
    description: "Create a new exercise",
    submitLabel: "Create",
  };
}
function isExerciseFormLoading(
  equipment: unknown,
  categories: unknown,
  muscleGroups: unknown,
): boolean {
  return !equipment || !categories || !muscleGroups;
}
export function ExerciseFormModal({
  open,
  onClose,
  exercise,
}: ExerciseFormModalProps): any {
  const createExerciseMutation = useAdminCreateExercise();
  const updateExerciseMutation = useAdminUpdateExercise();
  const uploadFileMutation = useUploadFile();
  const { data: equipment } = useAdminEquipment();
  const { data: categories } = useAdminCategories();
  const { data: muscleGroups } = useAdminMuscleGroups();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [images, setImages] = useState<ImageItem[]>([]);
  const [error, setError] = useState<string | undefined>(null);
  const [isPending, setIsPending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | undefined>(
    null,
  );
  const isEditMode = Boolean(exercise);
  const { title, description, submitLabel } = getExerciseFormText(isEditMode);
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
        // Convert existing images to ImageItem format
        setImages(
          exercise.imageUrls.filter(Boolean).map((url) => ({
            type: "existing" as const,
            url: url ?? undefined,
          })),
        );
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
      setError(null);
      setUploadProgress(null);
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
      // Upload new images first
      const imageUrls: string[] = [];
      const newImages = images.filter((img) => img.type === "new" && img.file);
      if (newImages.length > 0) {
        setUploadProgress(`Uploading images (0/${newImages.length})...`);
      }
      for (const img of images) {
        if (img.type === "existing" && img.url) {
          imageUrls.push(img.url);
        } else if (img.type === "new" && img.file) {
          const uploadedPath = await uploadFileMutation.mutateAsync(img.file);
          imageUrls.push(uploadedPath);
          const uploadedCount =
            imageUrls.length -
            images.filter((image) => image.type === "existing").length;
          setUploadProgress(
            `Uploading images (${uploadedCount}/${newImages.length})...`,
          );
        }
      }
      setUploadProgress(null);
      const args = {
        name: name.trim(),
        equipmentId: equipmentId || undefined,
        categoryId,
        level,
        force: force || undefined,
        mechanic: mechanic || undefined,
        primaryMuscleIds,
        secondaryMuscleIds,
        instructions: cleanedInstructions,
        imageUrls,
      };
      if (exercise) {
        await updateExerciseMutation.mutateAsync({
          id: exercise.id,
          ...args,
        });
      } else {
        await createExerciseMutation.mutateAsync(args);
      }
      onClose();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : `Failed to ${isEditMode ? "update" : "create"} exercise`,
      );
    } finally {
      setIsPending(false);
      setUploadProgress(null);
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
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) {
      return;
    }
    const newImageItems: ImageItem[] = [...files].map((file) => ({
      type: "new" as const,
      file,
      url: URL.createObjectURL(file),
    }));
    setImages([...images, ...newImageItems]);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  const removeImage = (index: number) => {
    const img = images[index];
    // Revoke blob URL if it's a new image
    if (img.type === "new" && img.url) {
      URL.revokeObjectURL(img.url);
    }
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
    } else if (checked) {
      setSecondaryMuscleIds([...secondaryMuscleIds, muscleId]);
      // Remove from primary if present
      setPrimaryMuscleIds(primaryMuscleIds.filter((id) => id !== muscleId));
    } else {
      setSecondaryMuscleIds(secondaryMuscleIds.filter((id) => id !== muscleId));
    }
  };
  const isLoading = isExerciseFormLoading(equipment, categories, muscleGroups);
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
                <DialogTitle className="text-xl">{title}</DialogTitle>
                <DialogDescription className="text-sm">
                  {description}
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
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Equipment</Label>
                  <Select
                    value={equipmentId || "__none__"}
                    onValueChange={(v) =>
                      setEquipmentId(v === "__none__" ? "" : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {equipment?.map((eq) => (
                        <SelectItem key={eq.id} value={eq.id}>
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
                    value={force || "__none__"}
                    onValueChange={(v) =>
                      setForce(
                        v === "__none__"
                          ? ""
                          : (v as "push" | "pull" | "static"),
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      <SelectItem value="push">Push</SelectItem>
                      <SelectItem value="pull">Pull</SelectItem>
                      <SelectItem value="static">Static</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mechanic</Label>
                  <Select
                    value={mechanic || "__none__"}
                    onValueChange={(v) =>
                      setMechanic(
                        v === "__none__" ? "" : (v as "compound" | "isolation"),
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      <SelectItem value="compound">Compound</SelectItem>
                      <SelectItem value="isolation">Isolation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Primary Muscles */}
              <div className="space-y-2">
                <Label>Primary Muscles *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal"
                    >
                      {primaryMuscleIds.length > 0
                        ? `${primaryMuscleIds.length} selected`
                        : "Select primary muscles"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search muscles..." />
                      <CommandList>
                        <CommandEmpty>No muscle found.</CommandEmpty>
                        <CommandGroup>
                          {muscleGroups?.map((muscle) => (
                            <CommandItem
                              key={muscle.id}
                              value={muscle.name}
                              onSelect={() =>
                                toggleMuscle(
                                  muscle.id,
                                  true,
                                  !primaryMuscleIds.includes(muscle.id),
                                )
                              }
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  primaryMuscleIds.includes(muscle.id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              {muscle.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {primaryMuscleIds.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {primaryMuscleIds.map((id) => {
                      const muscle = muscleGroups?.find((m) => m.id === id);
                      return (
                        <Badge
                          key={id}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => toggleMuscle(id, true, false)}
                        >
                          {muscle?.name}
                          <X className="ml-1 h-3 w-3" />
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Secondary Muscles */}
              <div className="space-y-2">
                <Label>Secondary Muscles</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal"
                    >
                      {secondaryMuscleIds.length > 0
                        ? `${secondaryMuscleIds.length} selected`
                        : "Select secondary muscles"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search muscles..." />
                      <CommandList>
                        <CommandEmpty>No muscle found.</CommandEmpty>
                        <CommandGroup>
                          {muscleGroups?.map((muscle) => (
                            <CommandItem
                              key={muscle.id}
                              value={muscle.name}
                              onSelect={() =>
                                toggleMuscle(
                                  muscle.id,
                                  false,
                                  !secondaryMuscleIds.includes(muscle.id),
                                )
                              }
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  secondaryMuscleIds.includes(muscle.id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              {muscle.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {secondaryMuscleIds.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {secondaryMuscleIds.map((id) => {
                      const muscle = muscleGroups?.find((m) => m.id === id);
                      return (
                        <Badge
                          key={id}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => toggleMuscle(id, false, false)}
                        >
                          {muscle?.name}
                          <X className="ml-1 h-3 w-3" />
                        </Badge>
                      );
                    })}
                  </div>
                )}
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
                    <div key={instruction} className="flex items-start gap-2">
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
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <ImagePlus className="h-4 w-4 mr-2" />
                    Add Images
                  </Button>
                </div>
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {images.map((img, index) => (
                      <div
                        key={img.url ?? img.file?.name ?? "image"}
                        className="relative aspect-square rounded-lg overflow-hidden border bg-muted"
                      >
                        {img.url ? (
                          <Image
                            src={img.url}
                            alt={`Exercise image ${index + 1}`}
                            layout="fullWidth"
                            aspectRatio={1}
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                            No preview
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        {img.type === "new" && (
                          <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                            New
                          </span>
                        )}
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
                  {uploadProgress || "Saving..."}
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
export default ExerciseFormModal;
