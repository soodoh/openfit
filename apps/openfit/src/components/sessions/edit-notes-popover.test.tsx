import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
	cloneElement,
	createContext,
	isValidElement,
	type ReactNode,
	useContext,
} from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkoutSessionWithData } from "@/lib/types";
import { EditNotesPopover } from "./edit-notes-popover";

const mockUpdateSession = vi.fn();

type PopoverContextValue = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const PopoverContext = createContext<PopoverContextValue | null>(null);

vi.mock("@/hooks", () => ({
	useUpdateSession: () => ({
		mutateAsync: mockUpdateSession,
	}),
}));

vi.mock("@/components/ui/popover", () => ({
	Popover: ({
		children,
		open,
		onOpenChange,
	}: {
		children: ReactNode;
		open: boolean;
		onOpenChange: (open: boolean) => void;
	}) => (
		<PopoverContext.Provider value={{ open, onOpenChange }}>
			{children}
		</PopoverContext.Provider>
	),
	PopoverTrigger: ({ children }: { children: ReactNode }) => {
		const context = useContext(PopoverContext);
		if (!context || !isValidElement(children)) {
			return <>{children}</>;
		}

		return cloneElement(children, {
			onClick: () => context.onOpenChange(true),
		});
	},
	PopoverContent: ({ children }: { children: ReactNode }) => {
		const context = useContext(PopoverContext);
		return context?.open ? <div>{children}</div> : null;
	},
}));

vi.mock("@/components/ui/button", () => ({
	Button: ({
		children,
		...props
	}: {
		children: ReactNode;
		[key: string]: unknown;
	}) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/label", () => ({
	Label: ({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) => (
		<label htmlFor={htmlFor}>{children}</label>
	),
}));

const baseSession = {
	id: "session-1",
	userId: "user-1",
	name: "Upper Body",
	notes: "Original note",
	impression: null,
	startTime: new Date("2026-04-08T08:00:00.000Z"),
	endTime: new Date("2026-04-08T09:00:00.000Z"),
	templateId: null,
	createdAt: new Date("2026-04-08T08:00:00.000Z"),
	updatedAt: new Date("2026-04-08T08:00:00.000Z"),
	setGroups: [],
} satisfies WorkoutSessionWithData;

describe("EditNotesPopover", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUpdateSession.mockResolvedValue({});
	});

	it("saves edited notes from the textarea", async () => {
		render(<EditNotesPopover session={baseSession} />);

		fireEvent.click(screen.getByRole("button", { name: /notes/i }));
		expect(screen.getByLabelText("Notes")).toHaveValue("Original note");

		fireEvent.change(screen.getByLabelText("Notes"), {
			target: { value: "Updated note" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Save" }));

		await waitFor(() => {
			expect(mockUpdateSession).toHaveBeenCalledWith({
				id: "session-1",
				notes: "Updated note",
			});
		});
	});

	it("shows the empty state when the session has no notes", () => {
		render(<EditNotesPopover session={{ ...baseSession, notes: null }} />);

		expect(screen.getByRole("button", { name: /notes/i })).toHaveTextContent(
			"—",
		);
	});

	it("resets the textarea when the popover is reopened", () => {
		const { rerender } = render(<EditNotesPopover session={baseSession} />);

		fireEvent.click(screen.getByRole("button", { name: /notes/i }));
		fireEvent.change(screen.getByLabelText("Notes"), {
			target: { value: "Temporary note" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

		rerender(
			<EditNotesPopover session={{ ...baseSession, notes: "Fresh note" }} />,
		);
		fireEvent.click(screen.getByRole("button", { name: /notes/i }));

		expect(screen.getByLabelText("Notes")).toHaveValue("Fresh note");
	});
});
