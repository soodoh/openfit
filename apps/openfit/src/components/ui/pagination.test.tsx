import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "./pagination";

vi.mock("./select", () => ({
	Select: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	SelectContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	SelectItem: ({ children, value }: { children: ReactNode; value: string }) => (
		<button type="button" onClick={() => undefined} data-value={value}>
			{children}
		</button>
	),
	SelectTrigger: ({ children }: { children: ReactNode }) => (
		<button type="button">{children}</button>
	),
	SelectValue: () => <span>page size</span>,
}));

describe("Pagination", () => {
	it("shows the no-results state and disables navigation on a single page", () => {
		render(
			<Pagination
				currentPage={1}
				totalPages={1}
				startIndex={0}
				endIndex={0}
				totalItems={0}
				pageSize={10}
				onPageChange={vi.fn()}
				onPrevPage={vi.fn()}
				onNextPage={vi.fn()}
				onPageSizeChange={vi.fn()}
			/>,
		);

		expect(screen.getByText("No results")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Previous page" }),
		).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "1" })).toBeDisabled();
	});

	it("renders ellipses around middle pages and delegates navigation", () => {
		const onPageChange = vi.fn();
		const onPrevPage = vi.fn();
		const onNextPage = vi.fn();

		render(
			<Pagination
				currentPage={4}
				totalPages={8}
				startIndex={31}
				endIndex={40}
				totalItems={80}
				pageSize={10}
				onPageChange={onPageChange}
				onPrevPage={onPrevPage}
				onNextPage={onNextPage}
				onPageSizeChange={vi.fn()}
			/>,
		);

		expect(screen.getByText("Showing 31-40 of 80")).toBeInTheDocument();
		expect(screen.getAllByText("...")).toHaveLength(2);

		fireEvent.click(screen.getByRole("button", { name: "3" }));
		fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
		fireEvent.click(screen.getByRole("button", { name: "Next page" }));

		expect(onPageChange).toHaveBeenCalledWith(3);
		expect(onPrevPage).toHaveBeenCalledTimes(1);
		expect(onNextPage).toHaveBeenCalledTimes(1);
	});

	it("renders only a trailing ellipsis near the beginning", () => {
		render(
			<Pagination
				currentPage={2}
				totalPages={8}
				startIndex={11}
				endIndex={20}
				totalItems={80}
				pageSize={10}
				onPageChange={vi.fn()}
				onPrevPage={vi.fn()}
				onNextPage={vi.fn()}
				onPageSizeChange={vi.fn()}
			/>,
		);

		expect(screen.getAllByText("...")).toHaveLength(1);
	});

	it("renders only a leading ellipsis near the end", () => {
		render(
			<Pagination
				currentPage={7}
				totalPages={8}
				startIndex={61}
				endIndex={70}
				totalItems={80}
				pageSize={10}
				onPageChange={vi.fn()}
				onPrevPage={vi.fn()}
				onNextPage={vi.fn()}
				onPageSizeChange={vi.fn()}
			/>,
		);

		expect(screen.getAllByText("...")).toHaveLength(1);
	});
});
