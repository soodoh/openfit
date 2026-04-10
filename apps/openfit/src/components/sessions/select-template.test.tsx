import { userEvent } from "@vitest/browser/context";
import type { ReactNode } from "react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { RoutineDayWithRoutine } from "@/lib/types";
import { SelectTemplate } from "./select-template";

const mockUseRoutineDaySearch = vi.fn();

vi.mock("@/hooks", () => ({
	useRoutineDaySearch: (searchTerm: string) =>
		mockUseRoutineDaySearch(searchTerm),
}));

vi.mock("@/components/ui/popover", () => ({
	Popover: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	PopoverTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
	PopoverContent: ({
		children,
		onWheel,
		onTouchMove,
	}: {
		children: ReactNode;
		onWheel?: (event: { stopPropagation: () => void }) => void;
		onTouchMove?: (event: { stopPropagation: () => void }) => void;
	}) => (
		<div
			data-testid="popover-content"
			onWheel={() => onWheel?.({ stopPropagation: vi.fn() })}
			onTouchMove={() => onTouchMove?.({ stopPropagation: vi.fn() })}
		>
			{children}
		</div>
	),
}));

vi.mock("@/components/ui/command", () => ({
	Command: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	CommandEmpty: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	CommandGroup: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	CommandInput: ({
		onValueChange,
		placeholder,
	}: {
		onValueChange: (value: string) => void;
		placeholder?: string;
	}) => (
		<input
			aria-label={placeholder}
			placeholder={placeholder}
			onChange={(event) => onValueChange(event.target.value)}
		/>
	),
	CommandItem: ({
		children,
		onSelect,
	}: {
		children: ReactNode;
		onSelect: () => void;
	}) => (
		<button type="button" onClick={onSelect}>
			{children}
		</button>
	),
	CommandList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/label", () => ({
	Label: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const templateA: RoutineDayWithRoutine = {
	id: "template-a",
	routineId: "routine-a",
	userId: "user-1",
	description: "Push Day",
	weekdays: [],
	createdAt: new Date("2026-04-01T00:00:00.000Z"),
	updatedAt: new Date("2026-04-01T00:00:00.000Z"),
	routine: { id: "routine-a", name: "Strength" },
};

const templateB: RoutineDayWithRoutine = {
	id: "template-b",
	routineId: "routine-b",
	userId: "user-1",
	description: "Pull Day",
	weekdays: [],
	createdAt: new Date("2026-04-01T00:00:00.000Z"),
	updatedAt: new Date("2026-04-01T00:00:00.000Z"),
	routine: { id: "routine-b", name: "Strength" },
};

describe("SelectTemplate", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseRoutineDaySearch.mockReturnValue({
			data: [templateA, templateB],
			isLoading: false,
		});
	});

	it("updates the selection, shows routine metadata, and can clear the current template", async () => {
		const Harness = () => {
			const [value, setValue] = useState<RoutineDayWithRoutine | undefined>();
			return (
				<SelectTemplate
					value={value}
					onChange={setValue}
					disabled={false}
					label="Start from a Routine"
				/>
			);
		};

		const screen = await render(<Harness />);

		await expect
			.element(screen.getByRole("combobox"))
			.toHaveTextContent("Empty workout");
		await expect
			.element(screen.getByLabelText("Search workouts..."))
			.toHaveValue("");

		await screen.getByLabelText("Search workouts...").fill("push");
		expect(mockUseRoutineDaySearch).toHaveBeenLastCalledWith("push");

		await userEvent.click(
			screen.getByRole("button", { name: "Push DayStrength" }),
		);
		await expect
			.element(screen.getByRole("combobox"))
			.toHaveTextContent("Push Day");

		await userEvent.click(
			screen.getByRole("button", { name: "Push DayStrength" }),
		);
		await expect
			.element(screen.getByRole("combobox"))
			.toHaveTextContent("Empty workout");
	});

	it("shows loading and empty states from the search hook", async () => {
		mockUseRoutineDaySearch.mockReturnValueOnce({
			data: [],
			isLoading: true,
		});

		const screen = await render(
			<SelectTemplate
				value={undefined}
				onChange={vi.fn()}
				disabled={false}
				label="Start from a Routine"
			/>,
		);

		await expect.element(screen.getByText("Loading...")).toBeInTheDocument();

		mockUseRoutineDaySearch.mockReturnValueOnce({
			data: [],
			isLoading: false,
		});
		render(
			<SelectTemplate
				value={undefined}
				onChange={vi.fn()}
				disabled={false}
				label="Start from a Routine"
			/>,
		);

		await expect
			.element(screen.getByText("No workouts found."))
			.toBeInTheDocument();
	});

	it("disables the picker when requested", async () => {
		const screen = await render(
			<SelectTemplate
				value={undefined}
				onChange={vi.fn()}
				disabled
				label="Start from a Routine"
			/>,
		);

		await expect.element(screen.getByRole("combobox")).toBeDisabled();
	});

	it("stops wheel and touchmove propagation on the popover content", async () => {
		const screen = await render(
			<SelectTemplate
				value={undefined}
				onChange={vi.fn()}
				disabled={false}
				label="Start from a Routine"
			/>,
		);

		await userEvent.click(screen.getByTestId("popover-content"));
	});
});
