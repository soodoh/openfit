import { userEvent } from "@vitest/browser/context";
import {
	cloneElement,
	createContext,
	isValidElement,
	type ReactNode,
	useContext,
} from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
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
		const screen = await render(<EditNotesPopover session={baseSession} />);

		await userEvent.click(screen.getByRole("button", { name: /notes/i }));
		await expect
			.element(screen.getByLabelText("Notes"))
			.toHaveValue("Original note");

		await screen.getByLabelText("Notes").fill("Updated note");
		await userEvent.click(screen.getByRole("button", { name: "Save" }));

		await vi.waitFor(() => {
			expect(mockUpdateSession).toHaveBeenCalledWith({
				id: "session-1",
				notes: "Updated note",
			});
		});
	});

	it("shows the empty state when the session has no notes", async () => {
		const screen = await render(
			<EditNotesPopover session={{ ...baseSession, notes: null }} />,
		);

		await expect
			.element(screen.getByRole("button", { name: /notes/i }))
			.toHaveTextContent("—");
	});

	it("resets the textarea when the popover is reopened", async () => {
		const screen = await render(<EditNotesPopover session={baseSession} />);

		await userEvent.click(screen.getByRole("button", { name: /notes/i }));
		await screen.getByLabelText("Notes").fill("Temporary note");
		await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

		screen.rerender(
			<EditNotesPopover session={{ ...baseSession, notes: "Fresh note" }} />,
		);
		await userEvent.click(screen.getByRole("button", { name: /notes/i }));

		await expect
			.element(screen.getByLabelText("Notes"))
			.toHaveValue("Fresh note");
	});
});
