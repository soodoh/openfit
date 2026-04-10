import { userEvent } from "@vitest/browser/context";
import { createContext, type ReactNode, useContext } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import ExercisesRoute from "./exercises";

const mockFetchNextPage = vi.fn();
const mockUseCategories = vi.fn();
const mockUseEquipment = vi.fn();
const mockUseExerciseSearch = vi.fn();
const mockUseExercises = vi.fn();
const mockUseInView = vi.fn();
const mockUseMuscleGroups = vi.fn();

const SelectValueContext = createContext<(value: string) => void>(() => {});

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
	Select: ({
		children,
		onValueChange,
		value,
	}: {
		children: ReactNode;
		onValueChange?: (value: string) => void;
		value?: string;
	}) => (
		<SelectValueContext.Provider value={onValueChange ?? (() => undefined)}>
			<div data-value={value}>{children}</div>
		</SelectValueContext.Provider>
	),
	SelectContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	SelectItem: ({ children, value }: { children: ReactNode; value: string }) => {
		const onValueChange = useContext(SelectValueContext);
		return (
			<button type="button" onClick={() => onValueChange(value)}>
				{children}
			</button>
		);
	},
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

	it("shows a loading skeleton while exercises are pending", async () => {
		mockUseExercises.mockReturnValue({
			data: undefined,
			isLoading: true,
			fetchNextPage: mockFetchNextPage,
			hasNextPage: false,
			isFetchingNextPage: false,
		});

		const screen = await render(<ExercisesRoute.options.component />);

		await expect.element(screen.getByRole("main")).toBeInTheDocument();
		expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
	});

	it("renders the empty library state when no exercises exist", async () => {
		const screen = await render(<ExercisesRoute.options.component />);

		await expect
			.element(screen.getByText("No exercises available"))
			.toBeInTheDocument();
		await expect
			.element(
				screen.getByText(
					"Exercise library is empty. Contact your administrator to seed the exercise database.",
				),
			)
			.toBeInTheDocument();
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

		const screen = await render(<ExercisesRoute.options.component />);

		await expect
			.element(screen.getByText("2 exercises total"))
			.toBeInTheDocument();
		await expect.element(screen.getByText("Barbell Row")).toBeInTheDocument();
		await expect.element(screen.getByText("Bench Press")).toBeInTheDocument();

		await vi.waitFor(() => {
			expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
		});
	});

	it("shows search results empty state when the search input has no matches", async () => {
		mockUseExerciseSearch.mockImplementation((search: string) => ({
			data: search ? [] : [],
			isLoading: false,
		}));

		const screen = await render(<ExercisesRoute.options.component />);

		await screen.getByLabelText("Search exercises").fill("missing");

		await expect
			.element(screen.getByText("No exercises found"))
			.toBeInTheDocument();
		await expect
			.element(screen.getByText('No exercises match "missing"'))
			.toBeInTheDocument();
		expect(mockFetchNextPage).not.toHaveBeenCalled();
	});

	it("applies filters and clears them from the empty state", async () => {
		mockUseExercises.mockReturnValue({
			data: { pages: [] },
			isLoading: false,
			fetchNextPage: mockFetchNextPage,
			hasNextPage: false,
			isFetchingNextPage: false,
		});

		const screen = await render(<ExercisesRoute.options.component />);

		await userEvent.click(screen.getByRole("button", { name: "Beginner" }));

		await vi.waitFor(() => {
			expect(mockUseExercises).toHaveBeenLastCalledWith(
				expect.objectContaining({ level: "beginner" }),
			);
		});

		await expect
			.element(screen.getAllByRole("button", { name: "Clear filters" }).nth(0))
			.toBeInTheDocument();

		await userEvent.click(
			screen.getAllByRole("button", { name: "Clear filters" }).nth(0),
		);

		await vi.waitFor(() => {
			expect(mockUseExercises).toHaveBeenLastCalledWith(
				expect.objectContaining({
					equipmentId: undefined,
					level: undefined,
					categoryId: undefined,
					primaryMuscleId: undefined,
				}),
			);
		});
	});
});
