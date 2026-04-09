import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RoutinesRoute from "./routines";

const mockFetchNextPage = vi.fn();
const mockUseCurrentSession = vi.fn();
const mockUseInView = vi.fn();
const mockUseRoutines = vi.fn();

vi.mock("@/components/routines/create-routine", () => ({
	CreateRoutine: () => <button type="button">Create routine</button>,
}));

vi.mock("@/components/routines/routine-card", () => ({
	RoutineCard: ({ routine }: { routine: { id: string; name: string } }) => (
		<div data-testid="routine-card">{routine.name}</div>
	),
}));

vi.mock("@/components/sessions/resume-session-button", () => ({
	ResumeSessionButton: ({ session }: { session: { id: string } }) => (
		<div data-testid="resume-session-button">{session.id}</div>
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
			aria-label="Search routines"
			value={value}
			onChange={onChange}
			{...props}
		/>
	),
}));

vi.mock("@/hooks", () => ({
	useCurrentSession: () => mockUseCurrentSession(),
	useInView: () => mockUseInView(),
	useRoutines: (...args: unknown[]) => mockUseRoutines(...args),
}));

describe("routines route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseCurrentSession.mockReturnValue({ data: undefined });
		mockUseInView.mockReturnValue({ ref: vi.fn(), inView: false });
		mockUseRoutines.mockReturnValue({
			data: { pages: [] },
			isLoading: false,
			fetchNextPage: mockFetchNextPage,
			hasNextPage: false,
			isFetchingNextPage: false,
		});
	});

	it("shows a skeleton while routines are loading", () => {
		mockUseRoutines.mockReturnValue({
			data: undefined,
			isLoading: true,
			fetchNextPage: mockFetchNextPage,
			hasNextPage: false,
			isFetchingNextPage: false,
		});

		render(<RoutinesRoute.options.component />);

		expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
	});

	it("renders the empty state when there are no routines", () => {
		render(<RoutinesRoute.options.component />);

		expect(screen.getByText("No routines yet")).toBeInTheDocument();
		expect(
			screen.getByText(/Create your first workout routine/i),
		).toBeInTheDocument();
	});

	it("fetches the next page when the sentinel enters view and renders routines", async () => {
		mockUseCurrentSession.mockReturnValue({
			data: { id: "session-1" },
		});
		mockUseInView.mockReturnValue({ ref: vi.fn(), inView: true });
		mockUseRoutines.mockReturnValue({
			data: {
				pages: [
					{
						page: [
							{ id: "routine-1", name: "Push Day" },
							{ id: "routine-2", name: "Pull Day" },
						],
					},
				],
			},
			isLoading: false,
			fetchNextPage: mockFetchNextPage,
			hasNextPage: true,
			isFetchingNextPage: false,
		});

		render(<RoutinesRoute.options.component />);

		expect(screen.getByText("Create routine")).toBeInTheDocument();
		expect(screen.getByText("Push Day")).toBeInTheDocument();
		expect(screen.getByText("Pull Day")).toBeInTheDocument();
		expect(screen.getByText("2 routines total")).toBeInTheDocument();

		await waitFor(() => {
			expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
		});
	});

	it("shows the search empty state without paging when no routines match", () => {
		mockUseRoutines.mockImplementation((args: { search?: string }) => {
			if (args.search) {
				return {
					data: { pages: [] },
					isLoading: false,
					fetchNextPage: mockFetchNextPage,
					hasNextPage: false,
					isFetchingNextPage: false,
				};
			}

			return {
				data: {
					pages: [
						{
							page: [{ id: "routine-1", name: "Push Day" }],
						},
					],
				},
				isLoading: false,
				fetchNextPage: mockFetchNextPage,
				hasNextPage: false,
				isFetchingNextPage: false,
			};
		});

		render(<RoutinesRoute.options.component />);

		fireEvent.change(screen.getByLabelText("Search routines"), {
			target: { value: "missing" },
		});

		expect(screen.getByText("No routines found")).toBeInTheDocument();
		expect(screen.getByText('No routines match "missing"')).toBeInTheDocument();
		expect(mockFetchNextPage).not.toHaveBeenCalled();
	});
});
