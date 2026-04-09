import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
	PopoverContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
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

	it("updates the selection, shows routine metadata, and can clear the current template", () => {
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

		render(<Harness />);

		expect(screen.getByRole("combobox")).toHaveTextContent("Empty workout");
		expect(screen.getByLabelText("Search workouts...")).toHaveValue("");

		fireEvent.change(screen.getByLabelText("Search workouts..."), {
			target: { value: "push" },
		});
		expect(mockUseRoutineDaySearch).toHaveBeenLastCalledWith("push");

		fireEvent.click(screen.getByRole("button", { name: "Push DayStrength" }));
		expect(screen.getByRole("combobox")).toHaveTextContent("Push Day");

		fireEvent.click(screen.getByRole("button", { name: "Push DayStrength" }));
		expect(screen.getByRole("combobox")).toHaveTextContent("Empty workout");
	});

	it("shows loading and empty states from the search hook", () => {
		mockUseRoutineDaySearch.mockReturnValueOnce({
			data: [],
			isLoading: true,
		});

		render(
			<SelectTemplate
				value={undefined}
				onChange={vi.fn()}
				disabled={false}
				label="Start from a Routine"
			/>,
		);

		expect(screen.getByText("Loading...")).toBeInTheDocument();

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

		expect(screen.getByText("No workouts found.")).toBeInTheDocument();
	});
});
