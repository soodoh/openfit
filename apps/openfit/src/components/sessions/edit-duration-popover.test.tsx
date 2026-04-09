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
import { EditDurationPopover } from "./edit-duration-popover";

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

vi.mock("@/components/ui/date-time-picker", () => ({
	DateTimePicker: ({
		label,
		onChange,
	}: {
		label: string;
		onChange: (newDate: Date | undefined) => void;
	}) => (
		<div>
			<span>{label}</span>
			<button
				type="button"
				onClick={() => {
					onChange(
						label === "Start Time"
							? new Date("invalid-date")
							: new Date("2026-04-08T10:00:00.000Z"),
					);
				}}
			>
				{`Set invalid ${label}`}
			</button>
			<button
				type="button"
				onClick={() =>
					onChange(
						label === "Start Time"
							? new Date("2026-04-08T10:00:00.000Z")
							: new Date("2026-04-08T09:00:00.000Z"),
					)
				}
			>
				{`Set reversed ${label}`}
			</button>
			<button
				type="button"
				onClick={() =>
					onChange(
						label === "Start Time"
							? new Date("2026-04-08T08:00:00.000Z")
							: new Date("2026-04-08T09:15:00.000Z"),
					)
				}
			>
				{`Set valid ${label}`}
			</button>
		</div>
	),
}));

const session = {
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

describe("EditDurationPopover", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUpdateSession.mockResolvedValue({});
	});

	it("rejects invalid dates before saving", async () => {
		render(<EditDurationPopover session={session} formattedDuration="1h 0m" />);

		fireEvent.click(screen.getByRole("button"));
		fireEvent.click(
			screen.getByRole("button", { name: "Set invalid Start Time" }),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Set invalid End Time" }),
		);
		fireEvent.click(screen.getByRole("button", { name: "Save" }));

		expect(
			await screen.findByText("Please enter valid dates"),
		).toBeInTheDocument();
		expect(mockUpdateSession).not.toHaveBeenCalled();
	});

	it("rejects reversed start and end times before saving", async () => {
		render(<EditDurationPopover session={session} formattedDuration="1h 0m" />);

		fireEvent.click(screen.getByRole("button"));
		fireEvent.click(
			screen.getByRole("button", { name: "Set reversed Start Time" }),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Set reversed End Time" }),
		);
		fireEvent.click(screen.getByRole("button", { name: "Save" }));

		expect(
			await screen.findByText("End time must be after start time"),
		).toBeInTheDocument();
		expect(mockUpdateSession).not.toHaveBeenCalled();
	});

	it("submits the updated duration when the time range is valid", async () => {
		render(<EditDurationPopover session={session} formattedDuration="1h 0m" />);

		fireEvent.click(screen.getByRole("button"));
		fireEvent.click(
			screen.getByRole("button", { name: "Set valid Start Time" }),
		);
		fireEvent.click(screen.getByRole("button", { name: "Set valid End Time" }));
		fireEvent.click(screen.getByRole("button", { name: "Save" }));

		await waitFor(() => {
			expect(mockUpdateSession).toHaveBeenCalledWith({
				id: "session-1",
				startTime: new Date("2026-04-08T08:00:00.000Z").getTime(),
				endTime: new Date("2026-04-08T09:15:00.000Z").getTime(),
			});
		});
	});

	it("shows an error when saving fails", async () => {
		mockUpdateSession.mockRejectedValueOnce(new Error("save failed"));
		render(
			<EditDurationPopover session={session} formattedDuration={undefined} />,
		);

		fireEvent.click(screen.getByRole("button"));
		fireEvent.click(screen.getByRole("button", { name: "Save" }));

		expect(
			await screen.findByText("Failed to save. Please try again."),
		).toBeInTheDocument();
	});

	it("closes the popover from cancel and can reopen it", () => {
		render(<EditDurationPopover session={session} formattedDuration="1h 0m" />);

		fireEvent.click(screen.getByRole("button"));
		expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(
			screen.queryByRole("button", { name: "Save" }),
		).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button"));
		expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
	});
});
