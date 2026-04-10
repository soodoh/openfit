import { userEvent } from "@vitest/browser/context";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { WorkoutSessionWithData } from "@/lib/types";
import { CreateSessionButton } from "./create-session";
import { DeleteSessionModal } from "./delete-session-modal";
import { EditNamePopover } from "./edit-name-popover";
import { ResumeSessionButton } from "./resume-session-button";

const mockCreateSession = vi.fn();
const mockDeleteSession = vi.fn();
const mockUpdateSession = vi.fn();

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: { children: ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	),
}));

vi.mock("@/hooks", () => ({
	useCreateSession: () => ({ mutateAsync: mockCreateSession }),
	useDeleteSession: () => ({ mutateAsync: mockDeleteSession }),
	useUpdateSession: () => ({ mutateAsync: mockUpdateSession }),
}));

vi.mock("./edit-session-modal", () => ({
	EditSessionModal: ({
		open,
		onClose,
	}: {
		open: boolean;
		onClose: () => void;
	}) =>
		open ? (
			<div data-testid="edit-session-modal">
				<button type="button" onClick={onClose}>
					Close create session modal
				</button>
			</div>
		) : null,
}));

vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({ open, children }: { open: boolean; children: ReactNode }) =>
		open ? <div>{children}</div> : null,
	DialogContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogDescription: ({ children }: { children: ReactNode }) => (
		<p>{children}</p>
	),
	DialogFooter: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogHeader: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

vi.mock("@/components/ui/popover", () => ({
	Popover: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	PopoverContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	PopoverTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const session = {
	id: "session-1",
	userId: "user-1",
	name: "Leg Day",
	notes: "Keep going",
	impression: 4,
	startTime: new Date("2026-04-08T09:00:00.000Z"),
	endTime: new Date("2026-04-08T10:15:00.000Z"),
	templateId: null,
	createdAt: new Date("2026-04-08T09:00:00.000Z"),
	updatedAt: new Date("2026-04-08T09:00:00.000Z"),
	setGroups: [
		{
			id: "group-1",
			userId: "user-1",
			routineDayId: null,
			sessionId: "session-1",
			type: "NORMAL",
			order: 0,
			comment: null,
			sets: [
				{
					id: "set-1",
					userId: "user-1",
					setGroupId: "group-1",
					exerciseId: "exercise-1",
					type: "NORMAL",
					order: 0,
					reps: 8,
					repetitionUnitId: "rep",
					weight: 135,
					weightUnitId: "weight",
					restTime: 90,
					completed: true,
					exercise: { id: "exercise-1", name: "Bench", imageUrl: null },
					repetitionUnit: { id: "rep", name: "Reps" },
					weightUnit: { id: "weight", name: "lb" },
				},
			],
		},
	],
} satisfies WorkoutSessionWithData;

describe("session controls", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCreateSession.mockResolvedValue({});
		mockDeleteSession.mockResolvedValue({});
		mockUpdateSession.mockResolvedValue({});
	});

	it("opens the create session modal", async () => {
		const screen = await render(<CreateSessionButton />);

		await userEvent.click(screen.getByRole("button", { name: "New Session" }));
		await expect
			.element(screen.getByTestId("edit-session-modal"))
			.toBeInTheDocument();
	});

	it("closes the create session modal when the nested modal closes", async () => {
		const screen = await render(<CreateSessionButton />);

		await userEvent.click(screen.getByRole("button", { name: "New Session" }));
		await userEvent.click(
			screen.getByRole("button", { name: "Close create session modal" }),
		);

		await expect
			.element(screen.getByTestId("edit-session-modal"))
			.not.toBeInTheDocument();
	});

	it("deletes a session after confirmation", async () => {
		const onClose = vi.fn();

		const screen = await render(
			<DeleteSessionModal open onClose={onClose} sessionId="session-1" />,
		);
		await userEvent.click(screen.getByRole("button", { name: "Yes" }));

		await vi.waitFor(() => {
			expect(mockDeleteSession).toHaveBeenCalledWith("session-1");
		});
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("updates the session name", async () => {
		const screen = await render(
			<div>
				<EditNamePopover session={session} />
			</div>,
		);

		await userEvent.click(screen.getAllByRole("button")[0]);
		await screen.getByLabelText("Session Name").fill("Updated Name");
		await userEvent.click(screen.getAllByRole("button", { name: "Save" })[0]);

		await vi.waitFor(() => {
			expect(mockUpdateSession).toHaveBeenCalledWith({
				id: "session-1",
				name: "Updated Name",
			});
		});
	});

	it("shows set count only when sets exist in resume session button", async () => {
		const screen = await render(<ResumeSessionButton session={session} />);
		await expect
			.element(screen.getByText("1 of 1 sets completed"))
			.toBeInTheDocument();

		screen.rerender(
			<ResumeSessionButton
				session={{
					...session,
					setGroups: [],
				}}
			/>,
		);

		await expect
			.element(screen.getByText(/sets completed/))
			.not.toBeInTheDocument();
	});
});
