import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ExerciseCard } from "./exercise-card";

const mockGetCategoryName = vi.fn();
const mockGetEquipmentName = vi.fn();
const mockGetMuscleGroupNames = vi.fn();

vi.mock("@unpic/react", () => ({
	Image: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("./exercise-detail-modal", () => ({
	ExerciseDetailModal: ({ open }: { open: boolean }) =>
		open ? <div>exercise detail open</div> : null,
}));

vi.mock("@/components/ui/badge", () => ({
	Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock("@/lib/use-exercise-lookups", () => ({
	useExerciseLookups: () => ({
		getCategoryName: mockGetCategoryName,
		getEquipmentName: mockGetEquipmentName,
		getMuscleGroupNames: mockGetMuscleGroupNames,
	}),
}));

describe("ExerciseCard", () => {
	beforeEach(() => {
		mockGetCategoryName.mockReturnValue("body weight");
		mockGetEquipmentName.mockReturnValue("barbell");
		mockGetMuscleGroupNames.mockReturnValue([
			"chest",
			"triceps",
			"shoulders",
			"back",
		]);
	});

	it("renders summary details and opens the detail modal when clicked", () => {
		render(
			<ExerciseCard
				exercise={{
					id: "exercise-1",
					name: "Bench Press",
					categoryId: "category-1",
					equipmentId: "equipment-1",
					primaryMuscleIds: ["muscle-1"],
					level: "intermediate",
					imageUrl: "/bench.jpg",
				}}
			/>,
		);

		expect(
			screen.getByRole("img", { name: "Bench Press" }),
		).toBeInTheDocument();
		expect(screen.getByText("Body Weight")).toBeInTheDocument();
		expect(screen.getByText("Barbell")).toBeInTheDocument();
		expect(screen.getByText("Intermediate")).toBeInTheDocument();
		expect(screen.getByText("+1")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /Bench Press/i }));

		expect(screen.getByText("exercise detail open")).toBeInTheDocument();
	});

	it("renders the fallback icon and omits secondary metadata when the exercise is minimal", () => {
		mockGetEquipmentName.mockReturnValue(undefined);
		mockGetMuscleGroupNames.mockReturnValue([]);

		render(
			<ExerciseCard
				exercise={{
					id: "exercise-2",
					name: "Push Up",
					categoryId: "category-1",
					primaryMuscleIds: [],
				}}
			/>,
		);

		expect(screen.getByText("Push Up")).toBeInTheDocument();
		expect(screen.getByText("Body Weight")).toBeInTheDocument();
		expect(screen.queryByText("Barbell")).not.toBeInTheDocument();
		expect(screen.queryByText("Intermediate")).not.toBeInTheDocument();
	});
});
