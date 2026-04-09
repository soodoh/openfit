import { fireEvent, render, screen } from "@testing-library/react";
import { type ReactNode, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
	Input: ({
		value,
		onBlur,
		onChange,
		onFocus,
		onKeyDown,
		placeholder,
		disabled,
	}: React.InputHTMLAttributes<HTMLInputElement>) => (
		<input
			placeholder={placeholder}
			value={value}
			onBlur={onBlur}
			onChange={onChange}
			onFocus={onFocus}
			onKeyDown={onKeyDown}
			disabled={disabled}
		/>
	),
}));

vi.mock("@/components/ui/popover", () => ({
	Popover: ({ children, open }: { children: ReactNode; open?: boolean }) => (
		<div data-open={open ? "true" : "false"}>{children}</div>
	),
	PopoverAnchor: ({ children }: { children: ReactNode }) => <>{children}</>,
	PopoverContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
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

	it("filters, sorts, and selects the first matching equipment with Enter", () => {
		render(<Harness />);

		const input = screen.getByPlaceholderText("Search equipment...");
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: "ke" } });

		expect(
			screen.getByRole("button", { name: "Kettlebell" }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Barbell" }),
		).not.toBeInTheDocument();

		fireEvent.keyDown(input, { key: "Enter" });

		expect(screen.getByDisplayValue("")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("Search equipment...")).toHaveValue("");
	});

	it("disables the input when every item is already selected", () => {
		render(
			<Harness
				initialSelectedIds={["equipment-1", "equipment-2", "equipment-3"]}
			/>,
		);

		expect(screen.getByPlaceholderText("All equipment added")).toBeDisabled();
		expect(screen.getByText("All equipment added")).toBeInTheDocument();
	});

	it("shows the no-results message when the search term matches nothing", () => {
		render(<Harness />);

		const input = screen.getByPlaceholderText("Search equipment...");
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: "zzz" } });

		expect(screen.getByText("No equipment found")).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Barbell" }),
		).not.toBeInTheDocument();
	});

	it("honors the disabled prop", () => {
		render(
			<AutocompleteEquipment selectedIds={[]} onSelect={vi.fn()} disabled />,
		);

		expect(screen.getByPlaceholderText("Search equipment...")).toBeDisabled();
	});
});
