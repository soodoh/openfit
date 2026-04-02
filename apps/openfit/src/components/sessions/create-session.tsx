import { Plus } from "lucide-react";
import { type ReactNode, useState } from "react";
import { EditSessionModal as NewSessionModal } from "@/components/sessions/edit-session-modal";
import { Button } from "@/components/ui/button";
export const CreateSessionButton = (): ReactNode => {
	const [open, setOpen] = useState(false);
	return (
		<>
			<NewSessionModal open={open} onClose={() => setOpen(false)} />

			<Button
				onClick={() => setOpen(true)}
				className="gap-2 shadow-xs hover:shadow-md transition-shadow"
			>
				<Plus className="h-4 w-4" />
				New Session
			</Button>
		</>
	);
};

export default CreateSessionButton;
