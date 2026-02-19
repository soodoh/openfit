/* eslint-disable eslint(no-warning-comments), eslint-plugin-import(prefer-default-export), eslint-plugin-unicorn(filename-case), typescript-eslint(explicit-module-boundary-types) */

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUpdateSet } from "@/hooks";
import { SetType } from '@/lib/types';
import type { SetWithRelations } from '@/lib/types';
import { Flame } from "lucide-react";
import { useState } from 'react';
import type { ReactNode } from 'react';

// TODO do this better, with localization, etc.
const setTypes: Record<SetType, { label: string }> = {
  [SetType.WARMUP]: {
    label: "Warmup",
  },
  [SetType.NORMAL]: {
    label: "Normal",
  },
  [SetType.DROPSET]: {
    label: "Dropset",
  },
  // TODO consider replacing this with RiR (reps in reserve)
  [SetType.FAILURE]: {
    label: "Failure",
  },
};

const setTypeIcons: Partial<Record<SetType, ReactNode>> = {
  [SetType.WARMUP]: (
    <Avatar className="bg-yellow-600 text-white w-8 h-8">
      <AvatarFallback>
        <Flame className="h-4 w-4" />
      </AvatarFallback>
    </Avatar>
  ),
  [SetType.DROPSET]: (
    <Avatar className="w-8 h-8">
      <AvatarFallback>D</AvatarFallback>
    </Avatar>
  ),
  [SetType.FAILURE]: (
    <Avatar className="bg-red-900 text-white w-8 h-8">
      <AvatarFallback>F</AvatarFallback>
    </Avatar>
  ),
};

export const SetTypeMenu = ({
  set,
  setNum,
}: {
  set: SetWithRelations;
  setNum: number;
}) => {
  const [open, setOpen] = useState(false);
  const updateSetMutation = useUpdateSet();

  return (
    <div className="flex items-center">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="p-0 h-auto">
            {setTypeIcons[set.type as SetType] ?? (
              <Avatar className="w-8 h-8">
                <AvatarFallback>{setNum}</AvatarFallback>
              </Avatar>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {Object.values(SetType).map((setType) => (
            <DropdownMenuItem
              key={`set-type-${set.id}-${setType}`}
              onClick={async () => {
                await updateSetMutation.mutateAsync({
                  id: set.id,
                  type: setType,
                });
                setOpen(false);
              }}
            >
              {setTypes[setType].label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
