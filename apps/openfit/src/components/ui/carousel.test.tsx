import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	Carousel,
	CarouselContent,
	CarouselDots,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "./carousel";

const mockCarouselRef = vi.fn();
const mockScrollPrev = vi.fn();
const mockScrollNext = vi.fn();
const mockScrollTo = vi.fn();

const mockApi = {
	canScrollPrev: vi.fn(() => true),
	canScrollNext: vi.fn(() => true),
	selectedScrollSnap: vi.fn(() => 1),
	scrollSnapList: vi.fn(() => [0, 1, 2]),
	scrollPrev: mockScrollPrev,
	scrollNext: mockScrollNext,
	scrollTo: mockScrollTo,
	on: vi.fn(),
	off: vi.fn(),
};

vi.mock("embla-carousel-react", () => ({
	default: () => [mockCarouselRef, mockApi],
}));

describe("carousel wrappers", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockApi.canScrollPrev.mockReturnValue(true);
		mockApi.canScrollNext.mockReturnValue(true);
		mockApi.selectedScrollSnap.mockReturnValue(1);
		mockApi.scrollSnapList.mockReturnValue([0, 1, 2]);
	});

	it("renders vertical controls and delegates navigation to embla", () => {
		render(
			<Carousel orientation="vertical">
				<CarouselContent data-testid="carousel-content">
					<CarouselItem>Slide 1</CarouselItem>
					<CarouselItem>Slide 2</CarouselItem>
				</CarouselContent>
				<CarouselPrevious />
				<CarouselNext />
				<CarouselDots />
			</Carousel>,
		);

		expect(screen.getByRole("region")).toHaveAttribute(
			"aria-roledescription",
			"carousel",
		);
		expect(screen.getByTestId("carousel-content")).toHaveClass("flex-col");
		expect(screen.getAllByRole("group")[0]).toHaveAttribute(
			"aria-roledescription",
			"slide",
		);
		expect(screen.getByRole("button", { name: "Previous slide" })).toHaveClass(
			"rotate-90",
		);
		expect(screen.getByRole("button", { name: "Next slide" })).toHaveClass(
			"rotate-90",
		);
		expect(screen.getByRole("button", { name: "Go to slide 2" })).toHaveClass(
			"bg-primary",
		);

		fireEvent.click(screen.getByRole("button", { name: "Previous slide" }));
		fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
		fireEvent.click(screen.getByRole("button", { name: "Go to slide 3" }));

		expect(mockScrollPrev).toHaveBeenCalledTimes(1);
		expect(mockScrollNext).toHaveBeenCalledTimes(1);
		expect(mockScrollTo).toHaveBeenCalledWith(2);
	});
});
