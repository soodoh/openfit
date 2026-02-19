import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList, } from "@/components/ui/command";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent, } from "@/components/ui/popover";
import { useExerciseSearch, useGym, useGyms, useUserProfile } from "@/hooks";
import { useExerciseLookups } from "@/lib/use-exercise-lookups";
import { Image } from "@unpic/react";
import { Check, ChevronDown, Dumbbell } from "lucide-react";
import { useRef, useState } from "react";
import type { Exercise } from "@/lib/types";
function resolveEffectiveGymId(selectedGymId: string | "all" | "default" | undefined, defaultGymId: string | undefined): string | "all" | undefined {
    if (selectedGymId !== "default") {
        return selectedGymId;
    }
    return defaultGymId ?? undefined;
}
function getGymDisplayName(effectiveGymId: string | "all" | undefined, userGyms: Array<{ id: string; name: string; }> | undefined): string {
    if (!effectiveGymId || effectiveGymId === "all") {
        return "All";
    }
    return userGyms?.find((gym) => gym.id === effectiveGymId)?.name ?? "All";
}
function handleAutocompleteKeyDown(args: {
    event: React.KeyboardEvent<HTMLInputElement>;
    value: Exercise | undefined;
    options: Exercise[] | undefined;
    onChange: (exercise: Exercise | undefined) => void;
    onSelect: (exercise: Exercise) => void;
    setSearchTerm: (term: string) => void;
    setOpen: (open: boolean) => void;
}): void {
    const { event, value, options, onChange, onSelect, setSearchTerm, setOpen } = args;
    if (value) {
        onChange(null);
        if (event.key === "Backspace" || event.key === "Delete") {
            event.preventDefault();
            setSearchTerm("");
            return;
        }
        if (event.key.length === 1) {
            event.preventDefault();
            setSearchTerm(event.key);
            setOpen(true);
            return;
        }
    }
    if (event.key === "Enter" && options && options.length > 0) {
        event.preventDefault();
        onSelect(options[0]);
    }
    if (event.key === "Escape") {
        setOpen(false);
    }
}
export const AutocompleteExercise = ({ value, onChange, }: {
    value: Exercise | undefined;
    onChange: (exercise: Exercise | undefined) => void;
}): any => {
    const [searchTerm, setSearchTerm] = useState("");
    const [open, setOpen] = useState(false);
    const [selectedGymId, setSelectedGymId] = useState<string | "all" | "default">("default");
    const inputRef = useRef<HTMLInputElement>(null);
    const { getMuscleGroupNames } = useExerciseLookups();
    // Fetch user profile for default gym
    const { data: profile } = useUserProfile();
    const { data: userGyms } = useGyms();
    // Initialize selected gym from profile's default gym
    const effectiveGymId = resolveEffectiveGymId(selectedGymId, profile?.defaultGymId ?? undefined);
    // Fetch selected gym's equipment (skip if "all" or null/not yet initialized)
    const { data: selectedGym } = useGym(effectiveGymId && effectiveGymId !== "all" ? effectiveGymId : undefined);
    // Determine equipment IDs for filtering
    // - null: not initialized yet, don't filter
    // - "all": user selected all equipment, don't filter
    // - gym ID: filter by that gym's equipment
    const equipmentIdsForFilter = effectiveGymId === "all" ? undefined : selectedGym?.equipmentIds;
    // Search with gym equipment filter (always query, even without search term)
    const { data: options, isLoading } = useExerciseSearch(searchTerm || "", equipmentIdsForFilter);
    const handleSelect = (exercise: Exercise) => {
        onChange(exercise);
        setSearchTerm("");
        setOpen(false);
    };
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        handleAutocompleteKeyDown({
            event,
            value,
            options: options as Exercise[] | undefined,
            onChange,
            onSelect: handleSelect,
            setSearchTerm,
            setOpen,
        });
    };
    const handleGymChange = (gymId: string | "all") => {
        setSelectedGymId(gymId);
    };
    const gymDisplayName = getGymDisplayName(effectiveGymId, userGyms);
    return (<div className="w-full">
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverAnchor asChild>
          <Input ref={inputRef} placeholder="Search exercises..." value={value?.name || searchTerm} onChange={(e) => {
            // If there's a selected value, keyDown handler takes care of clearing
            // This onChange is only for when there's no selected value
            if (!value) {
                setSearchTerm(e.target.value);
                if (!open && e.target.value) {
                    setOpen(true);
                }
            }
        }} onFocus={() => !value && setOpen(true)} onBlur={(e) => {
            // Don't close if clicking inside popover
            if (!e.relatedTarget?.closest("[data-radix-popper-content-wrapper]")) {
                setOpen(false);
            }
        }} onKeyDown={handleKeyDown} className="flex-1"/>
        </PopoverAnchor>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()} onInteractOutside={(e) => {
            // Don't close if interacting with the input
            if (e.target === inputRef.current) {
                e.preventDefault();
            }
        }} onPointerDownOutside={(e) => e.preventDefault()}>
          {/* Gym Filter Header */}
          <div className="flex items-center gap-1 px-3 py-2 border-b bg-muted/30">
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
                        {effectiveGymId === gym.id && (<Check className="h-4 w-4 text-primary"/>)}
                      </DropdownMenuItem>))}
                    <DropdownMenuSeparator />
                  </>) : null}
                <DropdownMenuItem onClick={() => handleGymChange("all")} className="flex items-center justify-between cursor-pointer">
                  <span>All Equipment</span>
                  {effectiveGymId === "all" && (<Check className="h-4 w-4 text-primary"/>)}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Command shouldFilter={false}>
            <CommandList onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
              <CommandEmpty>
                {isLoading ? "Loading exercises..." : "No exercises found"}
              </CommandEmpty>
              <CommandGroup>
                {options?.map((option, index) => (<CommandItem key={option.id} value={option.id} onSelect={() => handleSelect(option as unknown as Exercise)} className={`flex items-center gap-3 p-3 cursor-pointer ${index === 0 ? "bg-accent" : ""}`}>
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                      {option.imageUrl ? (<Image src={option.imageUrl} alt={`${option.name} thumbnail`} width={40} height={40} layout="fixed" className="object-cover"/>) : (<Dumbbell className="h-4 w-4 text-muted-foreground"/>)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{option.name}</span>
                      {option.primaryMuscleIds &&
                option.primaryMuscleIds.length > 0 && (<span className="text-sm text-muted-foreground">
                            {getMuscleGroupNames(option.primaryMuscleIds).join(", ")}
                          </span>)}
                    </div>
                  </CommandItem>))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>);
};
export default AutocompleteExercise;
