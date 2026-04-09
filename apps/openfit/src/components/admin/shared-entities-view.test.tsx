import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SharedEntitiesView } from "./shared-entities-view";

const mockLookupTable = vi.fn(
	({ title, lookupType }: { title: string; lookupType: string }) => (
		<div>{`${title} (${lookupType})`}</div>
	),
);

vi.mock("./exercise-table", () => ({
	ExerciseTable: () => <div>Exercises body</div>,
}));

vi.mock("./lookup-table", () => ({
	LookupTable: (props: {
		title: string;
		singularTitle: string;
		lookupType: string;
	}) => mockLookupTable(props),
}));

describe("SharedEntitiesView", () => {
	it("renders the exercise tab by default and swaps lookup tabs when selected", () => {
		render(<SharedEntitiesView />);

		expect(screen.getByText("Exercises body")).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: "Equipment" })).toBeInTheDocument();
	});
});
