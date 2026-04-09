import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

	it("renders the fetched exercise details and closes from the footer button", () => {
		const onClose = vi.fn();

		render(
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
		expect(
			screen.getByRole("heading", { name: "Bench Press" }),
		).toBeInTheDocument();
		expect(screen.getByText("Compound Movement")).toBeInTheDocument();
		expect(screen.getByAltText("Bench Press - image 1")).toBeInTheDocument();
		expect(screen.getByText("Level")).toBeInTheDocument();
		expect(screen.getByText("Equipment")).toBeInTheDocument();
		expect(screen.getByText("Force")).toBeInTheDocument();
		expect(screen.getByText("Mechanic")).toBeInTheDocument();
		expect(screen.getByText("Primary Muscles")).toBeInTheDocument();
		expect(screen.getByText("Secondary Muscles")).toBeInTheDocument();
		expect(screen.getByText("Instructions")).toBeInTheDocument();

		screen.getByRole("button", { name: "Close" }).click();
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("falls back to the prop image when the fetched exercise has not loaded yet", () => {
		mockUseExercise.mockReturnValue({ data: undefined });

		render(
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
		expect(
			screen.getByRole("img", { name: "Bench Press" }),
		).toBeInTheDocument();
		expect(screen.queryByText("Instructions")).not.toBeInTheDocument();
	});
});
