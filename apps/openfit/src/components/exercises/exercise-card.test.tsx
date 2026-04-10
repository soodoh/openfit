import { userEvent } from "@vitest/browser/context";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { ExerciseCard } from "./exercise-card";

const mockGetCategoryName = vi.fn();
const mockGetEquipmentName = vi.fn();
const mockGetMuscleGroupNames = vi.fn();

vi.mock("@unpic/react", () => ({
	Image: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("./exercise-detail-modal", () => ({
	ExerciseDetailModal: ({
		open,
		onClose,
	}: {
		open: boolean;
		onClose: () => void;
	}) =>
		open ? (
			<div>
				exercise detail open
				<button type="button" onClick={onClose}>
					Close detail
				</button>
			</div>
		) : null,
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

	it("renders summary details and opens the detail modal when clicked", async () => {
		const screen = await render(
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

		await expect
			.element(screen.getByRole("img", { name: "Bench Press" }))
			.toBeInTheDocument();
		await expect.element(screen.getByText("Body Weight")).toBeInTheDocument();
		await expect.element(screen.getByText("Barbell")).toBeInTheDocument();
		await expect.element(screen.getByText("Intermediate")).toBeInTheDocument();
		await expect.element(screen.getByText("+1")).toBeInTheDocument();

		await userEvent.click(screen.getByRole("button", { name: /Bench Press/i }));

		await expect
			.element(screen.getByText("exercise detail open"))
			.toBeInTheDocument();
	});

	it("renders the fallback icon and omits secondary metadata when the exercise is minimal", async () => {
		mockGetEquipmentName.mockReturnValue(undefined);
		mockGetMuscleGroupNames.mockReturnValue([]);

		const screen = await render(
			<ExerciseCard
				exercise={{
					id: "exercise-2",
					name: "Push Up",
					categoryId: "category-1",
					primaryMuscleIds: [],
				}}
			/>,
		);

		await expect.element(screen.getByText("Push Up")).toBeInTheDocument();
		await expect.element(screen.getByText("Body Weight")).toBeInTheDocument();
		await expect.element(screen.getByText("Barbell")).not.toBeInTheDocument();
		await expect
			.element(screen.getByText("Intermediate"))
			.not.toBeInTheDocument();
	});

	it("closes the detail modal when the modal requests to close", async () => {
		const screen = await render(
			<ExerciseCard
				exercise={{
					id: "exercise-3",
					name: "Incline Press",
					categoryId: "category-1",
					primaryMuscleIds: ["muscle-1"],
				}}
			/>,
		);

		await userEvent.click(
			screen.getByRole("button", { name: /Incline Press/i }),
		);
		await userEvent.click(screen.getByRole("button", { name: "Close detail" }));

		await expect
			.element(screen.getByText("exercise detail open"))
			.not.toBeInTheDocument();
	});
});
