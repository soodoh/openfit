import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { ExerciseDetailModal } from "./exercise-detail-modal";

const mockUseExercise = vi.fn();

vi.mock("@unpic/react", () => ({
	Image: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("@/components/ui/badge", () => ({
	Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock("@/components/ui/button", () => ({
	Button: ({
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
}));

vi.mock("@/components/ui/carousel", () => ({
	Carousel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	CarouselContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	CarouselDots: () => <div data-testid="carousel-dots" />,
	CarouselItem: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	CarouselNext: () => <button type="button">Next</button>,
	CarouselPrevious: () => <button type="button">Previous</button>,
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

vi.mock("@/hooks", () => ({
	useExercise: (...args: unknown[]) => mockUseExercise(...args),
}));

vi.mock("@/lib/use-exercise-lookups", () => ({
	useExerciseLookups: () => ({
		getCategoryName: (id: string) =>
			({ "category-1": "compound movement" })[id] ?? "",
		getEquipmentName: (id: string | undefined) =>
			({ "equipment-1": "barbell" })[id ?? ""] ?? undefined,
		getMuscleGroupNames: (ids: string[] | undefined) =>
			(ids ?? []).map(
				(id) =>
					({ chest: "chest", triceps: "triceps", shoulders: "shoulders" })[
						id
					] ?? id,
			),
	}),
}));

describe("ExerciseDetailModal", () => {
	beforeEach(() => {
		mockUseExercise.mockReturnValue({
			data: {
				id: "exercise-1",
				name: "Bench Press",
				categoryId: "category-1",
				equipmentId: "equipment-1",
				level: "intermediate",
				force: "push",
				mechanic: "compound",
				primaryMuscleIds: ["chest", "triceps"],
				secondaryMuscleIds: ["shoulders"],
				instructions: ["Set your shoulders", "Press the bar"],
				imageUrls: ["/bench-1.jpg", "/bench-2.jpg"],
				imageUrl: "/bench-cover.jpg",
			},
		});
	});

	it("renders the fetched exercise details and closes from the footer button", async () => {
		const onClose = vi.fn();

		const screen = await render(
			<ExerciseDetailModal
				exercise={{
					id: "exercise-1",
					name: "Bench Press",
					imageUrl: "/bench-cover.jpg",
				}}
				open
				onClose={onClose}
			/>,
		);

		expect(mockUseExercise).toHaveBeenCalledWith("exercise-1");
		await expect
			.element(screen.getByRole("heading", { name: "Bench Press" }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByText("Compound Movement"))
			.toBeInTheDocument();
		await expect
			.element(screen.getByAltText("Bench Press - image 1"))
			.toBeInTheDocument();
		await expect.element(screen.getByText("Level")).toBeInTheDocument();
		await expect.element(screen.getByText("Equipment")).toBeInTheDocument();
		await expect.element(screen.getByText("Force")).toBeInTheDocument();
		await expect.element(screen.getByText("Mechanic")).toBeInTheDocument();
		await expect
			.element(screen.getByText("Primary Muscles"))
			.toBeInTheDocument();
		await expect
			.element(screen.getByText("Secondary Muscles"))
			.toBeInTheDocument();
		await expect.element(screen.getByText("Instructions")).toBeInTheDocument();

		await screen.getByRole("button", { name: "Close" }).click();
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("falls back to the prop image when the fetched exercise has not loaded yet", async () => {
		mockUseExercise.mockReturnValue({ data: undefined });

		const screen = await render(
			<ExerciseDetailModal
				exercise={{
					id: "exercise-1",
					name: "Bench Press",
					imageUrl: "/bench-cover.jpg",
				}}
				open
				onClose={vi.fn()}
			/>,
		);

		expect(mockUseExercise).toHaveBeenCalledWith("exercise-1");
		await expect
			.element(screen.getByRole("img", { name: "Bench Press" }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByText("Instructions"))
			.not.toBeInTheDocument();
	});
});
