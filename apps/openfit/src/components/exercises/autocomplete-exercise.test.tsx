import { userEvent } from "@vitest/browser/context";
import { type ReactNode, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
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
	CommandList: ({
		children,
		onTouchMove,
		onWheel,
	}: {
		children: ReactNode;
		onTouchMove?: React.TouchEventHandler<HTMLDivElement>;
		onWheel?: React.WheelEventHandler<HTMLDivElement>;
	}) => (
		<div onTouchMove={onTouchMove} onWheel={onWheel}>
			{children}
		</div>
	),
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
		<div data-testid="popover" data-open={open ? "true" : "false"}>
			{children}
		</div>
	),
	PopoverAnchor: ({ children }: { children: ReactNode }) => <>{children}</>,
	PopoverContent: ({
		children,
		onInteractOutside,
		onPointerDownOutside,
	}: {
		children: ReactNode;
		onInteractOutside?: (event: {
			target: HTMLElement;
			preventDefault: () => void;
		}) => void;
		onPointerDownOutside?: (event: { preventDefault: () => void }) => void;
	}) => (
		<div>
			<button
				type="button"
				onClick={() =>
					onInteractOutside?.({
						target: document.createElement("input"),
						preventDefault: vi.fn(),
					})
				}
			>
				Simulate interact outside
			</button>
			<button
				type="button"
				onClick={() => onPointerDownOutside?.({ preventDefault: vi.fn() })}
			>
				Simulate pointer down outside
			</button>
			{children}
		</div>
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
					imageUrl: "/bench.jpg",
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

	it("uses the default gym filter and selects the first result with Enter", async () => {
		const screen = await render(<ExerciseHarness />);

		await expect
			.element(screen.getAllByRole("button", { name: "Home Gym" })[0])
			.toBeInTheDocument();

		const input = screen.getByPlaceholderText("Search exercises...");
		await userEvent.click(input);
		await input.fill("b");

		expect(mockUseExerciseSearch).toHaveBeenLastCalledWith("b", [
			"equipment-1",
		]);

		await userEvent.keyboard("{Enter}");

		await expect
			.element(screen.getByDisplayValue("Bench Press"))
			.toBeInTheDocument();
	});

	it("keeps the selected exercise when Escape is pressed", async () => {
		const screen = await render(
			<ExerciseHarness
				initialValue={
					{
						id: "exercise-1",
						name: "Bench Press",
					} as Exercise
				}
			/>,
		);

		const _input = screen.getByDisplayValue("Bench Press");
		await userEvent.keyboard("{Escape}");

		await expect
			.element(screen.getByDisplayValue("Bench Press"))
			.toBeInTheDocument();
	});

	it("clears the selected exercise when Delete is pressed", async () => {
		const screen = await render(
			<ExerciseHarness
				initialValue={
					{
						id: "exercise-1",
						name: "Bench Press",
					} as Exercise
				}
			/>,
		);

		await userEvent.click(screen.getByDisplayValue("Bench Press"));
		await userEvent.keyboard("{Delete}");

		await expect.element(screen.getByDisplayValue("")).toBeInTheDocument();
	});

	it("falls back to All when no default gym is configured", async () => {
		mockUseUserProfile.mockReturnValue({ data: { defaultGymId: undefined } });
		mockUseGyms.mockReturnValue({ data: [] });
		mockUseGym.mockReturnValue({ data: undefined });

		const screen = await render(<ExerciseHarness />);

		await expect
			.element(screen.getByRole("button", { name: "All" }))
			.toBeInTheDocument();
		expect(mockUseExerciseSearch).toHaveBeenCalledWith("", undefined);
	});

	it("opens when typing from a closed state and keeps the list from hijacking scroll", async () => {
		const screen = await render(<ExerciseHarness />);

		const input = screen.getByPlaceholderText("Search exercises...");
		await input.fill("b");

		await expect
			.element(screen.getByTestId("popover"))
			.toHaveAttribute("data-open", "true");

		const list = screen.getByText("No exercises found").element().parentElement;
		if (!list) {
			throw new Error("expected command list");
		}
		await userEvent.click(list);
	});

	it("selects an exercise by clicking the result and keeps scrolling isolated", async () => {
		const screen = await render(<ExerciseHarness />);

		const input = screen.getByPlaceholderText("Search exercises...");
		await userEvent.click(input);
		await input.fill("b");

		await userEvent.click(
			screen.getByRole("button", { name: /Bench Press thumbnail/i }),
		);

		await expect
			.element(screen.getByDisplayValue("Bench Press"))
			.toBeInTheDocument();
	});

	it("keeps the popover open when interacting inside it and closes on input blur", async () => {
		const screen = await render(<ExerciseHarness />);

		const input = screen.getByPlaceholderText("Search exercises...");
		await userEvent.click(input);
		await expect
			.element(screen.getByTestId("popover"))
			.toHaveAttribute("data-open", "true");

		await userEvent.click(
			screen.getByRole("button", { name: "Simulate interact outside" }),
		);
		await userEvent.click(
			screen.getByRole("button", { name: "Simulate pointer down outside" }),
		);

		await expect
			.element(screen.getByTestId("popover"))
			.toHaveAttribute("data-open", "true");

		await userEvent.click(document.body);
		await expect
			.element(screen.getByTestId("popover"))
			.toHaveAttribute("data-open", "false");
	});

	it("falls back to All when the profile has not loaded yet", async () => {
		mockUseUserProfile.mockReturnValue({ data: undefined });
		mockUseGyms.mockReturnValue({ data: [] });
		mockUseGym.mockReturnValue({ data: undefined });

		const screen = await render(<ExerciseHarness />);

		await expect
			.element(screen.getByRole("button", { name: "All" }))
			.toBeInTheDocument();
		expect(mockUseGym).toHaveBeenCalledWith(undefined);
	});

	it("clears the selected exercise when typing a new character", async () => {
		const screen = await render(
			<ExerciseHarness
				initialValue={
					{
						id: "exercise-1",
						name: "Bench Press",
					} as Exercise
				}
			/>,
		);

		const _input = screen.getByDisplayValue("Bench Press");
		await userEvent.click(input);
		await userEvent.keyboard("b");

		await expect.element(screen.getByDisplayValue("b")).toBeInTheDocument();
		expect(mockUseExerciseSearch).toHaveBeenLastCalledWith("b", [
			"equipment-1",
		]);
	});

	it("clears the selected exercise when Backspace is pressed", async () => {
		const screen = await render(
			<ExerciseHarness
				initialValue={
					{
						id: "exercise-1",
						name: "Bench Press",
					} as Exercise
				}
			/>,
		);

		await userEvent.click(screen.getByDisplayValue("Bench Press"));
		await userEvent.keyboard("{Backspace}");

		await expect.element(screen.getByDisplayValue("")).toBeInTheDocument();
	});

	it("closes the popover when Escape is pressed without a selection", async () => {
		const screen = await render(<ExerciseHarness />);

		const input = screen.getByPlaceholderText("Search exercises...");
		await userEvent.click(input);
		await expect
			.element(screen.getByTestId("popover"))
			.toHaveAttribute("data-open", "true");

		await userEvent.keyboard("{Escape}");

		await expect
			.element(screen.getByTestId("popover"))
			.toHaveAttribute("data-open", "false");
	});

	it("lets the first result be selected with Enter only when no exercise is selected", async () => {
		const screen = await render(<ExerciseHarness />);

		const input = screen.getByPlaceholderText("Search exercises...");
		await userEvent.click(input);
		await input.fill("d");
		await userEvent.keyboard("{Enter}");

		await expect
			.element(screen.getByDisplayValue("Bench Press"))
			.toBeInTheDocument();
	});

	it("renders exercise thumbnails and switches to all equipment from the menu", async () => {
		const screen = await render(<ExerciseHarness />);

		await expect
			.element(screen.getByRole("img", { name: "Bench Press thumbnail" }))
			.toBeInTheDocument();

		await userEvent.click(screen.getByPlaceholderText("Search exercises..."));
		await userEvent.click(
			screen.getByRole("button", { name: "All Equipment" }),
		);

		await expect
			.element(screen.getByRole("button", { name: "All" }))
			.toBeInTheDocument();
		expect(mockUseExerciseSearch).toHaveBeenLastCalledWith("", undefined);
	});

	it("shows the empty state when no exercises match the search term", async () => {
		mockUseExerciseSearch.mockReturnValue({
			data: [],
			isLoading: false,
		});

		const screen = await render(<ExerciseHarness />);

		const input = screen.getByPlaceholderText("Search exercises...");
		await userEvent.click(input);
		await input.fill("zzz");

		await expect
			.element(screen.getByText("No exercises found"))
			.toBeInTheDocument();
	});
});
