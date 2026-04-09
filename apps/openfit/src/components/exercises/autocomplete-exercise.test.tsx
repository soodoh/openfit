import { fireEvent, render, screen } from "@testing-library/react";
import { type ReactNode, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Exercise } from "@/lib/types";
import { AutocompleteExercise } from "./autocomplete-exercise";

const mockUseExerciseSearch = vi.fn();
const mockUseGym = vi.fn();
const mockUseGyms = vi.fn();
const mockUseUserProfile = vi.fn();

vi.mock("@/components/ui/command", () => ({
	Command: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	CommandEmpty: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	CommandGroup: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	CommandItem: ({
		children,
		onSelect,
	}: {
		children: ReactNode;
		onSelect?: () => void;
	}) => (
		<button type="button" onClick={onSelect}>
			{children}
		</button>
	),
	CommandList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
	DropdownMenu: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DropdownMenuContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DropdownMenuItem: ({
		children,
		onClick,
	}: {
		children: ReactNode;
		onClick?: () => void;
	}) => (
		<button type="button" onClick={onClick}>
			{children}
		</button>
	),
	DropdownMenuSeparator: () => <hr />,
	DropdownMenuTrigger: ({ children }: { children: ReactNode }) => (
		<>{children}</>
	),
}));

vi.mock("@/components/ui/popover", () => ({
	Popover: ({ children, open }: { children: ReactNode; open?: boolean }) => (
		<div data-open={open ? "true" : "false"}>{children}</div>
	),
	PopoverAnchor: ({ children }: { children: ReactNode }) => <>{children}</>,
	PopoverContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
}));

vi.mock("@/components/ui/input", () => ({
	Input: ({
		value,
		onBlur,
		onChange,
		onFocus,
		onKeyDown,
		placeholder,
	}: React.InputHTMLAttributes<HTMLInputElement>) => (
		<input
			placeholder={placeholder}
			value={value}
			onBlur={onBlur}
			onChange={onChange}
			onFocus={onFocus}
			onKeyDown={onKeyDown}
		/>
	),
}));

vi.mock("@/hooks", () => ({
	useExerciseSearch: (...args: unknown[]) => mockUseExerciseSearch(...args),
	useGym: (...args: unknown[]) => mockUseGym(...args),
	useGyms: (...args: unknown[]) => mockUseGyms(...args),
	useUserProfile: (...args: unknown[]) => mockUseUserProfile(...args),
}));

vi.mock("@/lib/use-exercise-lookups", () => ({
	useExerciseLookups: () => ({
		getMuscleGroupNames: (ids: string[] | undefined) =>
			(ids ?? []).map((id) => `muscle-${id}`),
	}),
}));

vi.mock("@unpic/react", () => ({
	Image: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

function ExerciseHarness({ initialValue }: { initialValue?: Exercise }) {
	const [value, setValue] = useState<Exercise | undefined>(initialValue);
	return <AutocompleteExercise value={value} onChange={setValue} />;
}

describe("AutocompleteExercise", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseGym.mockReturnValue({
			data: { equipmentIds: ["equipment-1"] },
		});
		mockUseGyms.mockReturnValue({
			data: [{ id: "gym-1", name: "Home Gym" }],
		});
		mockUseUserProfile.mockReturnValue({
			data: { defaultGymId: "gym-1" },
		});
		mockUseExerciseSearch.mockReturnValue({
			data: [
				{
					id: "exercise-1",
					name: "Bench Press",
					primaryMuscleIds: ["chest"],
				},
				{
					id: "exercise-2",
					name: "Deadlift",
					primaryMuscleIds: ["back"],
				},
			],
			isLoading: false,
		});
	});

	it("uses the default gym filter and selects the first result with Enter", () => {
		render(<ExerciseHarness />);

		expect(
			screen.getAllByRole("button", { name: "Home Gym" })[0],
		).toBeInTheDocument();

		const input = screen.getByPlaceholderText("Search exercises...");
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: "b" } });

		expect(mockUseExerciseSearch).toHaveBeenLastCalledWith("b", [
			"equipment-1",
		]);

		fireEvent.keyDown(input, { key: "Enter" });

		expect(screen.getByDisplayValue("Bench Press")).toBeInTheDocument();
	});

	it("keeps the selected exercise when Escape is pressed", () => {
		render(
			<ExerciseHarness
				initialValue={
					{
						id: "exercise-1",
						name: "Bench Press",
					} as Exercise
				}
			/>,
		);

		const input = screen.getByDisplayValue("Bench Press");
		fireEvent.keyDown(input, { key: "Escape" });

		expect(screen.getByDisplayValue("Bench Press")).toBeInTheDocument();
	});

	it("falls back to All when no default gym is configured", () => {
		mockUseUserProfile.mockReturnValue({ data: { defaultGymId: undefined } });
		mockUseGyms.mockReturnValue({ data: [] });
		mockUseGym.mockReturnValue({ data: undefined });

		render(<ExerciseHarness />);

		expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
		expect(mockUseExerciseSearch).toHaveBeenCalledWith("", undefined);
	});

	it("clears the selected exercise when typing a new character", () => {
		render(
			<ExerciseHarness
				initialValue={
					{
						id: "exercise-1",
						name: "Bench Press",
					} as Exercise
				}
			/>,
		);

		const input = screen.getByDisplayValue("Bench Press");
		fireEvent.keyDown(input, { key: "b" });

		expect(screen.getByDisplayValue("b")).toBeInTheDocument();
		expect(mockUseExerciseSearch).toHaveBeenLastCalledWith("b", [
			"equipment-1",
		]);
	});
});
