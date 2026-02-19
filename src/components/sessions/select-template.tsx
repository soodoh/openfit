import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRoutineDaySearch } from "@/hooks";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import type { ReactNode } from "react";
import { useId, useState } from "react";
import type { RoutineDayWithRoutine } from "@/lib/types";
export const SelectTemplate = ({
  value,
  onChange,
  disabled,
  label,
}: {
  value: RoutineDayWithRoutine | undefined;
  onChange: (newValue: RoutineDayWithRoutine | undefined) => void;
  disabled: boolean;
  label: string;
}): any => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const listId = useId();
  const { data: options, isLoading } = useRoutineDaySearch(searchTerm);
  let commandContent: ReactNode;
  if (isLoading) {
    commandContent = <CommandEmpty>Loading...</CommandEmpty>;
  } else if (!options || options.length === 0) {
    commandContent = <CommandEmpty>No workouts found.</CommandEmpty>;
  } else {
    commandContent = (
      <CommandGroup>
        {options.map((option) => (
          <CommandItem
            key={option.id}
            value={option.description}
            onSelect={() => {
              onChange(
                option.id === value?.id
                  ? null
                  : (option as unknown as RoutineDayWithRoutine),
              );
              setOpen(false);
            }}
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4",
                value?.id === option.id ? "opacity-100" : "opacity-0",
              )}
            />
            <div className="flex flex-col">
              <span>{option.description}</span>
              {option.routine?.name && (
                <span className="text-sm text-muted-foreground">
                  {option.routine.name}
                </span>
              )}
            </div>
          </CommandItem>
        ))}
      </CommandGroup>
    );
  }
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            className="w-full justify-between"
            disabled={disabled}
          >
            {value?.description ?? "Empty workout"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-full p-0"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search workouts..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList id={listId}>{commandContent}</CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
export default SelectTemplate;
