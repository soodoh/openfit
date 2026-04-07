import { Flame } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUpdateSet } from "@/hooks";
import type { SetWithRelations } from "@/lib/types";
import { SetType } from "@/lib/types";

// Keep labels centralized for future localization.
const setTypes: Record<
	SetType,
	{
		label: string;
	}
> = {
	[SetType.WARMUP]: {
		label: "Warmup",
	},
	[SetType.NORMAL]: {
		label: "Normal",
	},
	[SetType.DROPSET]: {
		label: "Dropset",
	},
	// Future option: replace this with RiR (reps in reserve).
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

function isSetType(value: string): value is SetType {
	return value in setTypes;
}

export const SetTypeMenu = ({
	set,
	setNum,
}: {
	set: SetWithRelations;
	setNum: number;
}): ReactNode => {
	const [open, setOpen] = useState(false);
	const updateSetMutation = useUpdateSet();
	return (
		<div className="flex items-center">
			<DropdownMenu open={open} onOpenChange={setOpen}>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" className="p-0 h-auto">
						{(isSetType(set.type) ? setTypeIcons[set.type] : undefined) ?? (
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
export default SetTypeMenu;
