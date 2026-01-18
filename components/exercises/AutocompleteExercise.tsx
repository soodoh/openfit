import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useExerciseLookups } from "@/lib/use-exercise-lookups";
import { useQuery } from "convex/react";
import { Image as FallbackImage } from "lucide-react";
import { useState } from "react";

type Exercise = Doc<"exercises">;

export const AutocompleteExercise = ({
  value,
  onChange,
}: {
  value: Exercise | null;
  onChange: (exercise: Exercise | null) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const { getMuscleGroupNames } = useExerciseLookups();

  const options = useQuery(
    api.queries.exercises.searchSimple,
    searchTerm ? { searchTerm } : "skip",
  );
  const isLoading = options === undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild onClick={(e) => e.preventDefault()}>
        <Input
          placeholder="Start typing to search for exercises"
          value={value?.name || searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full"
        />
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Start typing to search for exercises"
            value={searchTerm}
            onValueChange={(value) => {
              setSearchTerm(value);
            }}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Loading exercises..." : "No exercises found"}
            </CommandEmpty>
            <CommandGroup>
              {options?.map((option) => (
                <CommandItem
                  key={option._id}
                  value={option.name}
                  onSelect={() => {
                    onChange(option);
                    setSearchTerm("");
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 p-3"
                >
                  <Avatar className="h-10 w-10">
                    {option.images[0] ? (
                      <AvatarImage
                        src={`/exercises/${option.images[0]}`}
                        alt={`${option.name} thumbnail`}
                      />
                    ) : null}
                    <AvatarFallback className="flex items-center justify-center">
                      <FallbackImage className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{option.name}</span>
                    {option.primaryMuscleIds &&
                      option.primaryMuscleIds.length > 0 && (
                        <span className="text-sm text-muted-foreground">
                          {getMuscleGroupNames(option.primaryMuscleIds).join(
                            ", ",
                          )}
                        </span>
                      )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
