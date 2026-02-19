import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList, } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useGym, useGyms, useReplaceExercise, useSimilarExercises, useUserProfile, } from "@/hooks";
import { useExerciseLookups } from "@/lib/use-exercise-lookups";
import { Image } from "@unpic/react";
import { Check, ChevronDown, Dumbbell, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
type Exercise = {
    id: string;
    name: string;
    imageUrl?: string | undefined;
    primaryMuscleIds?: string[];
};
export const ReplaceExerciseModal = ({ open, onClose, currentExercise, setGroupId, }: {
    open: boolean;
    onClose: () => void;
    currentExercise: Exercise;
    setGroupId: string;
}): any => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGymId, setSelectedGymId] = useState<string | "all" | undefined>(null);
    const [selectedExercise, setSelectedExercise] = useState<Exercise | undefined>(null);
    const [isPending, setIsPending] = useState(false);
    const { getMuscleGroupNames } = useExerciseLookups();
    const replaceExerciseMutation = useReplaceExercise();
    // Fetch user profile for default gym
    const { data: userProfile } = useUserProfile();
    const { data: userGyms } = useGyms();
    // Fetch selected gym's equipment
    const { data: selectedGym } = useGym(selectedGymId && selectedGymId !== "all" ? selectedGymId : undefined);
    // Set selected gym to user's default gym on initial load
    useEffect(() => {
        if (userProfile?.defaultGymId && selectedGymId === null) {
            setSelectedGymId(userProfile.defaultGymId);
        }
    }, [selectedGymId, userProfile?.defaultGymId]);
    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            setSearchTerm("");
            setSelectedExercise(null);
        }
    }, [open]);
    // Determine equipment IDs for filtering
    const equipmentIdsForFilter = selectedGymId === "all" ? undefined : selectedGym?.equipmentIds;
    // Search for similar exercises (same primary muscles, filtered by equipment)
    const { data: options, isLoading } = useSimilarExercises(currentExercise.primaryMuscleIds, {
        search: searchTerm || undefined,
        equipmentIds: equipmentIdsForFilter,
        excludeExerciseId: currentExercise.id,
    });
    const handleSelect = (exercise: Exercise) => {
        setSelectedExercise(exercise);
    };
    const handleConfirm = async () => {
        if (!selectedExercise) {
            return;
        }
        setIsPending(true);
        try {
            await replaceExerciseMutation.mutateAsync({
                id: setGroupId,
                exerciseId: selectedExercise.id,
            });
            onClose();
        }
        finally {
            setIsPending(false);
        }
    };
    const handleGymChange = (gymId: string | "all") => {
        setSelectedGymId(gymId);
    };
    const selectedGymName = selectedGymId && selectedGymId !== "all"
        ? userGyms?.find((g) => g.id === selectedGymId)?.name
        : null;
    const gymDisplayName = selectedGymName ?? "All";
    return (<Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle>Replace Exercise</DialogTitle>
          <DialogDescription>
            Choose a similar exercise to replace &quot;{currentExercise.name}
            &quot;
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col px-6 pt-2 pb-6">
          {/* Search Input */}
          <Input placeholder="Search exercises..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="mb-3"/>

          {/* Gym Filter */}
          <div className="flex items-center gap-1 px-3 py-2 border rounded-md bg-muted/30 mb-3">
            <span className="text-xs text-muted-foreground">
              Available equipment:
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded hover:bg-accent transition-colors">
                  <span>{gymDisplayName}</span>
                  <ChevronDown className="h-3 w-3"/>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {userGyms && userGyms.length > 0 ? (<>
                    {userGyms.map((gym) => (<DropdownMenuItem key={gym.id} onClick={() => handleGymChange(gym.id)} className="flex items-center justify-between cursor-pointer">
                        <span>{gym.name}</span>
                        {selectedGymId === gym.id && (<Check className="h-4 w-4 text-primary"/>)}
                      </DropdownMenuItem>))}
                    <DropdownMenuSeparator />
                  </>) : null}
                <DropdownMenuItem onClick={() => handleGymChange("all")} className="flex items-center justify-between cursor-pointer">
                  <span>All Equipment</span>
                  {selectedGymId === "all" && (<Check className="h-4 w-4 text-primary"/>)}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Primary Muscles Info */}
          <div className="text-xs text-muted-foreground mb-3">
            Showing exercises that target:{" "}
            {getMuscleGroupNames(currentExercise.primaryMuscleIds).join(", ")}
          </div>

          {/* Exercise List */}
          <div className="flex-1 overflow-hidden border rounded-md">
            <Command shouldFilter={false} className="h-full">
              <CommandList className="max-h-[300px]">
                <CommandEmpty>
                  {isLoading
            ? "Loading exercises..."
            : "No similar exercises found"}
                </CommandEmpty>
                <CommandGroup>
                  {options?.map((option) => {
            const isSelected = selectedExercise?.id === option.id;
            return (<CommandItem key={option.id} value={option.id} onSelect={() => handleSelect(option)} className={`flex items-center gap-3 p-3 cursor-pointer ${isSelected ? "bg-accent" : ""}`}>
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                          {option.imageUrl ? (<Image src={option.imageUrl} alt={`${option.name} thumbnail`} width={40} height={40} layout="fixed" className="object-cover"/>) : (<Dumbbell className="h-4 w-4 text-muted-foreground"/>)}
                        </div>
                        <div className="flex flex-col flex-1">
                          <span className="font-medium">{option.name}</span>
                          {option.primaryMuscleIds &&
                    option.primaryMuscleIds.length > 0 && (<span className="text-sm text-muted-foreground">
                                {getMuscleGroupNames(option.primaryMuscleIds).join(", ")}
                              </span>)}
                        </div>
                        {isSelected && (<Check className="h-4 w-4 text-primary shrink-0"/>)}
                      </CommandItem>);
        })}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedExercise || isPending}>
              {isPending ? (<Loader2 className="h-4 w-4 animate-spin mr-2"/>) : null}
              Replace
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>);
};

export default ReplaceExerciseModal;
