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
import { EditRatingPopover } from "./edit-rating-popover";

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
	Label: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const baseSession = {
	id: "session-1",
	userId: "user-1",
	name: "Upper Body",
	notes: null,
	impression: null,
	startTime: new Date("2026-04-08T08:00:00.000Z"),
	endTime: new Date("2026-04-08T09:00:00.000Z"),
	templateId: null,
	createdAt: new Date("2026-04-08T08:00:00.000Z"),
	updatedAt: new Date("2026-04-08T08:00:00.000Z"),
	setGroups: [],
} satisfies WorkoutSessionWithData;

describe("EditRatingPopover", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUpdateSession.mockResolvedValue({});
	});

	it("saves a selected rating", async () => {
		render(<EditRatingPopover session={baseSession} />);

		fireEvent.click(screen.getByRole("button"));
		fireEvent.click(screen.getByRole("button", { name: "Set rating 4" }));
		fireEvent.click(screen.getByRole("button", { name: "Save" }));

		await waitFor(() => {
			expect(mockUpdateSession).toHaveBeenCalledWith({
				id: "session-1",
				impression: 4,
			});
		});
	});

	it("can clear an existing rating before saving", async () => {
		render(<EditRatingPopover session={{ ...baseSession, impression: 5 }} />);

		fireEvent.click(screen.getByRole("button"));
		fireEvent.click(screen.getByRole("button", { name: "Clear rating" }));
		fireEvent.click(screen.getByRole("button", { name: "Save" }));

		await waitFor(() => {
			expect(mockUpdateSession).toHaveBeenCalledWith({
				id: "session-1",
				impression: undefined,
			});
		});
	});

	it("reopens with the latest rating and clears hover state", () => {
		const { rerender } = render(
			<EditRatingPopover session={{ ...baseSession, impression: 2 }} />,
		);

		fireEvent.click(screen.getByRole("button"));
		fireEvent.click(screen.getByRole("button", { name: "Set rating 5" }));
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

		rerender(<EditRatingPopover session={{ ...baseSession, impression: 4 }} />);
		fireEvent.click(screen.getByRole("button"));

		expect(
			screen.getByRole("button", { name: "Clear rating" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Set rating 4" }),
		).toBeInTheDocument();
	});

	it("closes the popover from cancel and restores the trigger state on reopen", () => {
		render(<EditRatingPopover session={{ ...baseSession, impression: 3 }} />);

		fireEvent.click(screen.getByRole("button"));
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

		expect(
			screen.queryByRole("button", { name: "Save" }),
		).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button"));
		expect(
			screen.getByRole("button", { name: "Clear rating" }),
		).toBeInTheDocument();
	});
});
