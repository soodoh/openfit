import { userEvent } from "@vitest/browser/context";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
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
				onClick={() => onChange?.(new Date("invalid-date"))}
			>
				Set {label} invalid date
			</button>
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

		const screen = await render(
			<EditSessionModal
				open
				onClose={onClose}
				defaultStartDate={new Date("2026-03-10T09:00:00.000Z")}
			/>,
		);

		await userEvent.click(
			screen.getByRole("button", { name: "Choose template" }),
		);
		await expect
			.element(screen.getByLabelText("Session Name"))
			.toHaveValue("Template Legs Day");

		await userEvent.click(
			screen.getByRole("button", { name: "Create Session" }),
		);

		await vi.waitFor(() => {
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

	it("submits create flow without a template and uses the default start date", async () => {
		const onClose = vi.fn();
		const defaultStartDate = new Date("2026-03-10T09:00:00.000Z");

		const screen = await render(
			<EditSessionModal
				open
				onClose={onClose}
				defaultStartDate={defaultStartDate}
			/>,
		);

		await userEvent.click(
			screen.getByRole("button", { name: "Create Session" }),
		);

		await vi.waitFor(() => {
			expect(mockCreateSession).toHaveBeenCalledWith(
				expect.objectContaining({
					templateId: undefined,
					startTime: defaultStartDate.getTime(),
				}),
			);
		});
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("shows a validation error when end time is not after start time", async () => {
		const screen = await render(<EditSessionModal open onClose={vi.fn()} />);

		await userEvent.click(
			screen.getByRole("button", {
				name: "Set Start Time invalid",
				exact: true,
			}),
		);
		await userEvent.click(
			screen.getByRole("button", { name: "Set End Time invalid", exact: true }),
		);
		await userEvent.click(
			screen.getByRole("button", { name: "Create Session" }),
		);

		await expect
			.element(screen.getByText("End time must be after start time"))
			.toBeVisible();
		expect(mockCreateSession).not.toHaveBeenCalled();
	});

	it("shows an error when save fails", async () => {
		mockCreateSession.mockRejectedValueOnce(new Error("save failed"));
		const onClose = vi.fn();

		const screen = await render(<EditSessionModal open onClose={onClose} />);

		await userEvent.click(
			screen.getByRole("button", { name: "Create Session" }),
		);

		await vi.waitFor(() => {
			expect(mockCreateSession).toHaveBeenCalled();
		});
		await expect
			.element(screen.getByText("Failed to save session. Please try again."))
			.toBeInTheDocument();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("shows a validation error when a date picker returns an invalid date", async () => {
		const screen = await render(<EditSessionModal open onClose={vi.fn()} />);

		await userEvent.click(
			screen.getByRole("button", { name: "Set Start Time invalid date" }),
		);
		await userEvent.click(
			screen.getByRole("button", { name: "Set End Time invalid date" }),
		);
		await userEvent.click(
			screen.getByRole("button", { name: "Create Session" }),
		);

		await expect
			.element(screen.getByText("Please enter valid dates"))
			.toBeVisible();
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

		const screen = await render(
			<EditSessionModal open onClose={onClose} session={session} />,
		);

		await screen.getByLabelText("Session Name").fill("Updated Name");
		await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

		await vi.waitFor(() => {
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

	it("uses the update failure fallback when saving an existing session fails", async () => {
		mockUpdateSession.mockRejectedValueOnce("boom");
		const onClose = vi.fn();
		const session: WorkoutSessionWithData = {
			id: "session-2",
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

		const screen = await render(
			<EditSessionModal open onClose={onClose} session={session} />,
		);

		await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

		await expect
			.element(screen.getByText("Failed to save session. Please try again."))
			.toBeVisible();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("tracks rating hover and clears the selected rating in create mode", async () => {
		const screen = await render(<EditSessionModal open onClose={vi.fn()} />);

		await userEvent.click(screen.getByRole("button", { name: "Set rating 3" }));
		await userEvent.click(screen.getByRole("button", { name: "Clear rating" }));

		await expect
			.element(screen.getByRole("button", { name: "Create Session" }))
			.toBeInTheDocument();
	});
});
