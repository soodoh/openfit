import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ExercisesRoute from "./exercises";

const mockFetchNextPage = vi.fn();
const mockUseCategories = vi.fn();
const mockUseEquipment = vi.fn();
const mockUseExerciseSearch = vi.fn();
const mockUseExercises = vi.fn();
const mockUseInView = vi.fn();
const mockUseMuscleGroups = vi.fn();

vi.mock("@/components/exercises/exercise-card", () => ({
	ExerciseCard: ({ exercise }: { exercise: { id: string; name: string } }) => (
		<div data-testid="exercise-card">{exercise.name}</div>
	),
}));

vi.mock("@/components/ui/button", () => ({
	Button: ({
		children,
		onClick,
		...props
	}: {
		children: ReactNode;
		onClick?: () => void;
		[key: string]: unknown;
	}) => (
		<button type="button" onClick={onClick} {...props}>
			{children}
		</button>
	),
}));

vi.mock("@/components/ui/input", () => ({
	Input: ({
		value,
		onChange,
		...props
	}: {
		value: string;
		onChange: (event: { target: { value: string } }) => void;
		[key: string]: unknown;
	}) => (
		<input
			aria-label="Search exercises"
			value={value}
			onChange={onChange}
			{...props}
		/>
	),
}));

vi.mock("@/components/ui/select", () => ({
	Select: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	SelectContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	SelectItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	SelectTrigger: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	SelectValue: ({ placeholder }: { placeholder?: string }) => (
		<span>{placeholder}</span>
	),
}));

vi.mock("@/hooks", () => ({
	useCategories: () => mockUseCategories(),
	useEquipment: () => mockUseEquipment(),
	useExerciseSearch: (...args: unknown[]) => mockUseExerciseSearch(...args),
	useExercises: (...args: unknown[]) => mockUseExercises(...args),
	useInView: () => mockUseInView(),
	useMuscleGroups: () => mockUseMuscleGroups(),
}));

describe("exercises route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseCategories.mockReturnValue({
			data: [{ id: "category-1", name: "Back" }],
		});
		mockUseEquipment.mockReturnValue({
			data: [{ id: "equipment-1", name: "Barbell" }],
		});
		mockUseMuscleGroups.mockReturnValue({
			data: [{ id: "muscle-1", name: "Lats" }],
		});
		mockUseInView.mockReturnValue({ ref: vi.fn(), inView: false });
		mockUseExercises.mockReturnValue({
			data: { pages: [] },
			isLoading: false,
			fetchNextPage: mockFetchNextPage,
			hasNextPage: false,
			isFetchingNextPage: false,
		});
		mockUseExerciseSearch.mockImplementation((search: string) => ({
			data: search ? [] : [],
			isLoading: false,
		}));
	});

	it("shows a loading skeleton while exercises are pending", () => {
		mockUseExercises.mockReturnValue({
			data: undefined,
			isLoading: true,
			fetchNextPage: mockFetchNextPage,
			hasNextPage: false,
			isFetchingNextPage: false,
		});

		render(<ExercisesRoute.options.component />);

		expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
	});

	it("renders the empty library state when no exercises exist", () => {
		render(<ExercisesRoute.options.component />);

		expect(screen.getByText("No exercises available")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Exercise library is empty. Contact your administrator to seed the exercise database.",
			),
		).toBeInTheDocument();
	});

	it("renders exercises and fetches the next page when the sentinel is visible", async () => {
		mockUseExercises.mockReturnValue({
			data: {
				pages: [
					{
						page: [
							{ id: "exercise-1", name: "Barbell Row" },
							{ id: "exercise-2", name: "Bench Press" },
						],
					},
				],
			},
			isLoading: false,
			fetchNextPage: mockFetchNextPage,
			hasNextPage: true,
			isFetchingNextPage: false,
		});
		mockUseInView.mockReturnValue({ ref: vi.fn(), inView: true });

		render(<ExercisesRoute.options.component />);

		expect(screen.getByText("2 exercises total")).toBeInTheDocument();
		expect(screen.getByText("Barbell Row")).toBeInTheDocument();
		expect(screen.getByText("Bench Press")).toBeInTheDocument();

		await waitFor(() => {
			expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
		});
	});

	it("shows search results empty state when the search input has no matches", () => {
		mockUseExerciseSearch.mockImplementation((search: string) => ({
			data: search ? [] : [],
			isLoading: false,
		}));

		render(<ExercisesRoute.options.component />);

		fireEvent.change(screen.getByLabelText("Search exercises"), {
			target: { value: "missing" },
		});

		expect(screen.getByText("No exercises found")).toBeInTheDocument();
		expect(
			screen.getByText('No exercises match "missing"'),
		).toBeInTheDocument();
		expect(mockFetchNextPage).not.toHaveBeenCalled();
	});
});
