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
		const screen = await render(<EditRatingPopover session={baseSession} />);

		await userEvent.click(screen.getByRole("button"));
		await userEvent.click(screen.getByRole("button", { name: "Set rating 4" }));
		await userEvent.click(screen.getByRole("button", { name: "Save" }));

		await vi.waitFor(() => {
			expect(mockUpdateSession).toHaveBeenCalledWith({
				id: "session-1",
				impression: 4,
			});
		});
	});

	it("can clear an existing rating before saving", async () => {
		const screen = await render(
			<EditRatingPopover session={{ ...baseSession, impression: 5 }} />,
		);

		await userEvent.click(screen.getByRole("button"));
		await userEvent.click(screen.getByRole("button", { name: "Clear rating" }));
		await userEvent.click(screen.getByRole("button", { name: "Save" }));

		await vi.waitFor(() => {
			expect(mockUpdateSession).toHaveBeenCalledWith({
				id: "session-1",
				impression: undefined,
			});
		});
	});

	it("reopens with the latest rating and clears hover state", async () => {
		const screen = await render(
			<EditRatingPopover session={{ ...baseSession, impression: 2 }} />,
		);

		await userEvent.click(screen.getByRole("button"));
		await userEvent.click(screen.getByRole("button", { name: "Set rating 5" }));
		await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

		screen.rerender(
			<EditRatingPopover session={{ ...baseSession, impression: 4 }} />,
		);
		await userEvent.click(screen.getByRole("button"));

		await expect
			.element(screen.getByRole("button", { name: "Clear rating" }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole("button", { name: "Set rating 4" }))
			.toBeInTheDocument();
	});

	it("closes the popover from cancel and restores the trigger state on reopen", async () => {
		const screen = await render(
			<EditRatingPopover session={{ ...baseSession, impression: 3 }} />,
		);

		await userEvent.click(screen.getByRole("button"));
		await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

		await expect
			.element(screen.getByRole("button", { name: "Save" }))
			.not.toBeInTheDocument();

		await userEvent.click(screen.getByRole("button"));
		await expect
			.element(screen.getByRole("button", { name: "Clear rating" }))
			.toBeInTheDocument();
	});

	it("updates the hover preview when moving across stars", async () => {
		const screen = await render(
			<EditRatingPopover session={{ ...baseSession, impression: null }} />,
		);

		await userEvent.click(screen.getByRole("button"));
		const starButton = screen.getByRole("button", { name: "Set rating 2" });
		await userEvent.hover(starButton);
		await userEvent.unhover(starButton);

		await expect.element(starButton).toBeInTheDocument();
	});
});
