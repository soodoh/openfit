import { userEvent } from "@vitest/browser/context";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { Routine } from "@/lib/types";
import { EditRoutineModal } from "./edit-routine-modal";

const mockCreateRoutine = vi.fn();
const mockUpdateRoutine = vi.fn();

vi.mock("@/hooks", () => ({
	useCreateRoutine: () => ({
		mutateAsync: mockCreateRoutine,
	}),
	useUpdateRoutine: () => ({
		mutateAsync: mockUpdateRoutine,
	}),
}));

vi.mock("@/components/ui/button", () => ({
	Button: ({
		children,
		...props
	}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
		children: ReactNode;
	}) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/input", () => ({
	Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
		<input {...props} />
	),
}));

vi.mock("@/components/ui/label", () => ({
	Label: ({
		children,
		...props
	}: React.LabelHTMLAttributes<HTMLLabelElement> & { children: ReactNode }) => (
		<label htmlFor={props.htmlFor} {...props}>
			{children}
		</label>
	),
}));

describe("EditRoutineModal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCreateRoutine.mockResolvedValue({});
		mockUpdateRoutine.mockResolvedValue({});
	});

	it("creates a routine and closes the dialog on success", async () => {
		const onClose = vi.fn();

		const screen = await render(<EditRoutineModal open onClose={onClose} />);

		await screen.getByLabelText("Routine Name").fill("Push Pull Legs");
		await screen.getByLabelText(/Description/).fill("Three day split");
		await userEvent.click(
			screen.getByRole("button", { name: "Create Routine" }),
		);

		await vi.waitFor(() => {
			expect(mockCreateRoutine).toHaveBeenCalledWith({
				name: "Push Pull Legs",
				description: "Three day split",
			});
			expect(onClose).toHaveBeenCalledTimes(1);
		});
	});

	it("omits the description when the textarea is left blank", async () => {
		const onClose = vi.fn();

		const screen = await render(<EditRoutineModal open onClose={onClose} />);

		await screen.getByLabelText("Routine Name").fill("Minimal Routine");
		await userEvent.click(
			screen.getByRole("button", { name: "Create Routine" }),
		);

		await vi.waitFor(() => {
			expect(mockCreateRoutine).toHaveBeenCalledWith({
				name: "Minimal Routine",
				description: undefined,
			});
			expect(onClose).toHaveBeenCalledTimes(1);
		});
	});

	it("shows a save error when the mutation fails", async () => {
		mockCreateRoutine.mockRejectedValueOnce(new Error("boom"));

		const screen = await render(<EditRoutineModal open onClose={vi.fn()} />);

		await screen.getByLabelText("Routine Name").fill("Push Pull Legs");
		await userEvent.click(
			screen.getByRole("button", { name: "Create Routine" }),
		);

		await vi.waitFor(() => {
			expect(
				screen.getByText("Failed to save routine").element(),
			).toBeInTheDocument();
		});
	});

	it("updates an existing routine with the save changes label", async () => {
		const onClose = vi.fn();
		const routine = {
			id: "routine-1",
			userId: "user-1",
			name: "Upper Lower",
			description: "Existing description",
			createdAt: new Date("2026-03-01T00:00:00.000Z"),
			updatedAt: new Date("2026-03-01T00:00:00.000Z"),
			routineDays: [],
		} as Routine;

		const screen = await render(
			<EditRoutineModal open onClose={onClose} routine={routine} />,
		);

		await expect
			.element(screen.getByRole("button", { name: "Save Changes" }))
			.toBeInTheDocument();
		await screen.getByLabelText("Routine Name").fill("Upper Lower 2");
		await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

		await vi.waitFor(() => {
			expect(mockUpdateRoutine).toHaveBeenCalledWith({
				id: "routine-1",
				name: "Upper Lower 2",
				description: "Existing description",
			});
			expect(onClose).toHaveBeenCalledTimes(1);
		});
	});

	it("resets fields when the dialog reopens for another routine", async () => {
		const firstRoutine = {
			id: "routine-1",
			userId: "user-1",
			name: "Upper Lower",
			description: "Existing description",
			createdAt: new Date("2026-03-01T00:00:00.000Z"),
			updatedAt: new Date("2026-03-01T00:00:00.000Z"),
			routineDays: [],
		} as Routine;

		const screen = await render(
			<EditRoutineModal open onClose={vi.fn()} routine={firstRoutine} />,
		);

		await screen.getByLabelText("Routine Name").fill("Edited value");

		await screen.rerender(
			<EditRoutineModal
				open={false}
				onClose={vi.fn()}
				routine={firstRoutine}
			/>,
		);
		await screen.rerender(
			<EditRoutineModal open onClose={vi.fn()} routine={firstRoutine} />,
		);

		await vi.waitFor(() => {
			expect(screen.getByLabelText("Routine Name").element()).toHaveValue(
				"Upper Lower",
			);
			expect(screen.getByLabelText(/Description/).element()).toHaveValue(
				"Existing description",
			);
		});
	});

	it("closes from the dialog close button", async () => {
		const onClose = vi.fn();

		const screen = await render(<EditRoutineModal open onClose={onClose} />);

		await userEvent.click(screen.getByRole("button", { name: "Close" }));

		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
