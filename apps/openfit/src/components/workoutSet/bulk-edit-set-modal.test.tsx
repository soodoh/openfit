import { userEvent } from "@vitest/browser/context";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { SetGroupWithRelations, Units } from "@/lib/types";
import { SetType } from "@/lib/types";
import { BulkEditSetModal } from "./bulk-edit-set-modal";

const mockBulkEditSetGroup = vi.fn();

vi.mock("@/hooks", () => ({
	useBulkEditSetGroup: () => ({
		mutateAsync: mockBulkEditSetGroup,
	}),
}));

vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({ children, open }: { children: ReactNode; open: boolean }) =>
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

vi.mock("@/components/ui/button", () => ({
	Button: ({
		children,
		...props
	}: {
		children: ReactNode;
		[key: string]: unknown;
	}) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/duration-input", () => ({
	DurationInput: ({
		id,
		value,
		onChange,
	}: {
		id: string;
		value: string;
		onChange: (value: string) => void;
	}) => (
		<input
			aria-label={id}
			value={value}
			onChange={(event) => onChange(event.target.value)}
		/>
	),
	parseDurationToSeconds: (value: string) => {
		if (!value) {
			return 0;
		}
		const [minutes, seconds = "0"] = value.split(":");
		return Number.parseInt(minutes, 10) * 60 + Number.parseInt(seconds, 10);
	},
}));

vi.mock("./rep-unit-menu", () => ({
	RepUnitMenu: ({
		label,
		onChange,
	}: {
		label: string;
		onChange: (unit: { id: string; name: string }) => void;
	}) => (
		<button
			type="button"
			onClick={() => onChange({ id: "seconds", name: "Seconds" })}
		>
			{label}
		</button>
	),
}));

vi.mock("./weight-unit-menu", () => ({
	WeightUnitMenu: ({
		label,
		onChange,
	}: {
		label: string;
		onChange: (unit: { id: string; name: string }) => void;
	}) => (
		<button type="button" onClick={() => onChange({ id: "kg", name: "kg" })}>
			{label}
		</button>
	),
}));

const units: Units = {
	repetitionUnits: [
		{ id: "reps", name: "Reps" },
		{ id: "seconds", name: "Seconds" },
	],
	weightUnits: [
		{ id: "lb", name: "lb" },
		{ id: "kg", name: "kg" },
	],
};

const setGroup: SetGroupWithRelations = {
	id: "group-1",
	userId: "user-1",
	routineDayId: null,
	sessionId: "session-1",
	type: SetType.NORMAL,
	order: 0,
	comment: null,
	sets: [
		{
			id: "set-1",
			userId: "user-1",
			setGroupId: "group-1",
			exerciseId: "exercise-1",
			type: SetType.NORMAL,
			order: 0,
			reps: 8,
			repetitionUnitId: "reps",
			weight: 135,
			weightUnitId: "lb",
			restTime: 90,
			completed: false,
			exercise: { id: "exercise-1", name: "Bench", imageUrl: null },
			repetitionUnit: { id: "reps", name: "Reps" },
			weightUnit: { id: "lb", name: "lb" },
		},
	],
};

describe("BulkEditSetModal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockBulkEditSetGroup.mockResolvedValue({});
	});

	it("submits the parsed edits and closes on success", async () => {
		const onClose = vi.fn();

		const screen = await render(
			<BulkEditSetModal
				open
				onClose={onClose}
				setGroup={setGroup}
				units={units}
			/>,
		);

		await screen.getByPlaceholder("8").fill("10");
		await screen.getByLabelText("rest-timer").fill("1:30");
		await userEvent.click(screen.getByRole("button", { name: "Reps" }));
		await userEvent.click(screen.getByRole("button", { name: "lb" }));
		await userEvent.click(screen.getByRole("button", { name: "Update" }));

		await vi.waitFor(() => {
			expect(mockBulkEditSetGroup).toHaveBeenCalledWith({
				id: "group-1",
				reps: 10,
				weight: undefined,
				repetitionUnitId: "seconds",
				weightUnitId: "kg",
				restTime: 90,
			});
		});
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("cancels without mutating", async () => {
		const onClose = vi.fn();

		const screen = await render(
			<BulkEditSetModal
				open
				onClose={onClose}
				setGroup={setGroup}
				units={units}
			/>,
		);

		await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

		expect(onClose).toHaveBeenCalledTimes(1);
		expect(mockBulkEditSetGroup).not.toHaveBeenCalled();
	});

	it("submits empty reps and a parsed weight without changing the rest timer", async () => {
		const onClose = vi.fn();

		const screen = await render(
			<BulkEditSetModal
				open
				onClose={onClose}
				setGroup={setGroup}
				units={units}
			/>,
		);

		await screen.getByPlaceholder("135").fill("150");
		await userEvent.click(screen.getByRole("button", { name: "lb" }));
		await userEvent.click(screen.getByRole("button", { name: "Update" }));

		await vi.waitFor(() => {
			expect(mockBulkEditSetGroup).toHaveBeenCalledWith({
				id: "group-1",
				reps: undefined,
				weight: 150,
				repetitionUnitId: "reps",
				weightUnitId: "kg",
				restTime: 0,
			});
		});
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("handles an empty set group shape without preset units", async () => {
		const onClose = vi.fn();

		const screen = await render(
			<BulkEditSetModal
				open
				onClose={onClose}
				setGroup={{
					...setGroup,
					sets: [],
				}}
				units={units}
			/>,
		);

		await userEvent.click(screen.getByRole("button", { name: "Update" }));

		await vi.waitFor(() => {
			expect(mockBulkEditSetGroup).toHaveBeenCalledWith({
				id: "group-1",
				reps: undefined,
				weight: undefined,
				repetitionUnitId: undefined,
				weightUnitId: undefined,
				restTime: 0,
			});
		});
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
