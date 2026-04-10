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
		const screen = await render(
			<EditDurationPopover session={session} formattedDuration="1h 0m" />,
		);

		await userEvent.click(screen.getByRole("button"));
		await userEvent.click(
			screen.getByRole("button", { name: "Set invalid Start Time" }),
		);
		await userEvent.click(
			screen.getByRole("button", { name: "Set invalid End Time" }),
		);
		await userEvent.click(screen.getByRole("button", { name: "Save" }));

		await expect
			.element(screen.getByText("Please enter valid dates"))
			.toBeVisible();
		expect(mockUpdateSession).not.toHaveBeenCalled();
	});

	it("rejects reversed start and end times before saving", async () => {
		const screen = await render(
			<EditDurationPopover session={session} formattedDuration="1h 0m" />,
		);

		await userEvent.click(screen.getByRole("button"));
		await userEvent.click(
			screen.getByRole("button", { name: "Set reversed Start Time" }),
		);
		await userEvent.click(
			screen.getByRole("button", { name: "Set reversed End Time" }),
		);
		await userEvent.click(screen.getByRole("button", { name: "Save" }));

		await expect
			.element(screen.getByText("End time must be after start time"))
			.toBeVisible();
		expect(mockUpdateSession).not.toHaveBeenCalled();
	});

	it("submits the updated duration when the time range is valid", async () => {
		const screen = await render(
			<EditDurationPopover session={session} formattedDuration="1h 0m" />,
		);

		await userEvent.click(screen.getByRole("button"));
		await userEvent.click(
			screen.getByRole("button", { name: "Set valid Start Time" }),
		);
		await userEvent.click(
			screen.getByRole("button", { name: "Set valid End Time" }),
		);
		await userEvent.click(screen.getByRole("button", { name: "Save" }));

		await vi.waitFor(() => {
			expect(mockUpdateSession).toHaveBeenCalledWith({
				id: "session-1",
				startTime: new Date("2026-04-08T08:00:00.000Z").getTime(),
				endTime: new Date("2026-04-08T09:15:00.000Z").getTime(),
			});
		});
	});

	it("shows an error when saving fails", async () => {
		mockUpdateSession.mockRejectedValueOnce(new Error("save failed"));
		const screen = await render(
			<EditDurationPopover session={session} formattedDuration={undefined} />,
		);

		await userEvent.click(screen.getByRole("button"));
		await userEvent.click(screen.getByRole("button", { name: "Save" }));

		await expect
			.element(screen.getByText("Failed to save. Please try again."))
			.toBeVisible();
	});

	it("closes the popover from cancel and can reopen it", async () => {
		const screen = await render(
			<EditDurationPopover session={session} formattedDuration="1h 0m" />,
		);

		await userEvent.click(screen.getByRole("button"));
		await expect
			.element(screen.getByRole("button", { name: "Save" }))
			.toBeInTheDocument();

		await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
		await expect
			.element(screen.getByRole("button", { name: "Save" }))
			.not.toBeInTheDocument();

		await userEvent.click(screen.getByRole("button"));
		await expect
			.element(screen.getByRole("button", { name: "Save" }))
			.toBeInTheDocument();
	});
});
