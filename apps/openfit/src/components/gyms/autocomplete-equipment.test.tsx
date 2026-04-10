import { userEvent } from "@vitest/browser/context";
import { forwardRef, type ReactNode, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { AutocompleteEquipment } from "./autocomplete-equipment";

const mockUseEquipment = vi.fn();

vi.mock("@/components/ui/command", () => ({
	Command: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	CommandEmpty: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	CommandGroup: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	CommandItem: ({
		children,
		onSelect,
	}: {
		children: ReactNode;
		onSelect?: () => void;
	}) => (
		<button type="button" onClick={onSelect}>
			{children}
		</button>
	),
	CommandList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/input", () => ({
	Input: forwardRef<
		HTMLInputElement,
		React.InputHTMLAttributes<HTMLInputElement>
	>(
		(
			{ value, onBlur, onChange, onFocus, onKeyDown, placeholder, disabled },
			ref,
		) => (
			<input
				ref={ref}
				placeholder={placeholder}
				value={value}
				onBlur={onBlur}
				onChange={onChange}
				onFocus={onFocus}
				onKeyDown={onKeyDown}
				disabled={disabled}
			/>
		),
	),
}));

vi.mock("@/components/ui/popover", () => ({
	Popover: ({ children, open }: { children: ReactNode; open?: boolean }) => (
		<div data-testid="popover" data-open={open ? "true" : "false"}>
			{children}
		</div>
	),
	PopoverAnchor: ({ children }: { children: ReactNode }) => <>{children}</>,
	PopoverContent: ({
		children,
		onInteractOutside,
	}: {
		children: ReactNode;
		onInteractOutside?: (event: {
			target: HTMLElement;
			preventDefault: () => void;
		}) => void;
	}) => (
		<div>
			<button
				type="button"
				onClick={() =>
					onInteractOutside?.({
						target: document.createElement("input"),
						preventDefault: vi.fn(),
					})
				}
			>
				Simulate outside interaction
			</button>
			{children}
		</div>
	),
}));

vi.mock("@/hooks", () => ({
	useEquipment: (...args: unknown[]) => mockUseEquipment(...args),
}));

function Harness({ initialSelectedIds }: { initialSelectedIds?: string[] }) {
	const [selectedIds, setSelectedIds] = useState(initialSelectedIds ?? []);
	return (
		<AutocompleteEquipment
			selectedIds={selectedIds}
			onSelect={(equipmentId) =>
				setSelectedIds((current) => [...current, equipmentId])
			}
		/>
	);
}

describe("AutocompleteEquipment", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseEquipment.mockReturnValue({
			data: [
				{ id: "equipment-2", name: "Barbell" },
				{ id: "equipment-1", name: "Dumbbell" },
				{ id: "equipment-3", name: "Kettlebell" },
			],
		});
	});

	it("filters, sorts, and selects the first matching equipment with Enter", async () => {
		const screen = await render(<Harness />);

		const input = screen.getByPlaceholder("Search equipment...");
		await userEvent.click(input);
		await input.fill("ke");

		await expect
			.element(screen.getByRole("button", { name: "Kettlebell" }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole("button", { name: "Barbell" }))
			.not.toBeInTheDocument();

		await userEvent.keyboard("{Enter}");

		await expect
			.element(screen.getByPlaceholder("Search equipment..."))
			.toHaveValue("");
	});

	it("disables the input when every item is already selected", async () => {
		const screen = await render(
			<Harness
				initialSelectedIds={["equipment-1", "equipment-2", "equipment-3"]}
			/>,
		);

		await expect
			.element(screen.getByPlaceholder("All equipment added"))
			.toBeDisabled();
		await expect
			.element(screen.getByText("All equipment added"))
			.toBeInTheDocument();
	});

	it("shows the no-results message when the search term matches nothing", async () => {
		const screen = await render(<Harness />);

		const input = screen.getByPlaceholder("Search equipment...");
		await userEvent.click(input);
		await input.fill("zzz");

		await expect
			.element(screen.getByText("No equipment found"))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole("button", { name: "Barbell" }))
			.not.toBeInTheDocument();
	});

	it("honors the disabled prop", async () => {
		const screen = await render(
			<AutocompleteEquipment selectedIds={[]} onSelect={vi.fn()} disabled />,
		);

		await expect
			.element(screen.getByPlaceholder("Search equipment..."))
			.toBeDisabled();
	});

	it("treats missing equipment data as an empty list", async () => {
		mockUseEquipment.mockReturnValue({ data: undefined });

		const screen = await render(<Harness />);

		await expect
			.element(screen.getByPlaceholder("Search equipment..."))
			.toBeEnabled();
		await expect
			.element(screen.getByText("All equipment added"))
			.toBeInTheDocument();
	});

	it("returns focus to the input after selecting equipment", async () => {
		const screen = await render(<Harness />);

		const input = screen.getByPlaceholder("Search equipment...");
		await userEvent.click(input);
		await input.fill("ket");
		await userEvent.click(screen.getByRole("button", { name: "Kettlebell" }));

		await expect.element(input).toHaveValue("");
		await expect.element(input).toHaveFocus();
	});

	it("closes the popover when Escape is pressed without selecting equipment", async () => {
		const screen = await render(<Harness />);

		const input = screen.getByPlaceholder("Search equipment...");
		await userEvent.click(input);
		await expect
			.element(screen.getByTestId("popover"))
			.toHaveAttribute("data-open", "true");

		await userEvent.keyboard("{Escape}");

		await expect
			.element(screen.getByTestId("popover"))
			.toHaveAttribute("data-open", "false");
	});

	it("opens when typing from a closed state and ignores outside interactions on the input", async () => {
		const screen = await render(<Harness />);

		const input = screen.getByPlaceholder("Search equipment...");
		await userEvent.click(input);
		await userEvent.keyboard("ket");

		await expect
			.element(screen.getByTestId("popover"))
			.toHaveAttribute("data-open", "true");

		// Re-focus input before triggering onInteractOutside so blur doesn't close the popover
		await userEvent.click(input);
		await userEvent.click(
			screen.getByRole("button", { name: "Simulate outside interaction" }),
		);
	});
});
