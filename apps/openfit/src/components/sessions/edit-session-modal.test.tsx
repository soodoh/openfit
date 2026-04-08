import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	RoutineDayWithRoutine,
	WorkoutSessionWithData,
} from "@/lib/types";
import { EditSessionModal } from "./edit-session-modal";

const mockCreateSession = vi.fn();
const mockUpdateSession = vi.fn();

const mockTemplate: RoutineDayWithRoutine = {
	id: "template-day-1",
	routineId: "routine-1",
	userId: "user-1",
	description: "Template Legs Day",
	weekdays: [],
	createdAt: new Date("2026-03-01T00:00:00.000Z"),
	updatedAt: new Date("2026-03-01T00:00:00.000Z"),
	routine: {
		id: "routine-1",
		name: "Strength Routine",
	},
};

vi.mock("@/hooks", () => ({
	useCreateSession: () => ({
		mutateAsync: mockCreateSession,
	}),
	useUpdateSession: () => ({
		mutateAsync: mockUpdateSession,
	}),
}));

vi.mock("@/components/ui/date-time-picker", () => ({
	DateTimePicker: ({
		label,
		onChange,
	}: {
		label: string;
		onChange?: (newDate: Date | undefined) => void;
	}) => (
		<div>
			<span>{label}</span>
			<button
				type="button"
				onClick={() =>
					onChange?.(
						new Date(
							label === "Start Time"
								? "2026-03-12T11:00:00.000Z"
								: "2026-03-12T10:00:00.000Z",
						),
					)
				}
			>
				Set {label} invalid
			</button>
		</div>
	),
}));

vi.mock("./select-template", () => ({
	SelectTemplate: ({
		onChange,
	}: {
		onChange: (value: RoutineDayWithRoutine | undefined) => void;
	}) => (
		<button type="button" onClick={() => onChange(mockTemplate)}>
			Choose template
		</button>
	),
}));

describe("EditSessionModal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCreateSession.mockResolvedValue({});
		mockUpdateSession.mockResolvedValue({});
	});

	it("prefills name from template and submits create flow", async () => {
		const onClose = vi.fn();

		render(
			<EditSessionModal
				open
				onClose={onClose}
				defaultStartDate={new Date("2026-03-10T09:00:00.000Z")}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Choose template" }));
		expect(screen.getByLabelText("Session Name")).toHaveValue(
			"Template Legs Day",
		);

		fireEvent.click(screen.getByRole("button", { name: "Create Session" }));

		await waitFor(() => {
			expect(mockCreateSession).toHaveBeenCalledTimes(1);
		});
		expect(mockCreateSession).toHaveBeenCalledWith(
			expect.objectContaining({
				templateId: "template-day-1",
				name: "Template Legs Day",
			}),
		);
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("shows a validation error when end time is not after start time", async () => {
		render(<EditSessionModal open onClose={vi.fn()} />);

		fireEvent.click(
			screen.getByRole("button", { name: "Set Start Time invalid" }),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Set End Time invalid" }),
		);
		fireEvent.click(screen.getByRole("button", { name: "Create Session" }));

		expect(
			await screen.findByText("End time must be after start time"),
		).toBeInTheDocument();
		expect(mockCreateSession).not.toHaveBeenCalled();
	});

	it("shows an error when save fails", async () => {
		mockCreateSession.mockRejectedValueOnce(new Error("save failed"));
		const onClose = vi.fn();

		render(<EditSessionModal open onClose={onClose} />);

		fireEvent.click(screen.getByRole("button", { name: "Create Session" }));

		await waitFor(() => {
			expect(
				screen.getByText("Failed to save session. Please try again."),
			).toBeInTheDocument();
		});
		expect(onClose).not.toHaveBeenCalled();
	});

	it("submits update flow when editing an existing session", async () => {
		const onClose = vi.fn();
		const session: WorkoutSessionWithData = {
			id: "session-1",
			userId: "user-1",
			name: "Original Name",
			notes: "keep moving",
			impression: 4,
			startTime: new Date("2026-03-10T09:00:00.000Z"),
			endTime: new Date("2026-03-10T10:00:00.000Z"),
			templateId: null,
			createdAt: new Date("2026-03-10T09:00:00.000Z"),
			updatedAt: new Date("2026-03-10T09:00:00.000Z"),
			setGroups: [],
		};

		render(<EditSessionModal open onClose={onClose} session={session} />);

		fireEvent.change(screen.getByLabelText("Session Name"), {
			target: { value: "Updated Name" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

		await waitFor(() => {
			expect(mockUpdateSession).toHaveBeenCalledTimes(1);
		});
		expect(mockUpdateSession).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "session-1",
				name: "Updated Name",
			}),
		);
		expect(mockCreateSession).not.toHaveBeenCalled();
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
